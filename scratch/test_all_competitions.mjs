// Comprehensive End-to-End Automated Test Suite for All 8 YUGANTAR 2026 Competitions
// Uses native Node 24 global fetch

const BASE_URL = 'http://localhost:3000';

const COMPETITIONS_TO_TEST = [
  {
    slug: 'project-competition',
    name: 'Project Competition',
    isTeam: true,
    teamSize: '3',
    specificFields: {
      teamName: 'Apex Circuit Innovators',
      projectTitle: 'Smart IoT Grid Optimizer',
      projectTheme: 'Embedded & IoT Systems',
      projectSynopsis: 'https://drive.google.com/file/d/project_synopsis_sample/view',
      member2Name: 'Aarav Sharma',
      member2College: 'PCE',
      member2Branch: 'ETC',
      member2Semester: 'VII',
      member3Name: 'Diya Patel',
      member3College: 'PCE',
      member3Branch: 'CSE',
      member3Semester: 'VII',
    },
  },
  {
    slug: 'ppt-presentation',
    name: 'PPT Presentation',
    isTeam: true,
    teamSize: '2',
    specificFields: {
      teamName: 'Quantum Waves',
      presentationTitle: 'Quantum Cryptography in 6G Networks',
      pptTheme: 'Advanced Telecommunications',
      pptLink: 'https://drive.google.com/file/d/ppt_slides_sample/view',
      member2Name: 'Rohan Deshmukh',
      member2College: 'VNIT',
      member2Branch: 'ETC',
      member2Semester: 'VII',
    },
  },
  {
    slug: 'breadboard-competition',
    name: 'Breadboard Circuit Design',
    isTeam: true,
    teamSize: '2',
    specificFields: {
      circuitTitle: 'Analog Phase Lock Loop Matrix',
      member2Name: 'Sneha Kulkarni',
      member2College: 'PCE',
      member2Branch: 'ETC',
      member2Semester: 'V',
    },
  },
  {
    slug: 'ideathon',
    name: 'Ideathon 2026',
    isTeam: true,
    teamSize: '4',
    specificFields: {
      teamName: 'AgriTech NextGen',
      ideaTitle: 'Bio-Sensing Soil Health Matrix',
      ideaTheme: 'Smart Agritech',
      ideaSummary: 'https://drive.google.com/file/d/ideathon_pitch_sample/view',
      member2Name: 'Kunal Verma',
      member2College: 'RCOEM',
      member2Branch: 'AI & DS',
      member2Semester: 'V',
      member3Name: 'Ananya Roy',
      member3College: 'RCOEM',
      member3Branch: 'IT',
      member3Semester: 'V',
      member4Name: 'Vikram Joshi',
      member4College: 'RCOEM',
      member4Branch: 'ME / MECH',
      member4Semester: 'V',
    },
  },
  {
    slug: 'poster-competition',
    name: 'Poster Presentation',
    isTeam: true,
    teamSize: '2',
    specificFields: {
      teamName: 'Silicon Canvas',
      posterTitle: 'Neuromorphic Computing Architectures',
      posterDraft: 'https://drive.google.com/file/d/poster_draft_sample/view',
      member2Name: 'Tanvi Shinde',
      member2College: 'GHRCE',
      member2Branch: 'ETC',
      member2Semester: 'III',
    },
  },
  {
    slug: 'e-gaming',
    name: 'E-Gaming Championship',
    isTeam: true,
    teamSize: '4',
    specificFields: {
      gameTitle: 'BGMI',
      squadName: 'NEXUS PHANTOMS',
      leaderIGN: 'PhantomLead_99',
      member2Name: 'Kabir Khan',
      member2IGN: 'PhantomSniper',
      member2College: 'PCE',
      member2Branch: 'ETC',
      member2Semester: 'V',
      member3Name: 'Dev Malhotra',
      member3IGN: 'PhantomAssault',
      member3College: 'PCE',
      member3Branch: 'CSE',
      member3Semester: 'V',
      member4Name: 'Arjun Das',
      member4IGN: 'PhantomMedic',
      member4College: 'PCE',
      member4Branch: 'IT',
      member4Semester: 'V',
    },
  },
  {
    slug: 'open-mic',
    name: 'Open Mic Forum',
    isTeam: false,
    teamSize: '1',
    specificFields: {
      performanceCategory: 'Poetry & Spoken Word',
      performanceLanguage: 'Hindi & English',
      performanceTitle: 'Circuits of the Human Condition',
      technicalRequirements: 'Single dynamic stage mic with mild acoustic reverb.',
    },
  },
  {
    slug: 'mock-placement-drive',
    name: 'Mock Placement Drive',
    isTeam: false,
    teamSize: '1',
    specificFields: {
      prn: '2023PCEETC091',
      cgpa: '8.85 CGPA',
      preferredDomain: 'Embedded Firmware & VLSI Design',
      technicalSkills: 'C, C++, Verilog, RTOS, ARM Cortex-M4, STM32CubeIDE',
      resumeLink: 'https://drive.google.com/file/d/1ExampleMockResumeDriveURL/view',
    },
  },
];

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARTING AUTOMATED QA TEST SUITE: ALL 8 COMPETITION TRACKS');
  console.log('Target Server:', BASE_URL);
  console.log('Time:', new Date().toISOString());
  console.log('================================================================\n');

  const testResults = [];

  for (const comp of COMPETITIONS_TO_TEST) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`TESTING TRACK: [${comp.slug}] — ${comp.name}`);
    console.log(`------------------------------------------------------------`);

    const result = {
      slug: comp.slug,
      name: comp.name,
      pageLoad: false,
      validationCheck: false,
      registrationSuccess: false,
      registrationId: null,
      passTokenGenerated: false,
      pdfDownloadVerified: false,
      pdfSize: 0,
      webPassPageVerified: false,
      unresolvedIssues: [],
    };

    // 1. Test Registration Page Route Load
    try {
      const pageRes = await fetch(`${BASE_URL}/competitions/${comp.slug}/register`);
      if (pageRes.status === 200) {
        const html = await pageRes.text();
        const hasHeader = html.includes(comp.name) || html.includes('Register for');
        const hasBadges = html.includes('ARENA 0') && (html.includes('ENTRY FEE') || html.includes('FREE ENTRY'));
        if (hasHeader && hasBadges) {
          result.pageLoad = true;
          console.log(`  ✓ Page Route [200 OK]: Header, fee badge, and form layout rendered properly.`);
        } else {
          result.unresolvedIssues.push('Page rendered without expected header fee badges or titles');
          console.log(`  ⚠ Page Route [200 OK]: Missing fee badge or header metadata`);
        }
      } else {
        result.unresolvedIssues.push(`HTTP ${pageRes.status} on register page route`);
        console.log(`  ✗ Page Route Failed: HTTP ${pageRes.status}`);
      }
    } catch (err) {
      result.unresolvedIssues.push(`Page load network error: ${err.message}`);
      console.log(`  ✗ Page Route Exception:`, err.message);
    }

    // 2. Test Input Validation (Attempt empty submission)
    try {
      const emptyRes = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionSlug: comp.slug,
          formValues: {},
          idempotencyKey: `test_empty_${comp.slug}_${Date.now()}`,
        }),
      });
      const emptyData = await emptyRes.json();
      if ((emptyRes.status === 422 || emptyRes.status === 400) && emptyData.errors) {
        result.validationCheck = true;
        console.log(`  ✓ Validation Guard [${emptyRes.status}]: Successfully caught missing required fields (${Object.keys(emptyData.errors).length} errors).`);
      } else {
        result.unresolvedIssues.push(`Empty payload did not trigger 422/400 validation error (got ${emptyRes.status})`);
        console.log(`  ⚠ Validation Guard: Expected 422/400 with errors, got ${emptyRes.status}`);
      }
    } catch (err) {
      result.unresolvedIssues.push(`Validation check error: ${err.message}`);
    }

    // 3. Test Full Successful Registration Submission
    try {
      const timestamp = Date.now();
      const testEmail = `qa.${comp.slug}.${timestamp}@yugantar-test.in`;
      const formValues = {
        leaderName: `QA Candidate ${comp.slug}`,
        leaderEmail: testEmail,
        leaderPhone: '+91 98765 43210',
        leaderCollege: 'PCE',
        leaderBranch: 'ETC',
        leaderSemester: comp.slug.includes('project') || comp.slug.includes('ppt') ? 'VII' : 'V',
        teamSize: comp.teamSize,
        paymentId: `UTR${timestamp.toString().slice(-12)}`,
        paymentProof: 'https://res.cloudinary.com/yugantar/image/upload/v1/payment_proofs/sample.jpg',
        ...comp.specificFields,
      };

      const regRes = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionSlug: comp.slug,
          formValues,
          idempotencyKey: `qa_${comp.slug}_${timestamp}`,
        }),
      });

      const regData = await regRes.json();

      if (regRes.status === 200 && (regData.status === 'submitted' || regData.status === 'confirmed')) {
        result.registrationSuccess = true;
        result.registrationId = regData.registrationId;
        console.log(`  ✓ Registration Submitted [200 OK]: Generated ID = ${regData.registrationId}`);

        if (regData.passToken) {
          result.passTokenGenerated = true;
          console.log(`  ✓ Stateless HMAC Pass Token: Generated successfully (${regData.passToken.substring(0, 24)}...)`);
        } else {
          result.unresolvedIssues.push('No passToken returned in registration response');
        }

        // 4. Test PDF Vector Download via /api/pass/[id]/pdf?token=...
        if (regData.registrationId && regData.passToken) {
          try {
            const pdfUrl = `${BASE_URL}/api/pass/${regData.registrationId}/pdf?token=${regData.passToken}`;
            const pdfRes = await fetch(pdfUrl);
            const contentType = pdfRes.headers.get('content-type') || '';
            const disposition = pdfRes.headers.get('content-disposition') || '';

            if (pdfRes.status === 200 && contentType.includes('application/pdf')) {
              const arrayBuf = await pdfRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuf);
              const magic = buffer.slice(0, 5).toString('ascii');
              result.pdfSize = buffer.length;

              if (magic === '%PDF-' && buffer.length > 3000) {
                result.pdfDownloadVerified = true;
                console.log(`  ✓ Binary Vector PDF Download [200 OK]: Valid %PDF- magic header, size = ${buffer.length} bytes.`);
                console.log(`    Disposition: ${disposition}`);
              } else {
                result.unresolvedIssues.push(`PDF returned but invalid magic header (${magic}) or size too small (${buffer.length})`);
              }
            } else {
              result.unresolvedIssues.push(`PDF endpoint failed with status ${pdfRes.status} (Content-Type: ${contentType})`);
            }
          } catch (pdfErr) {
            result.unresolvedIssues.push(`PDF fetch error: ${pdfErr.message}`);
          }

          // 5. Test Web Digital Pass Page /pass/[id]?token=...
          try {
            const passUrl = `${BASE_URL}/pass/${regData.registrationId}?token=${regData.passToken}`;
            const passRes = await fetch(passUrl);
            if (passRes.status === 200) {
              const passHtml = await passRes.text();
              const hasPassBranding = passHtml.includes('YUGANTAR 2026') && passHtml.includes('Delegate Pass');
              const hasCandidate = passHtml.includes(`QA Candidate ${comp.slug}`);
              if (hasPassBranding && hasCandidate) {
                result.webPassPageVerified = true;
                console.log(`  ✓ Web Digital Pass Page [200 OK]: Rendered official credential with candidate name and roster.`);
              } else {
                result.unresolvedIssues.push('Digital pass HTML missing YUGANTAR 2026 Delegate Pass branding or candidate name');
              }
            } else {
              result.unresolvedIssues.push(`Pass page returned HTTP ${passRes.status}`);
            }
          } catch (passErr) {
            result.unresolvedIssues.push(`Web pass fetch error: ${passErr.message}`);
          }
        }
      } else {
        result.unresolvedIssues.push(`Registration failed: HTTP ${regRes.status} - ${regData.error || JSON.stringify(regData.errors)}`);
        console.log(`  ✗ Registration Failed:`, regData);
      }
    } catch (err) {
      result.unresolvedIssues.push(`Registration exception: ${err.message}`);
      console.log(`  ✗ Registration Exception:`, err.message);
    }

    testResults.push(result);
  }

  // Also test Mock Placement alias route /competitions/mock-placement/register
  console.log(`\n------------------------------------------------------------`);
  console.log(`TESTING ALIAS ROUTE: [mock-placement] -> [mock-placement-drive]`);
  console.log(`------------------------------------------------------------`);
  try {
    const aliasRes = await fetch(`${BASE_URL}/competitions/mock-placement/register`);
    console.log(`  ✓ Route alias /competitions/mock-placement/register HTTP status: ${aliasRes.status}`);
  } catch (err) {
    console.log(`  ✗ Alias route failed:`, err.message);
  }

  console.log('\n================================================================');
  console.log('SUMMARY TEST MATRIX: ALL 8 COMPETITION TRACKS');
  console.log('================================================================');
  console.table(
    testResults.map((r) => ({
      Competition: r.name,
      Slug: r.slug,
      'Page 200': r.pageLoad ? 'PASS' : 'FAIL',
      'Validation Guard': r.validationCheck ? 'PASS' : 'FAIL',
      'Reg Submit': r.registrationSuccess ? 'PASS' : 'FAIL',
      'Registration ID': r.registrationId ? r.registrationId.substring(0, 16) + '...' : 'NONE',
      'HMAC Token': r.passTokenGenerated ? 'PASS' : 'FAIL',
      'PDF Vector (Bytes)': r.pdfDownloadVerified ? `${r.pdfSize} B (PASS)` : 'FAIL',
      'Web Pass': r.webPassPageVerified ? 'PASS' : 'FAIL',
      Issues: r.unresolvedIssues.length === 0 ? 'None' : r.unresolvedIssues.join('; '),
    }))
  );

  const allPassed = testResults.every(
    (r) =>
      r.pageLoad &&
      r.validationCheck &&
      r.registrationSuccess &&
      r.passTokenGenerated &&
      r.pdfDownloadVerified &&
      r.webPassPageVerified &&
      r.unresolvedIssues.length === 0
  );

  console.log(`\nFinal Verdict: ${allPassed ? 'ALL 8 COMPETITIONS PASSED WITH ZERO UNRESOLVED ISSUES!' : 'SOME TRACKS HAD FAILURES'}`);
}

runTestSuite();
