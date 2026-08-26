const fs = require('fs');
const { SEED_ARTICLES } = require('../lib/articles-data.ts');

function escapeSql(str) {
  if (!str) return 'NULL';
  return `'` + str.replace(/'/g, `''`) + `'`;
}

function escapeArray(arr) {
  if (!arr || arr.length === 0) return `'{}'::text[]`;
  const items = arr.map(item => `"` + item.replace(/"/g, `\\"`) + `"`).join(',');
  return `'` + `{` + items + `}` + `'::text[]`;
}

let sql = '';
SEED_ARTICLES.forEach((a, i) => {
  sql += `INSERT INTO public.articles (
  slug, title, subtitle, excerpt, content, cover_image, category, tags, author_name, author_role, author_avatar, published_at, status, featured, reading_time_minutes, meta_title, meta_description, meta_keywords, view_count
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
  ${escapeSql(a.published_at)},
  ${escapeSql(a.status)},
  ${a.featured ? 'true' : 'false'},
  ${a.reading_time_minutes},
  ${escapeSql(a.meta_title)},
  ${escapeSql(a.meta_description)},
  ${escapeArray(a.meta_keywords)},
  ${150 + Math.floor(Math.random() * 400)}
);\n\n`;
});

fs.writeFileSync('scripts/seed-articles.sql', sql, 'utf8');
console.log('Generated scripts/seed-articles.sql successfully with 20 articles.');
