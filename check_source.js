async function run() {
  const url = 'https://3dcookiehd.pages.dev/api/posts?category=prototype&status=published&limit=100';
  const r = await fetch(url);
  const j = await r.json();
  if (j.data && j.data.length > 0) {
    const images = j.data.map(d => {
      let img = (d.images && d.images.length) ? d.images[0] : (d.thumbnail_url || '');
      if (!img && d.content) {
         let m = d.content.match(/<img[^>]+src=["']([^"']+)["']/i);
         if (m) img = m[1];
      }
      return img;
    }).filter(i => Boolean(i));
    console.log('--- Original image source APIs ---');
    console.log(images.slice(0, 5));
  } else {
    console.log('No data found.', j);
  }
}
run();
