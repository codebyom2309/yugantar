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

  console.log('1. Cleaning up rogue coordinators...');
  await conn.execute("DELETE FROM competition_coordinators WHERE competition_slug = 'vandhe-bhararat' OR name LIKE '%ramesh barange%'");
  await conn.execute("DELETE FROM competition_coordinators WHERE name IN ('Lead Student Coordinator', 'Faculty Advisor')");

  console.log('2. Updating Project Competition in database...');
  const updatedAbout = "The Project Competition is the cornerstone hardware showcase of YUGANTAR 2026. Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition's stated submission requirements.";
  const updatedFullDesc = "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition's stated submission requirements.";
  
  const updatedRules = JSON.stringify([
    "Setup & Hardware Requirements: Teams must bring all necessary hardware components, laptops, and extension cords required for their project. The department will only provide a standard desk and a single electrical power socket. Projects must be fully functional.",
    "Technical Domain Scope: Participants can showcase projects from any relevant engineering or technical subject or domain. Projects must demonstrate genuine practical implementation, circuit design, and problem-solving merit while following stated submission requirements.",
    "Presentation & Conduct: Teams must display a printed A3 poster or a technical synopsis chart at their desk. Every registered team member must be present. Formal attire or college uniform is strictly mandatory.",
    "Evaluation Matrix (100 Points): Innovation (25), Complexity (30), Practical Applicability (20), Presentation & Viva (25).",
    "Disqualification: Submitting a purchased pre-built commercial kit, presenting a copied open-source project without significant modifications, or reusing a previous year's project will result in immediate disqualification."
  ]);

  const updatedHighlights = JSON.stringify([
    "Live hardware prototype demonstration",
    "Open to all relevant engineering and technical domains",
    "100-point rigorous evaluation rubric"
  ]);

  const updatedFaqs = JSON.stringify([
    {
      question: "What technical domains or subjects are eligible?",
      answer: "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition's stated submission requirements."
    },
    {
      question: "What equipment is provided at the workstations?",
      answer: "The department provides a standard desk and a single electrical power socket. All other hardware, laptops, adapters, and extension cords must be brought by the team."
    }
  ]);

  await conn.execute(`
    UPDATE competitions
    SET about = ?,
        full_description = ?,
        rules = ?,
        highlights = ?,
        faqs = ?
    WHERE slug = 'project-competition'
  `, [updatedAbout, updatedFullDesc, updatedRules, updatedHighlights, updatedFaqs]);

  console.log('✓ Project Competition database row updated successfully.');

  const [verifyRows] = await conn.execute("SELECT slug, about, full_description, highlights FROM competitions WHERE slug = 'project-competition'");
  console.log('Verified updated DB record:', verifyRows[0]);

  await conn.end();
}

main().catch(console.error);
