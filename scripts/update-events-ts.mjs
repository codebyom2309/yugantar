import fs from 'fs';

const REAL_COORDINATORS = {
  'ppt-presentation': [
    { id: 'coord-ppt-1', name: 'Dr. A. K. Kondelwar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-ppt-2', name: 'Mrs. S. S. Mankar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-ppt-3', name: 'Pooja Konge', role: 'Student Coordinator', phone: '+91 95793 28823', email: null },
    { id: 'coord-ppt-4', name: 'Dishant Chokhande', role: 'Student Coordinator', phone: '+91 96895 87991', email: null },
  ],
  'project-competition': [
    { id: 'coord-proj-1', name: 'Dr. (Mrs) J. M. Bhattad', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-proj-2', name: 'Mr. D. G. Gahane', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-proj-3', name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-proj-4', name: 'Ms. P. B. Pendke', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-proj-5', name: 'Khushi Pardhi', role: 'Student Coordinator', phone: '+91 95524 58818', email: null },
    { id: 'coord-proj-6', name: 'Samsher Kode', role: 'Student Coordinator', phone: '+91 93593 83375', email: null },
    { id: 'coord-proj-7', name: 'Om Wadaskar', role: 'Student Coordinator', phone: '+91 70581 36648', email: null },
    { id: 'coord-proj-8', name: 'Gaurav Rajurkar', role: 'Student Coordinator', phone: '+91 96579 51153', email: null },
  ],
  'mock-placement-drive': [
    { id: 'coord-mock-1', name: 'Mrs. P. J. Suryawanshi', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-mock-2', name: 'Gomati Deshmukh', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-mock-3', name: 'Mrs. R. R. Zalke', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-mock-4', name: 'Vedant Gaikwad', role: 'Student Coordinator', phone: '+91 96998 64120', email: null },
    { id: 'coord-mock-5', name: 'Student Coordinator', role: 'Student Coordinator', phone: '+91 89991 89509', email: null },
    { id: 'coord-mock-6', name: 'Aachal Dhapekar', role: 'Student Coordinator', phone: '+91 93733 85732', email: null },
  ],
  'breadboard-competition': [
    { id: 'coord-bb-1', name: 'Dr. S. P. Washimkar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-bb-2', name: 'Dr. V. V. Panchbhai', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-bb-3', name: 'Ujjwal Barange', role: 'Student Coordinator', phone: '+91 79874 94482', email: null },
    { id: 'coord-bb-4', name: 'Rizam Ramteke', role: 'Student Coordinator', phone: '+91 88057 94318', email: null },
  ],
  'ideathon': [
    { id: 'coord-idea-1', name: 'Dr. N. S. Ambatkar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-idea-2', name: 'Mr. P. R. Lakhe', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-idea-3', name: 'Prathemesh Pawar', role: 'Student Coordinator', phone: '+91 72767 85069', email: null },
    { id: 'coord-idea-4', name: 'Yatharth Kathane', role: 'Student Coordinator', phone: '+91 79727 23911', email: null },
  ],
  'poster-competition': [
    { id: 'coord-post-1', name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-post-2', name: 'Dr. A. S. Khobragade', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-post-3', name: 'Aryan Dehankar', role: 'Student Coordinator', phone: '+91 73856 35401', email: null },
    { id: 'coord-post-4', name: 'Anshool Harinkhede', role: 'Student Coordinator', phone: '+91 92845 51472', email: null },
  ],
  'e-gaming': [
    { id: 'coord-eg-1', name: 'Dr. P. U. Chati', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-eg-2', name: 'Dr. C. N. Bhoyar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-eg-3', name: 'Shivam Tatole', role: 'Student Coordinator', phone: '+91 78210 87589', email: null },
    { id: 'coord-eg-4', name: 'Tejas Dhanorkar', role: 'Student Coordinator', phone: '+91 81809 32693', email: null },
  ],
  'open-mic': [
    { id: 'coord-om-1', name: 'Ms. A. K. Parmar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-om-2', name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-om-3', name: 'Vedant Gawande', role: 'Student Coordinator', phone: '+91 84218 41958', email: null },
    { id: 'coord-om-4', name: 'Mohit Kawale', role: 'Student Coordinator', phone: '+91 95799 30801', email: null },
  ],
  'mini-project-competition': [
    { id: 'coord-mini-1', name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-mini-2', name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator', phone: null, email: null },
    { id: 'coord-mini-3', name: 'Summit Bhagat', role: 'Student Coordinator', phone: '+91 89992 60789', email: null },
    { id: 'coord-mini-4', name: 'Aditya Sumatkar', role: 'Student Coordinator', phone: '+91 90494 62518', email: null },
  ],
};

let eventsCode = fs.readFileSync('src/data/events.ts', 'utf8');

// 1. Add coordinators to Competition interface if not present
if (!eventsCode.includes('coordinators?: { id?: string; name: string; role: string;')) {
  eventsCode = eventsCode.replace(
    'export interface Competition {',
    `export interface CoordinatorEntry {\n  id?: string;\n  name: string;\n  role: string;\n  phone?: string | null;\n  email?: string | null;\n  avatar_url?: string | null;\n}\n\nexport interface Competition {\n  coordinators?: CoordinatorEntry[];`
  );
}

// 2. Update Project Competition in events.ts
// Replace approvedDomains line with commented out or removed
eventsCode = eventsCode.replace(
  'approvedDomains: ["DSD", "WSN", "ES", "DSP", "MWR"],\n',
  ''
);

// Update fullDescription
eventsCode = eventsCode.replace(
  'fullDescription: "A premier platform for VII semester engineers to exhibit live working prototypes, hardware solutions, and applied electronic systems before an expert panel.",',
  'fullDescription: "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition\'s stated submission requirements.",'
);

// Update about
eventsCode = eventsCode.replace(
  'about: "The Project Competition is the cornerstone hardware showcase of YUGANTAR 2026. Teams present operational hardware models, embedded systems, DSP filters, or wireless sensor networks to evaluate real-world feasibility, innovation, and technical rigor.",',
  'about: "The Project Competition is the cornerstone hardware showcase of YUGANTAR 2026. Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition\'s stated submission requirements.",'
);

// Update Rule 2
eventsCode = eventsCode.replace(
  '"Domain Strictness: The core technology of the project must strictly fall under one of the officially specified domains (DSD, WSN, ES, DSP, MWR). Projects outside these domains will not be evaluated.",',
  '"Technical Domain Scope: Participants can showcase projects from any relevant engineering or technical subject or domain. Projects must demonstrate genuine practical implementation, circuit design, and problem-solving merit while following stated submission requirements.",'
);

// Update Highlights
eventsCode = eventsCode.replace(
  '"Strict evaluation across 5 approved technical domains",',
  '"Open to all relevant engineering and technical domains",'
);

// Update FAQ
eventsCode = eventsCode.replace(
  'question: "Can we submit projects outside the 5 approved domains?",\n        answer: "No. The core technology must strictly fall under DSD, WSN, ES, DSP, or MWR. Projects outside these domains will not be evaluated.",',
  'question: "What technical domains or subjects are eligible?",\n        answer: "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition\'s stated submission requirements.",'
);

// Update rulesPlaceholder
eventsCode = eventsCode.replace(
  '"Must fall strictly under approved domains: DSD, WSN, ES, DSP, MWR.",',
  '"Open to projects from all relevant engineering and technical subjects and domains.",'
);

// 3. Inject coordinators into each competition in COMPETITIONS
for (const [slug, coords] of Object.entries(REAL_COORDINATORS)) {
  const targetRegex = new RegExp(`(slug:\\s*["']${slug}["'][\\s\\S]*?)(eligibilityPlaceholder:)`);
  if (targetRegex.test(eventsCode)) {
    const coordsJson = JSON.stringify(coords, null, 4).replace(/^/gm, '    ');
    eventsCode = eventsCode.replace(
      targetRegex,
      `$1coordinators: ${coordsJson.trim()},\n    $2`
    );
    console.log(`✓ Attached coordinators to ${slug} in events.ts`);
  } else {
    console.warn(`Could not find eligibilityPlaceholder anchor for ${slug}`);
  }
}

fs.writeFileSync('src/data/events.ts', eventsCode, 'utf8');
console.log('✓ events.ts updated successfully.');
