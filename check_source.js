const sites = [
    'https://3dcookiehd.pages.dev/api/gallery',
    'https://3dcookiehd.pages.dev/api/gallery?limit=1000',
    'https://3dcookiehd.pages.dev/api/gallery_data.json',
    'https://3dcookiehd.pages.dev/gallery.json',
    'https://3dcookiehd.pages.dev/api/files/gallery'
];

async function check() {
    for (const url of sites) {
        console.log(`Checking ${url}...`);
        try {
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`Sample: ${text.slice(0, 100)}`);
                if (text.includes('success":true') || text.includes('image_url')) {
                    console.log('FOUND!');
                    break;
                }
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

check();
