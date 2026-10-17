import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const url = new URL(match[1]);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [rows] = await conn.query('SELECT id, title, paper_size, orientation, width_pt, height_pt, background_url, background_fit, background_opacity, elements FROM pass_templates WHERE id IN ("827ebe0e-e3d9-4959-abb2-aff2476ff5b5", "7c452636-20c2-4ab7-beee-382eac96f2af")');
  for (const r of rows) {
    console.log('----------------------------------------------------');
    console.log('ID:', r.id, 'Title:', r.title);
    console.log('Paper Size:', r.paper_size, 'Orientation:', r.orientation, 'W:', r.width_pt, 'H:', r.height_pt);
    console.log('Bg URL:', r.background_url, 'Fit:', r.background_fit, 'Opacity:', r.background_opacity);
    const els = typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements;
    console.log('Elements count:', els.length);
    console.log('Elements sample:', JSON.stringify(els.slice(0, 3), null, 2));
  }
  await conn.end();
}
main().catch(console.error);
