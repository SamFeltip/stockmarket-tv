import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const policy = JSON.parse(readFileSync(new URL('../src/privacy.json', import.meta.url), 'utf8'));
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(policy.title)}</title><style>body{max-width:52rem;margin:3rem auto;padding:0 1.5rem;font:18px/1.6 system-ui,sans-serif;color:#17301b;background:#fafcf8}h1{line-height:1.2}h2{font-size:1.25rem;margin-top:2rem}a{color:#204712}</style></head>
<body><main><h1>${escape(policy.title)}</h1><p>Last updated: ${escape(policy.updated)}</p>
<p><a href="#deletion">Request account or data deletion</a></p>
${policy.sections.map(section => `<section${section.id ? ` id="${escape(section.id)}"` : ''}><h2>${escape(section.heading)}</h2><p>${escape(section.text)}</p>${section.id === 'deletion' ? `<p><a href="mailto:${escape(policy.contact)}?subject=Stockmarket%20deletion%20request">Email a deletion request</a></p>` : ''}</section>`).join('\n')}
<p>Contact: <a href="mailto:${escape(policy.contact)}">${escape(policy.contact)}</a></p>
<p><a href="https://stockmarket.samfelton.com">Open Stockmarket</a></p></main></body></html>\n`;
writeFileSync(new URL('../public/tv-privacy.html', import.meta.url), html);
if (process.argv.includes('--phone')) {
    const phonePublic = new URL('../../stockmarket.js/public/', import.meta.url);
    if (!existsSync(phonePublic)) throw new Error('Sibling phone frontend is missing.');
    writeFileSync(new URL('tv-privacy.html', phonePublic), html);
}
console.log('Exported TV privacy policy' + (process.argv.includes('--phone') ? ' to both frontends.' : '.'));
