async function test() {
  const url = 'https://www.airbnb.co.in/rooms/1498356877516030800';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  console.log('Status:', response.status);
  const html = await response.text();
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
  const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  
  console.log('Title:', titleMatch ? titleMatch[1] : null);
  console.log('Desc:', descMatch ? descMatch[1] : null);
  console.log('Image:', imgMatch ? imgMatch[1] : null);
}
test();
