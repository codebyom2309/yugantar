// scripts/test-all-8-forms.js
const forms = [
  { name: '1. Project Competition', id: '1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8' },
  { name: '2. PPT Presentation', id: '1nXblcJviqnUx-B4KZAtV755eaJN4Vw6MxjOPaSpwh5g' },
  { name: '3. Breadboard', id: '13bSoKK8N4isK3oyEJE2-xP145_ugSq5mEfLaPEHsj_o' },
  { name: '4. Ideathon', id: '1sxNwzdhO7vRkMV_ADtPPVG5ddPlNXvWYk6mKW9kmkXA' },
  { name: '5. Poster Competition', id: '1W5_1yyh0C8V00Z7FHAO1g-z2i1iAWznGbjHM7JB-UHs' },
  { name: '6. E-Gaming', id: '1BL5B2b55wmMCcvjFYkbKUitOKn_-CBxFmNKlk8o8J2k' },
  { name: '7. Open Mic', id: '1AxN0p0LChkcSoqMApeZ0Elyd2fPW2x49Z4IiBcKZlBI' },
  { name: '8. Mock Placement', id: '1FAIpQLScjOWajk7h8k4f-DIMNsXmev0FwTv376PBK5QG2KU48ZvyMsA' },
];

function getFormResponseUrl(formId) {
  // If the ID starts with 1FAIpQL, it's a published e/ form ID
  if (formId.startsWith('1FAIpQL') || formId.startsWith('e/')) {
    const cleanId = formId.replace(/^e\//, '');
    return `https://docs.google.com/forms/d/e/${cleanId}/formResponse`;
  }
  // Otherwise it's a standard form document ID
  return `https://docs.google.com/forms/d/${formId}/formResponse`;
}

async function verifyForms() {
  for (const f of forms) {
    const url = getFormResponseUrl(f.id);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      console.log(`${f.name} -> URL: ${url} | Status: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`${f.name} -> Failed: ${e.message}`);
    }
  }
}

verifyForms();
