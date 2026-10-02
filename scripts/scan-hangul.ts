/**
 * 공개 페이지(영문 노출 가능)에 하드코딩된 한글 문자열 탐지.
 * 주석·console 인자는 제외하고 문자열/템플릿/JSX 텍스트만 출력한다.
 * 사용: npx --yes tsx scripts/scan-hangul.ts [경로...]
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const DEFAULT_TARGETS = ['app/[locale]', 'components', 'lib', 'i18n', 'hooks', 'store'];
const EXCLUDE = [/[\\/]admin[\\/]/i, /[\\/]Admin[A-Z]/, /scan-hangul/, /\.test\./, /[\\/]api[\\/]/];
const HANGUL = /[가-힣]/;

function walk(p: string, out: string[]) {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
        for (const f of fs.readdirSync(p)) walk(path.join(p, f), out);
    } else if (/\.(tsx?|jsx?)$/.test(p) && !EXCLUDE.some((r) => r.test(p))) {
        out.push(p);
    }
}

function isInsideConsole(node: ts.Node): boolean {
    let cur: ts.Node | undefined = node.parent;
    while (cur) {
        if (ts.isCallExpression(cur)) {
            const txt = cur.expression.getText();
            if (/^console\./.test(txt)) return true;
        }
        cur = cur.parent;
    }
    return false;
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS;
const files: string[] = [];
for (const t of targets) {
    const abs = path.join(ROOT, t);
    if (fs.existsSync(abs)) walk(abs, files);
}

const byFile = new Map<string, { line: number; text: string }[]>();
for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (!HANGUL.test(src)) continue;
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const hits: { line: number; text: string }[] = [];
    const visit = (node: ts.Node) => {
        let text: string | null = null;
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
        else if (ts.isTemplateExpression(node)) text = node.getText();
        else if (ts.isJsxText(node)) text = node.getText().trim();
        if (text && HANGUL.test(text) && !isInsideConsole(node)) {
            const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            hits.push({ line, text: text.replace(/\s+/g, ' ').slice(0, 110) });
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    if (hits.length) byFile.set(path.relative(ROOT, file), hits);
}

let total = 0;
for (const [f, hits] of [...byFile].sort((a, b) => b[1].length - a[1].length)) {
    total += hits.length;
    console.log(`\n## ${f} (${hits.length})`);
    for (const h of hits) console.log(`  ${h.line}: ${h.text}`);
}
console.log(`\n총 ${byFile.size}개 파일, ${total}개 문자열`);
