// scripts/test-api-e2e.js
async function runTest() {
  console.log('--- Testing POST /api/register ---');
  const payload = {
    competitionSlug: 'project-competition',
    idempotencyKey: `diag-test-${Date.now()}`,
    formValues: {
      leaderName: 'Test Participant Alpha',
      leaderPhone: '+91 9876543210',
      leaderEmail: 'test.alpha@pce.edu',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'V',
      teamName: 'Nexus Alpha',
      projectTitle: 'Smart Autonomous Rover',
      projectTheme: 'Embedded & Robotics',
      projectSynopsis: 'https://drive.google.com/synopsis-test',
      teamSize: '1',
      paymentId: 'TEST_UTR_E2E_888999',
      paymentProof: 'https://drive.google.com/payment-proof-test',
    },
  };

  const res = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('HTTP Status:', res.status);
  const json = await res.json();
  console.log('API Response:', JSON.stringify(json, null, 2));
}

runTest().catch(console.error);
