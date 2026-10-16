import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });

  console.log('Connected to TiDB.');

  const [faqs] = await connection.execute('SELECT id, category, question, answer FROM faqs');
  console.log('Total FAQs in DB:', faqs.length);

  for (const faq of faqs) {
    if (faq.category === 'Eligibility' || faq.question.includes('Who can participate')) {
      console.log('Current Eligibility FAQ:', faq.answer);
      const updated = "Eligibility varies by competition according to official academic rules: Project Competition & PPT Presentation are for VII Semester students; Bread Board & Mock Placement Drive are for V Semester students; Mini Project Competition is for III and VI Semester students; Ideathon, Poster, E-Gaming, and Open Mic are open to all semesters.";
      await connection.execute('UPDATE faqs SET answer = ? WHERE id = ?', [updated, faq.id]);
      console.log('Updated Eligibility FAQ in DB.');
    }
  }

  await connection.end();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
