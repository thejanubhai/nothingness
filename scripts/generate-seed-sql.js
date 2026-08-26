const fs = require('fs');

// Read lib/articles-data.ts and extract SEED_ARTICLES
const content = fs.readFileSync('./lib/articles-data.ts', 'utf8');

// We can compile/require or parse SEED_ARTICLES using typescript/node
const ts = require('typescript');
const js = ts.transpile(content);
const evalScope = {};
const fn = new Function('exports', js);
fn(evalScope);

const articles = evalScope.SEED_ARTICLES;

console.log(`Extracted ${articles.length} articles.`);

let sql = '';
for (const a of articles) {
  const escapeSql = (str) => (str ? "'" + str.replace(/'/g, "''") + "'" : "NULL");
  const escapeArray = (arr) => (arr && arr.length > 0 ? "ARRAY[" + arr.map(s => "'" + s.replace(/'/g, "''") + "'").join(',') + "]" : "ARRAY[]::TEXT[]");

  sql += `
INSERT INTO public.articles (
  slug, title, subtitle, excerpt, content, cover_image, category, tags,
  author_name, author_role, author_avatar, published_at, status, featured,
  reading_time_minutes, meta_title, meta_description, meta_keywords, view_count
) VALUES (
  ${escapeSql(a.slug)},
  ${escapeSql(a.title)},
  ${escapeSql(a.subtitle)},
  ${escapeSql(a.excerpt)},
  ${escapeSql(a.content)},
  ${escapeSql(a.cover_image)},
  ${escapeSql(a.category)},
  ${escapeArray(a.tags)},
  ${escapeSql(a.author_name)},
  ${escapeSql(a.author_role)},
  ${escapeSql(a.author_avatar)},
  '${a.published_at}',
  '${a.status}',
  ${a.featured ? 'TRUE' : 'FALSE'},
  ${a.reading_time_minutes},
  ${escapeSql(a.meta_title)},
  ${escapeSql(a.meta_description)},
  ${escapeArray(a.meta_keywords)},
  ${Math.floor(Math.random() * 300) + 120}
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  cover_image = EXCLUDED.cover_image,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  author_name = EXCLUDED.author_name,
  author_role = EXCLUDED.author_role,
  published_at = EXCLUDED.published_at,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  reading_time_minutes = EXCLUDED.reading_time_minutes,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  meta_keywords = EXCLUDED.meta_keywords;
`;
}

fs.writeFileSync('./scripts/seed-articles.sql', sql);
console.log('Successfully wrote ./scripts/seed-articles.sql');
