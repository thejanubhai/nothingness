import { getPublishedArticles } from '@/app/actions/journal';

export const revalidate = 3600; // Revalidate every hour

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nothingness.asia';
  const articles = await getPublishedArticles();

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Nothingness Journal | Alternate Lifestyle, Intimacy &amp; Sanctuaries</title>
    <link>${siteUrl}/journal</link>
    <description>In-depth essays, guides, stories, and research on power dynamics, Shibari, aftercare, sensory exploration, and private sanctuaries in India.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles
      .map((article) => {
        const articleUrl = `${siteUrl}/journal/${article.slug}`;
        const pubDate = new Date(article.published_at).toUTCString();
        return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(article.excerpt)}</description>
      <category>${escapeXml(article.category)}</category>
      <author>${escapeXml(article.author_name)}</author>
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
