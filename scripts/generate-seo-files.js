#!/usr/bin/env node

/**
 * Génère public/robots.txt et public/sitemap.xml avec une URL de base configurable.
 * Usage: SITE_URL=https://mondomaine.com node scripts/generate-seo-files.js
 * Variables d'environnement: SITE_URL ou VITE_SITE_URL (sans trailing slash).
 */

const fs = require('fs');
const path = require('path');

const baseUrl = (
  process.env.SITE_URL ||
  process.env.VITE_SITE_URL ||
  'https://ollync.fr'
).replace(/\/$/, '');

const publicDir = path.join(__dirname, '..', 'public');

// --- robots.txt ---
const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
# Pages utiles (accueil, recherche, catégories, annonces, profils publics)
Allow: /
Allow: /home
Allow: /feed
Allow: /search
Allow: /favorites
Allow: /creation-contenu
Allow: /creation-contenu/
Allow: /emploi
Allow: /emploi/
Allow: /casting-role
Allow: /casting-role/
Allow: /studio-lieu
Allow: /studio-lieu/
Allow: /services
Allow: /services/
Allow: /evenements
Allow: /evenements/
Allow: /vente
Allow: /vente/
Allow: /urgent
Allow: /recent
Allow: /post/
Allow: /profile/public/

# Routes privées ou sans intérêt SEO
Disallow: /auth/
Disallow: /messages
Disallow: /messages/
Disallow: /notifications
Disallow: /publish
Disallow: /publier-annonce
Disallow: /profile
Disallow: /moderation

Sitemap: ${baseUrl}/sitemap.xml
`;

// --- sitemap.xml ---
const today = new Date().toISOString().slice(0, 10);

const sitemapUrls = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/home', changefreq: 'daily', priority: '1.0' },
  { loc: '/feed', changefreq: 'hourly', priority: '0.9' },
  { loc: '/search', changefreq: 'daily', priority: '0.9' },
  { loc: '/favorites', changefreq: 'daily', priority: '0.7' },
  { loc: '/creation-contenu', changefreq: 'daily', priority: '0.8' },
  { loc: '/emploi', changefreq: 'daily', priority: '0.8' },
  { loc: '/casting-role', changefreq: 'daily', priority: '0.8' },
  { loc: '/studio-lieu', changefreq: 'daily', priority: '0.8' },
  { loc: '/services', changefreq: 'daily', priority: '0.8' },
  { loc: '/evenements', changefreq: 'daily', priority: '0.8' },
  { loc: '/vente', changefreq: 'daily', priority: '0.8' },
  { loc: '/urgent', changefreq: 'hourly', priority: '0.8' },
  { loc: '/recent', changefreq: 'hourly', priority: '0.8' },
];

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const urlEntries = sitemapUrls
  .map(
    (u) =>
      `  <url>
    <loc>${escapeXml(baseUrl + u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

// Écriture
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');

console.log('SEO files generated: public/robots.txt, public/sitemap.xml');
console.log('Base URL:', baseUrl);
