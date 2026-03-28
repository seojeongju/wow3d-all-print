const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https');

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => reject(new Error(`Failed to get '${url}' (${response.statusCode})`)));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function run() {
    console.log('Fetching source posts...');
    const url = 'https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=100';
    const r = await fetch(url);
    const j = await r.json();

    if (!j.data || j.data.length === 0) {
        console.log('No data to process.');
        return;
    }

    // 마이그레이션 폴더 없으면 생성
    if (!fs.existsSync('./_temp_migration')) {
        fs.mkdirSync('./_temp_migration');
    }

    console.log(`Found ${j.data.length} posts. Start migration to R2...`);

    let successCount = 0;
    let failCount = 0;

    for (const post of j.data) {
        let originalImgUrl = (post.images && post.images.length) ? post.images[0] : (post.thumbnail_url || '');
        if (!originalImgUrl && post.content) {
            let m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (m) originalImgUrl = m[1];
        }

        if (!originalImgUrl) continue;

        // 원본 사이트 이미지 구조 상, /api/upload/files/images/posts/xxxxx.jpg 형태
        // 만약 도메인이 안붙어 있다면 붙인다.
        if (originalImgUrl.startsWith('/')) {
            originalImgUrl = 'https://3dcookiehd.pages.dev' + originalImgUrl;
        }

        const filename = originalImgUrl.split('/').pop().split('?')[0]; // "1774668459628_grhz6o_xxx.jpg"
        const localPath = `./_temp_migration/${filename}`;
        
        // r2 올라갈 최종 이름 (예: gallery/migration/11_17746...jpg)
        // post.id 가 기존 DB의 id인지는 확신할 수 없으나, 아까 로그에서 11_1774... 였다면 맞을 가능성이 큼.
        const r2Key = `gallery/migration/${post.id}_${filename}`;

        console.log(`[Item ID: ${post.id}] Downloading: ${originalImgUrl}`);
        try {
            await downloadImage(originalImgUrl, localPath);
            console.log(` -> Downloaded to ${localPath}, Put to R2...`);
            // Wrangler 로 r2 업로드
            // npx wrangler r2 object put wow3d-files/gallery/migration/... --file ... 
            const cmd = `npx wrangler r2 object put wow3d-files/${r2Key} --file "${localPath}" --remote`;
            execSync(cmd, { stdio: 'pipe' }); // stdio: pipe to hide huge outputs
            console.log(` -> ✅ Uploaded R2: wow3d-files/${r2Key}`);
            successCount++;
        } catch(e) {
            console.log(` -> ❌ Error on ID ${post.id}: ${e.message}`);
            failCount++;
        }
    }

    console.log(`Migration Done! Success: ${successCount}, Fail: ${failCount}`);
}

run();
