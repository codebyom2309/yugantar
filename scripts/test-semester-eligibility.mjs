async function testEligibility() {
  const baseUrl = 'http://localhost:3000';

  console.log('--- TEST 1: Reject Ineligible Semester (Semester I) on mini-project-competition ---');
  const res1 = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      competitionSlug: 'mini-project-competition',
      formValues: {
        leaderName: 'Test Student',
        leaderPhone: '+91 9876543210',
        leaderEmail: 'test1@college.edu',
        leaderCollege: 'PCE',
        leaderBranch: 'ETC',
        leaderSemester: 'I', // Ineligible
        teamSize: '1',
      },
      idempotencyKey: `test_ineligible_1_${Date.now()}`,
    }),
  });
  const data1 = await res1.json();
  console.log('Status code:', res1.status);
  console.log('Response body:', data1);
  if (res1.status === 400 && data1.error?.includes('not eligible')) {
    console.log('✅ TEST 1 PASSED: Ineligible semester I successfully rejected by server with HTTP 400!');
  } else {
    throw new Error('TEST 1 FAILED: Expected HTTP 400 rejection');
  }

  console.log('\n--- TEST 2: Reject Ineligible Semester (Semester V) on mini-project-competition ---');
  const res2 = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      competitionSlug: 'mini-project-competition',
      formValues: {
        leaderName: 'Test Student 5',
        leaderPhone: '+91 9876543210',
        leaderEmail: 'test5@college.edu',
        leaderCollege: 'PCE',
        leaderBranch: 'ETC',
        leaderSemester: 'V', // Ineligible
        teamSize: '1',
      },
      idempotencyKey: `test_ineligible_5_${Date.now()}`,
    }),
  });
  const data2 = await res2.json();
  console.log('Status code:', res2.status);
  console.log('Response body:', data2);
  if (res2.status === 400 && data2.error?.includes('not eligible')) {
    console.log('✅ TEST 2 PASSED: Ineligible semester V successfully rejected by server with HTTP 400!');
  } else {
    throw new Error('TEST 2 FAILED: Expected HTTP 400 rejection');
  }

  console.log('\n--- TEST 3: Accept Eligible Semester (Semester III) on mini-project-competition ---');
  const res3 = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      competitionSlug: 'mini-project-competition',
      formValues: {
        leaderName: 'Eligible Student',
        leaderPhone: '+91 9876543210',
        leaderEmail: `eligible3_${Date.now()}@college.edu`,
        leaderCollege: 'PCE',
        leaderBranch: 'ETC',
        leaderSemester: 'III', // Eligible!
        teamSize: '1',
        teamName: 'Innovators',
        projectTitle: 'Smart IoT Node',
        projectTheme: 'Embedded Circuits',
        paymentId: `TESTUTR_${Date.now()}`,
        paymentProof: 'https://drive.google.com/test',
      },
      idempotencyKey: `test_eligible_3_${Date.now()}`,
    }),
  });
  const data3 = await res3.json();
  console.log('Status code:', res3.status);
  if (res3.status === 200) {
    console.log('✅ TEST 3 PASSED: Eligible semester III successfully accepted with HTTP 200!');
  } else {
    throw new Error(`TEST 3 FAILED: Expected HTTP 200, got ${res3.status}`);
  }

  console.log('\n--- TEST 4: Accept Eligible Semester (Semester VI) on mini-project-competition ---');
  const res4 = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      competitionSlug: 'mini-project-competition',
      formValues: {
        leaderName: 'Eligible Student 6',
        leaderPhone: '+91 9876543210',
        leaderEmail: `eligible6_${Date.now()}@college.edu`,
        leaderCollege: 'PCE',
        leaderBranch: 'ETC',
        leaderSemester: 'VI', // Eligible!
        teamSize: '1',
        teamName: 'Innovators 6',
        projectTitle: 'Robotics Node',
        projectTheme: 'Circuits',
        paymentId: `TESTUTR6_${Date.now()}`,
        paymentProof: 'https://drive.google.com/test',
      },
      idempotencyKey: `test_eligible_6_${Date.now()}`,
    }),
  });
  const data4 = await res4.json();
  console.log('Status code:', res4.status);
  if (res4.status === 200) {
    console.log('✅ TEST 4 PASSED: Eligible semester VI successfully accepted with HTTP 200!');
  } else {
    throw new Error(`TEST 4 FAILED: Expected HTTP 200, got ${res4.status}`);
  }

  console.log('\n====================================================');
  console.log('  ALL SEMESTER ELIGIBILITY TESTS PASSED (4/4)       ');
  console.log('====================================================');
}

testEligibility().catch(console.error);
