import JSZip from 'jszip'

export type AdminUserExportRow = {
    id: number
    email: string | null
    name: string | null
    phone: string | null
    role: string | null
    created_at: string | null
}

function xmlEscape(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function roleLabel(role: string | null): string {
    if (role === 'admin' || role === 'super_admin') return '관리자'
    return '일반회원'
}

function formatCreatedAt(raw: string | null): string {
    if (!raw) return ''
    const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z')
    if (Number.isNaN(d.getTime())) return raw
    return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

function colLetter(index: number): string {
    // 0 -> A
    let n = index
    let s = ''
    while (n >= 0) {
        s = String.fromCharCode(65 + (n % 26)) + s
        n = Math.floor(n / 26) - 1
    }
    return s
}

function inlineCell(row: number, col: number, text: string): string {
    const ref = `${colLetter(col)}${row}`
    return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(text)}</t></is></c>`
}

/**
 * 관리자 사용자 목록 → Excel(.xlsx) ArrayBuffer
 */
export async function buildAdminUsersXlsx(rows: AdminUserExportRow[]): Promise<ArrayBuffer> {
    const headers = ['ID', '이메일', '이름', '연락처', '역할', '가입일']
    const dataRows = rows.map((u) => [
        String(u.id),
        u.email || '',
        u.name || '',
        u.phone || '',
        roleLabel(u.role),
        formatCreatedAt(u.created_at),
    ])

    const sheetRows: string[] = []
    sheetRows.push(
        `<row r="1">${headers.map((h, i) => inlineCell(1, i, h)).join('')}</row>`
    )
    dataRows.forEach((cells, idx) => {
        const r = idx + 2
        sheetRows.push(
            `<row r="${r}">${cells.map((c, i) => inlineCell(r, i, c)).join('')}</row>`
        )
    })

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRows.join('\n    ')}
  </sheetData>
</worksheet>`

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="사용자목록" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`

    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
</Relationships>`

    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>`

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`

    const zip = new JSZip()
    zip.file('[Content_Types].xml', contentTypes)
    zip.folder('_rels')?.file('.rels', rootRels)
    const xl = zip.folder('xl')
    xl?.file('workbook.xml', workbookXml)
    xl?.folder('_rels')?.file('workbook.xml.rels', workbookRels)
    xl?.folder('worksheets')?.file('sheet1.xml', sheetXml)

    return zip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    })
}
