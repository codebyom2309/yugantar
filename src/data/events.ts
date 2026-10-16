export interface EvaluationCriterion {
  name: string;
  points: string | number;
}

export interface ScheduleItem {
  time: string;
  activity: string;
}

export interface CoordinatorEntry {
  id?: string;
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface Competition {
  coordinators?: CoordinatorEntry[];
  id: string;
  slug: string;
  name: string;
  district: string;
  districtIndex: number;
  districtTagline: string;
  category: 'Hardware & Circuits' | 'Research & Ideas' | 'Career & Strategy' | 'Esports & Creative';
  tag: string;
  shortDescription: string;
  fullDescription: string;
  about: string;
  venue: string;
  eligibility: string;
  teamSizeLimit: string;
  maxTeamMembers: number;
  isIndividualOnly?: boolean;
  isFixedSquad?: boolean;
  theme?: string;
  approvedDomains?: string[];
  scheduleFlow: ScheduleItem[];
  evaluationMatrix?: {
    totalPoints: string | number;
    criteria: EvaluationCriterion[];
  };
  roundsDescription?: string[];
  rules: string[];
  expectations: string[];
  formatNote: string;
  highlights: string[];
  iconName: string;
  bannerImage: string;
  cardImage: string;
  mapCoords: { x: number; y: number };
  accentColor: string;
  accentSecondary: string;
  accentBg: string;
  themeVibe: 'circuit' | 'arena' | 'research' | 'innovation' | 'pitch' | 'career' | 'creative' | 'culture';
  faqs: { question: string; answer: string }[];
  // Registration & Payment Settings
  isPaid?: boolean;
  registrationFee?: string;
  isFeeFixed?: boolean;
  showPaymentQr?: boolean;
  upiId?: string;
  payeeName?: string;
  qrMode?: 'upload' | 'generate';
  qrCodeUrl?: string;
  requireUtr?: boolean;
  requireScreenshot?: boolean;
  whatsappLink?: string;
  // Backwards compatibility helpers
  eligibilityPlaceholder: string;
  teamRequirementsPlaceholder: string;
  rulesPlaceholder: string[];
}

export const FESTIVAL_INFO = {
  name: "YUGANTAR",
  edition: "2026",
  concept: "NEXUS CITY",
  tagline: "Ideas into circuits. Innovation into action.",
  subheading: "A celebration of electronics, engineering, creative thinking and emerging technology — hosted by the Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur.",
  date: "21 October 2026",
  isoDate: "2026-10-21T09:00:00+05:30",
  venue: "Priyadarshini College of Engineering, Nagpur",
  locationShort: "PCE Campus, Nagpur",
  address: "CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur, Maharashtra 440019",
  department: "Department of Electronics and Telecommunication Engineering",
  organizers: "Tele-Era Department Student Forum, Department of Electronics & Telecommunication Engineering",
  college: "Priyadarshini College of Engineering, Nagpur",
};

export const FESTIVAL_ASSETS = {
  heroArtwork: "/images/nexus-city/home-hero-desktop.webp",
  heroArtworkMobile: "/images/nexus-city/home-hero-mobile.webp",
  districtsMap: "/images/nexus-city/city-districts-map.webp",
  skybridge: "/images/nexus-city/hero-futuristic-city-clouds.webp",
  competitionsHero: "/images/nexus-city/competition-hero-desktop.webp",
  competitionsHeroMobile: "/images/nexus-city/competition-hero-mobile.webp",
  logoEmblem: "/images/nexus-city/yugantar-logo-isolated.webp",
};

export const COMPETITIONS: Competition[] = [
  // -------------------------------------------------------------------------
  // 1. PROJECT COMPETITION
  // -------------------------------------------------------------------------
  {
    id: "project-competition",
    slug: "project-competition",
    name: "Project Competition",
    district: "Innovation District",
    districtIndex: 0,
    districtTagline: "The epicenter of applied hardware, embedded architectures, and operational engineering prototypes.",
    category: "Hardware & Circuits",
    tag: "Applied Systems Exhibition",
    venue: "ETC Department Laboratories, PCE Campus",
    eligibility: "VII Semester Students Only",
    teamSizeLimit: "Maximum 4 members per team",
    maxTeamMembers: 4,
    isPaid: true,
    registrationFee: "₹300 per team",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
        shortDescription: "Demonstrate operational hardware models, embedded systems, and applied engineering prototypes solving practical challenges.",
    fullDescription: "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition's stated submission requirements.",
    about: "The Project Competition is the cornerstone hardware showcase of YUGANTAR 2026. Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition's stated submission requirements.",
    scheduleFlow: [
      { time: "09:00 AM - 10:00 AM", activity: "Reporting & Setup: Teams arrive, verify registration with coordinators, and set up hardware/software models on assigned workstations." },
      { time: "10:00 AM - 01:00 PM", activity: "Live Exhibition & Panel Evaluation: Consecutive judging panel visits. Strict 10-minute window: 7-min technical demonstration + 3-min Q&A." },
      { time: "01:00 PM - 02:00 PM", activity: "Score Compilation: Judges finalize scoring matrix. Teams dismantle setups and clear workstations." },
      { time: "02:00 PM", activity: "Result Declaration: Top-scoring teams announced based on cumulative evaluations." },
    ],
    evaluationMatrix: {
      totalPoints: "100 Points Total",
      criteria: [
        { name: "Innovation & Originality", points: "25 points" },
        { name: "Technical Complexity & Execution", points: "30 points" },
        { name: "Practical Applicability", points: "20 points" },
        { name: "Presentation & Viva", points: "25 points" },
      ],
    },
    rules: [
      "Setup & Hardware Requirements: Teams must bring all necessary hardware components, laptops, and extension cords required for their project. The department will only provide a standard desk and a single electrical power socket. Projects must be fully functional.",
      "Technical Domain Scope: Participants can showcase projects from any relevant engineering or technical subject or domain. Projects must demonstrate genuine practical implementation, circuit design, and problem-solving merit while following stated submission requirements.",
      "Presentation & Conduct: Teams must display a printed A3 poster or a technical synopsis chart at their desk. Every registered team member must be present. Formal attire or college uniform is strictly mandatory.",
      "Evaluation Matrix (100 Points): Innovation (25), Complexity (30), Practical Applicability (20), Presentation & Viva (25).",
      "Disqualification: Submitting a purchased pre-built commercial kit, presenting a copied open-source project without significant modifications, or reusing a previous year's project will result in immediate disqualification.",
    ],
    expectations: [
      "Bring and install a fully functional working hardware prototype on your display bench.",
      "Display a printed A3 poster or technical synopsis chart explaining architecture and circuit design.",
      "Deliver a structured 7-minute demonstration followed by a 3-minute technical viva defense.",
      "Demonstrate live operational output under realistic test conditions.",
    ],
    formatNote: "Single-round exhibition with live demonstration and 10-minute jury evaluation window.",
    highlights: [
      "Live hardware prototype demonstration",
      "Open to all relevant engineering and technical domains",
      "100-point rigorous evaluation rubric",
    ],
    iconName: "Cpu",
    bannerImage: "/images/competitions/project-competition.webp",
    cardImage: "/images/competitions/project-competition.webp",
    mapCoords: { x: 37, y: 70 },
    accentColor: "#4B91E8",
    accentSecondary: "#6BA7F2",
    accentBg: "rgba(75, 145, 232, 0.08)",
    themeVibe: "innovation",
    faqs: [
      {
        question: "What technical domains or subjects are eligible?",
        answer: "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition's stated submission requirements.",
      },
      {
        question: "What equipment is provided at the workstations?",
        answer: "The department provides a standard desk and a single electrical power socket. All other hardware, laptops, adapters, and extension cords must be brought by the team.",
      },
    ],
    coordinators: [
        {
            "id": "coord-proj-1",
            "name": "Dr. (Mrs) J. M. Bhattad",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-proj-2",
            "name": "Mr. D. G. Gahane",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-proj-3",
            "name": "Dr(Ms). J. C. Kolte",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-proj-4",
            "name": "Ms. P. B. Pendke",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-proj-5",
            "name": "Khushi Pardhi",
            "role": "Student Coordinator",
            "phone": "+91 95524 58818",
            "email": null
        },
        {
            "id": "coord-proj-6",
            "name": "Samsher Kode",
            "role": "Student Coordinator",
            "phone": "+91 93593 83375",
            "email": null
        },
        {
            "id": "coord-proj-7",
            "name": "Om Wadaskar",
            "role": "Student Coordinator",
            "phone": "+91 70581 36648",
            "email": null
        },
        {
            "id": "coord-proj-8",
            "name": "Gaurav Rajurkar",
            "role": "Student Coordinator",
            "phone": "+91 96579 51153",
            "email": null
        }
    ],
    eligibilityPlaceholder: "VII Semester Students Only",
    teamRequirementsPlaceholder: "Maximum 4 members per team",
    rulesPlaceholder: [
      "Open to projects from all relevant engineering and technical subjects and domains.",
      "Fully operational hardware required; no commercial pre-built kits.",
      "Mandatory printed A3 poster or synopsis chart on desk.",
      "Formal attire or college uniform strictly required.",
    ],
  },

  // -------------------------------------------------------------------------
  // 2. PPT PRESENTATION COMPETITION
  // -------------------------------------------------------------------------
  {
    id: "ppt-presentation",
    slug: "ppt-presentation",
    name: "PPT Presentation Competition",
    district: "Vision District",
    districtIndex: 1,
    districtTagline: "The academic forum for emerging breakthroughs, research methodology, and analytical synthesis.",
    category: "Research & Ideas",
    tag: "Technical Symposia",
    venue: "Meeting Room",
    eligibility: "VII Semester Students Only",
    teamSizeLimit: "Maximum 4 members per team",
    maxTeamMembers: 4,
    isPaid: true,
    registrationFee: "₹200 per team",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Present structured technical research papers and emerging technological breakthroughs with analytical clarity.",
    fullDescription: "An intellectual forum for VII semester students to present original research, technological surveys, and advanced engineering concepts before a distinguished panel.",
    about: "The PPT Presentation Competition provides an authentic academic symposium environment. Students present comprehensive technical studies, research frameworks, and engineering methodologies in the Meeting Room.",
    scheduleFlow: [
      { time: "11:00 AM", activity: "Reporting & File Transfer: All teams report strictly outside the Meeting Room and submit pre-made presentation files via pen drive to coordinators." },
      { time: "11:30 AM Onwards", activity: "Live Presentations: Teams called in sequentially to deliver presentations before the judging panel (8 mins presentation + 2 mins Q&A)." },
      { time: "Post-Presentation", activity: "Immediate Exit: Teams must leave the immediate vicinity after presentation to preserve corridor silence." },
    ],
    evaluationMatrix: {
      totalPoints: "20 Marks Total",
      criteria: [
        { name: "Originality & Research", points: "5 marks" },
        { name: "Slide Design & Visuals", points: "5 marks" },
        { name: "Communication & Delivery", points: "5 marks" },
        { name: "Q&A Defense", points: "5 marks" },
      ],
    },
    rules: [
      "Presentation Requirements: Presentations must be completely pre-made prior to the event. The content presented must be highly original. Plagiarism will result in immediate disqualification.",
      "Discipline & Decorum: Strict silence must be maintained outside the Meeting Room. Participants are strictly prohibited from gathering, loitering, or creating noise in the corridors.",
      "Presentation Timing: Teams will be given a maximum of 8 minutes to present their slides, followed by a 2-minute Q&A session.",
      "Evaluation Matrix (20 Marks Total): 4 criteria, each carrying 5 marks: Originality & Research (5), Slide Design (5), Communication & Delivery (5), Q&A Defense (5).",
    ],
    expectations: [
      "Report strictly at 11:00 AM outside the Meeting Room with presentation files loaded on a pen drive.",
      "Deliver a timed 8-minute technical slide presentation.",
      "Defend your methodology during a rigorous 2-minute jury Q&A session.",
      "Maintain professional silence and decorum outside the venue.",
    ],
    formatNote: "Single-round live technical presentation (8 min presentation + 2 min Q&A).",
    highlights: [
      "Live presentation in the Meeting Room",
      "Strict 20-mark evaluation rubric",
      "Direct technical defense against jury inquiries",
    ],
    iconName: "Presentation",
    bannerImage: "/images/competitions/ppt-presentation.webp",
    cardImage: "/images/competitions/ppt-presentation.webp",
    mapCoords: { x: 31, y: 19 },
    accentColor: "#8578D8",
    accentSecondary: "#9E93E4",
    accentBg: "rgba(133, 120, 216, 0.08)",
    themeVibe: "research",
    faqs: [
      {
        question: "How should we submit our presentation slides?",
        answer: "Teams must report at 11:00 AM outside the Meeting Room and hand over their pre-made slide deck on a pen drive to the event coordinators.",
      },
      {
        question: "What is the timing limit for presentations?",
        answer: "A strict maximum of 8 minutes for the slide presentation, followed by 2 minutes for panel Q&A.",
      },
    ],
    coordinators: [
        {
            "id": "coord-ppt-1",
            "name": "Dr. A. K. Kondelwar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-ppt-2",
            "name": "Mrs. S. S. Mankar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-ppt-3",
            "name": "Pooja Konge",
            "role": "Student Coordinator",
            "phone": "+91 95793 28823",
            "email": null
        },
        {
            "id": "coord-ppt-4",
            "name": "Dishant Chokhande",
            "role": "Student Coordinator",
            "phone": "+91 96895 87991",
            "email": null
        }
    ],
    eligibilityPlaceholder: "VII Semester Students Only",
    teamRequirementsPlaceholder: "Maximum 4 members per team",
    rulesPlaceholder: [
      "Venue: Meeting Room. Reporting strictly at 11:00 AM.",
      "Timing: 8 minutes presentation + 2 minutes Q&A.",
      "Submission via pen drive prior to presentations.",
      "Strict corridor silence mandatory.",
    ],
  },

  // -------------------------------------------------------------------------
  // 3. BREADBOARD COMPETITION
  // -------------------------------------------------------------------------
  {
    id: "breadboard-competition",
    slug: "breadboard-competition",
    name: "Bread Board Competition",
    district: "Circuit District",
    districtIndex: 2,
    districtTagline: "The high-voltage speed zone for discrete electronics, schematics, and bench calibration.",
    category: "Hardware & Circuits",
    tag: "Hands-on Circuitry",
    venue: "EW's Lab",
    eligibility: "V Semester Students Only",
    teamSizeLimit: "Maximum 2 members per team",
    maxTeamMembers: 2,
    isPaid: true,
    registrationFee: "₹100 per person / ₹150 team",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Test schematic interpretation, circuit design on paper, and rapid practical breadboard implementation.",
    fullDescription: "A two-round hands-on circuit challenge in EW's Lab. Teams qualify through a paper circuit design test, then wire a working functional circuit on breadboard.",
    about: "Bread Board Competition tests core practical electronics craftsmanship. Participants decipher problem statements, draft circuit schematics under timed conditions, and construct functional circuits with discrete components in EW's Lab.",
    scheduleFlow: [
      { time: "Round 1 (Qualifying)", activity: "Circuit on Paper: Teams receive a technical problem statement to solve by designing the correct circuit diagram on paper (Time limit: 15 to 30 minutes). Correct circuits qualify for Round 2." },
      { time: "Round 2 (Implementation)", activity: "Practical Breadboard Construction: Qualified teams receive a new problem statement to design and physically construct a working circuit on a breadboard." },
    ],
    rules: [
      "Strict Anti-Cheating Policy: Cheating in any form (mobile phones, unauthorized reference materials, communicating with other teams) is strictly prohibited. Caught teams face immediate disqualification.",
      "Component & Workspace Rules: Teams must carefully handle all lab equipment and return all components properly after evaluation.",
      "Round 2 Evaluation Criteria: Winners are decided based on successful execution of the required output. In case of a tie, neatness of wiring, optimization of components, and time taken will be considered.",
    ],
    expectations: [
      "Accurately design and draw circuit diagrams on paper within the 15-30 minute qualifying window.",
      "Quickly assemble and debug working circuits on solderless breadboards in Round 2.",
      "Handle lab instruments and components with professional discipline.",
      "Demonstrate verified functional output to the evaluating faculty.",
    ],
    formatNote: "Two-round elimination: Round 1 (Circuit on Paper) + Round 2 (Breadboard Implementation).",
    highlights: [
      "Two-round qualifying & execution format",
      "Conducted on-site in EW's Lab",
      "Evaluated on verified functional output, wiring neatness, and completion time",
    ],
    iconName: "Zap",
    bannerImage: "/images/competitions/breadboard-competition.webp",
    cardImage: "/images/competitions/breadboard-competition.webp",
    mapCoords: { x: 19, y: 61 },
    accentColor: "#3B9CD8",
    accentSecondary: "#5CB4EA",
    accentBg: "rgba(59, 156, 216, 0.08)",
    themeVibe: "circuit",
    faqs: [
      {
        question: "Where is the Bread Board Competition held?",
        answer: "The event is conducted inside EW's Lab. Only V Semester students are eligible.",
      },
      {
        question: "How do teams qualify for the breadboard round?",
        answer: "Every team that successfully draws the functionally correct circuit on paper in Round 1 within 15-30 minutes qualifies for Round 2.",
      },
    ],
    coordinators: [
        {
            "id": "coord-bb-1",
            "name": "Dr. S. P. Washimkar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-bb-2",
            "name": "Dr. V. V. Panchbhai",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-bb-3",
            "name": "Ujjwal Barange",
            "role": "Student Coordinator",
            "phone": "+91 79874 94482",
            "email": null
        },
        {
            "id": "coord-bb-4",
            "name": "Rizam Ramteke",
            "role": "Student Coordinator",
            "phone": "+91 88057 94318",
            "email": null
        }
    ],
    eligibilityPlaceholder: "V Semester Students Only",
    teamRequirementsPlaceholder: "Maximum 2 members per team",
    rulesPlaceholder: [
      "Venue: EW's Lab. Eligibility: V Semester Only.",
      "Round 1: Circuit diagram on paper (15-30 mins).",
      "Round 2: Working circuit implementation on breadboard.",
      "Strict anti-cheating policy: no mobile devices allowed.",
    ],
  },

  // -------------------------------------------------------------------------
  // 4. IDEATHON
  // -------------------------------------------------------------------------
  {
    id: "ideathon",
    slug: "ideathon",
    name: "Ideathon",
    district: "Nexus District",
    districtIndex: 3,
    districtTagline: "The high-tempo incubation lab for problem solving, mentor shortlisting, and final pitches.",
    category: "Research & Ideas",
    tag: "Rapid Innovation Challenge",
    venue: "Aeronautical Seminar Hall (Room 303)",
    eligibility: "All Semesters",
    teamSizeLimit: "Maximum 4 members per team",
    maxTeamMembers: 4,
    isPaid: true,
    registrationFee: "₹200 per team",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Tackle on-the-spot problem statements, develop innovative solutions, clear mentor filtering, and pitch to judges.",
    fullDescription: "A high-intensity innovation challenge in Room 303. Teams receive unannounced problem statements, brainstorm viable technical solutions, undergo mentor review, and deliver formal final presentations.",
    about: "Ideathon gathers multidisciplinary thinkers to solve authentic engineering and societal challenges. Themes are revealed on the spot. Teams brainstorm, refine their solutions with visiting mentors, and defend their pitch before the jury.",
    scheduleFlow: [
      { time: "10:00 AM", activity: "Reporting: Teams report to Aeronautical Seminar Hall (Room 303) for attendance and seating." },
      { time: "10:30 AM", activity: "Problem Statement Reveal: Official problem statements and themes are revealed on the spot." },
      { time: "10:30 AM - 01:00 PM", activity: "Brainstorming & Solution Design: Teams collaborate to develop an innovative solution or business model." },
      { time: "01:00 PM Onwards", activity: "Mentor Round: Mentors/judges review raw concepts and shortlist the most promising teams." },
      { time: "Final Presentation", activity: "Final Jury Pitch: Shortlisted teams deliver a formal 5-7 minute presentation + Q&A to the core panel." },
    ],
    rules: [
      "Work & Development: All brainstorming must be done at the venue. Teams can use their laptops and internet for research, but the core idea must be developed on the spot. Plagiarism leads to disqualification.",
      "Mentor Round Guidelines: Teams should be prepared to quickly explain their approach, target audience, and feasibility. The mentor's shortlist decision is final.",
      "Final Presentation & Evaluation: Shortlisted teams will have limited time (5-7 minutes) to present, followed by Q&A. Evaluated on innovation, practical feasibility, impact, and clarity.",
    ],
    expectations: [
      "Report by 10:00 AM in Room 303 for seating and theme briefing.",
      "Formulate a complete technical or business solution on the spot.",
      "Pitch the concept during the 01:00 PM mentor filtering round.",
      "Deliver a compelling 5-7 minute final pitch if shortlisted.",
    ],
    formatNote: "On-the-spot problem reveal, brainstorming session, mentor shortlisting, and final jury presentation.",
    highlights: [
      "Live problem statement reveal at 10:30 AM",
      "Interactive mentor guidance and shortlisting round",
      "Formal stage pitch to core judging panel",
    ],
    iconName: "Lightbulb",
    bannerImage: "/images/competitions/ideathon.webp",
    cardImage: "/images/competitions/ideathon.webp",
    mapCoords: { x: 69.5, y: 19.5 },
    accentColor: "#E07A43",
    accentSecondary: "#F5A16F",
    accentBg: "rgba(224, 122, 67, 0.08)",
    themeVibe: "pitch",
    faqs: [
      {
        question: "Can we use laptops and mobile internet for research?",
        answer: "Yes, teams may use laptops and the internet for background research, but the core concept and presentation deck must be developed on the spot at the venue.",
      },
      {
        question: "Who is eligible for Ideathon?",
        answer: "Ideathon is open to students across all semesters with teams of up to 4 members.",
      },
    ],
    coordinators: [
        {
            "id": "coord-idea-1",
            "name": "Dr. N. S. Ambatkar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-idea-2",
            "name": "Mr. P. R. Lakhe",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-idea-3",
            "name": "Prathemesh Pawar",
            "role": "Student Coordinator",
            "phone": "+91 72767 85069",
            "email": null
        },
        {
            "id": "coord-idea-4",
            "name": "Yatharth Kathane",
            "role": "Student Coordinator",
            "phone": "+91 79727 23911",
            "email": null
        }
    ],
    eligibilityPlaceholder: "All Semesters",
    teamRequirementsPlaceholder: "Maximum 4 members per team",
    rulesPlaceholder: [
      "Venue: Aeronautical Seminar Hall (Room 303).",
      "Themes revealed live at 10:30 AM; on-the-spot ideation only.",
      "Mandatory mentor shortlisting at 01:00 PM.",
      "5-7 minute final pitch for shortlisted teams.",
    ],
  },

  // -------------------------------------------------------------------------
  // 5. MOCK PLACEMENT DRIVE
  // -------------------------------------------------------------------------
  {
    id: "mock-placement-drive",
    slug: "mock-placement-drive",
    name: "Mock Placement Drive",
    district: "Corporate Concourse",
    districtIndex: 4,
    districtTagline: "The executive recruitment simulation evaluating group discussions, technical fundamentals, and personal interviews.",
    category: "Career & Strategy",
    tag: "Corporate Recruitment Simulation",
    venue: "Room 306",
    eligibility: "V Semester Students Only",
    teamSizeLimit: "Strictly Individual (1 person)",
    maxTeamMembers: 1,
    isIndividualOnly: true,
    isPaid: true,
    registrationFee: "₹100 per candidate",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Experience authentic corporate recruitment with round-one Group Discussions and round-two Technical & HR interviews.",
    fullDescription: "A two-round corporate hiring simulation for V semester students in Room 306. Candidates participate in timed group discussions followed by one-on-one personal interviews.",
    about: "Mock Placement Drive bridges collegiate learning and corporate selection. Participants face real-world hiring scrutiny: defending logic during group discussions, followed by in-depth technical and behavioral interviews with experienced evaluators.",
    scheduleFlow: [
      { time: "Round 1 (Group Discussion)", activity: "Participants are divided into small batches. Each group discusses a technical or general topic for 10-15 minutes. Evaluators observe and shortlist candidates." },
      { time: "Round 2 (Personal Interview)", activity: "Shortlisted candidates undergo a one-on-one technical and HR interview with the judging panel in Room 306." },
    ],
    rules: [
      "Professional Attire & Documentation: Strict formal dress code is mandatory. Carry at least two printed hard copies of an updated resume/CV.",
      "Group Discussion Conduct: Maintain professional decorum. Interrupting aggressively or using unprofessional language leads to negative marking or disqualification. Evaluation based on communication, leadership, logic, and active listening.",
      "Interview Guidelines: Wait quietly outside Room 306 until called. Evaluation focuses on technical fundamentals, problem-solving, confidence, and presentation.",
    ],
    expectations: [
      "Arrive in strict formal corporate attire.",
      "Bring at least two hard copies of your printed, updated resume.",
      "Participate actively in a 10-15 minute group discussion round.",
      "Undergo rigorous technical and HR questioning if shortlisted for Round 2.",
    ],
    formatNote: "Two-stage evaluation: Round 1 (Group Discussion, 10-15 mins) + Round 2 (Technical & HR Personal Interview).",
    highlights: [
      "Authentic corporate hiring simulation in Room 306",
      "Strict individual participation format for V semester",
      "Detailed evaluation on technical fundamentals, GD decorum, and HR poise",
    ],
    iconName: "Briefcase",
    bannerImage: "/images/competitions/mock-placement-drive.webp",
    cardImage: "/images/competitions/mock-placement-drive.webp",
    mapCoords: { x: 17, y: 35 },
    accentColor: "#2F855A",
    accentSecondary: "#48BB78",
    accentBg: "rgba(47, 133, 90, 0.08)",
    themeVibe: "career",
    faqs: [
      {
        question: "Is formal dress code strictly enforced?",
        answer: "Yes. Strict formal corporate attire is mandatory. Candidates without formal dress or printed resumes will not be allowed to participate.",
      },
      {
        question: "How many copies of the resume are required?",
        answer: "You must carry at least two printed hard copies of your updated resume/CV.",
      },
    ],
    coordinators: [
        {
            "id": "coord-mock-1",
            "name": "Mrs. P. J. Suryawanshi",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-mock-2",
            "name": "Gomati Deshmukh",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-mock-3",
            "name": "Mrs. R. R. Zalke",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-mock-4",
            "name": "Vedant Gaikwad",
            "role": "Student Coordinator",
            "phone": "+91 96998 64120",
            "email": null
        },
        {
            "id": "coord-mock-5",
            "name": "Student Coordinator",
            "role": "Student Coordinator",
            "phone": "+91 89991 89509",
            "email": null
        },
        {
            "id": "coord-mock-6",
            "name": "Aachal Dhapekar",
            "role": "Student Coordinator",
            "phone": "+91 93733 85732",
            "email": null
        }
    ],
    eligibilityPlaceholder: "V Semester Students Only",
    teamRequirementsPlaceholder: "Strictly Individual (1 person)",
    rulesPlaceholder: [
      "Venue: Room 306. Strictly Individual participation.",
      "Eligibility: V Semester Students Only.",
      "Mandatory formal attire and 2 printed hard copies of resume.",
      "Round 1: Group Discussion; Round 2: Technical & HR Interview.",
    ],
  },

  // -------------------------------------------------------------------------
  // 6. POSTER COMPETITION
  // -------------------------------------------------------------------------
  {
    id: "poster-competition",
    slug: "poster-competition",
    name: "Poster Competition",
    district: "Design District",
    districtIndex: 5,
    districtTagline: "The technical visual gallery examining electronic waste, green engineering, and sustainability solutions.",
    category: "Esports & Creative",
    tag: "Technical Visual Communication",
    venue: "Room 301",
    theme: "E-Scrap",
    eligibility: "All Semesters",
    teamSizeLimit: "Maximum 2 members per team",
    maxTeamMembers: 2,
    isPaid: true,
    registrationFee: "₹100 per person / ₹150 team",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Display and defend technical research posters centered exclusively on the theme of 'E-Scrap' (electronic waste).",
    fullDescription: "A scientific visual exhibition in Room 301. Teams present hand-drawn or digitally printed posters revolving around electronic waste solutions, sustainability, and green engineering.",
    about: "Poster Competition combines artistic clarity and scientific rigor. Centered strictly around the official theme 'E-Scrap', participants exhibit creative solutions to electronic waste and defend their concepts before the judging panel.",
    scheduleFlow: [
      { time: "Reporting & Setup", activity: "Teams mount or display their pre-made posters at designated workstations in Room 301." },
      { time: "Live Evaluation", activity: "The judging panel visits each poster sequentially. Teams get 3-5 minutes to explain their concept, followed by a Q&A session." },
    ],
    rules: [
      "Poster Specifications: Posters must be completely prepared in advance (standard A3/A2 or chart paper). Can be hand-drawn or digitally designed and printed.",
      "Theme Adherence & Originality: Must strictly revolve around 'E-Scrap' (electronic waste). The artwork must be original. Plagiarism leads to immediate disqualification.",
      "Evaluation Criteria: Theme relevance, visual impact & creativity, and verbal presentation/defense during Q&A.",
    ],
    expectations: [
      "Bring a completed pre-made poster adhering strictly to the 'E-Scrap' theme.",
      "Mount your poster at your assigned workstation in Room 301.",
      "Deliver a concise 3-5 minute presentation explaining your concept to visiting judges.",
      "Answer questions regarding e-waste lifecycle, circuit recycling, and environmental impact.",
    ],
    formatNote: "Single-round exhibition with 3-5 minute live presentation and jury Q&A.",
    highlights: [
      "Official theme: E-Scrap (Electronic Waste)",
      "Standard A3/A2 or chart paper exhibition in Room 301",
      "Evaluated on theme relevance, visual creativity, and defense",
    ],
    iconName: "Image",
    bannerImage: "/images/competitions/poster-competition.webp",
    cardImage: "/images/competitions/poster-competition.webp",
    mapCoords: { x: 61, y: 68.5 },
    accentColor: "#D66853",
    accentSecondary: "#E58B79",
    accentBg: "rgba(214, 104, 83, 0.08)",
    themeVibe: "creative",
    faqs: [
      {
        question: "Can posters be hand-drawn or must they be digitally printed?",
        answer: "Both are allowed! Posters can be hand-drawn or digitally designed and printed on standard A3/A2 or chart paper.",
      },
      {
        question: "What is the mandatory theme?",
        answer: "The competition theme is strictly 'E-Scrap' (electronic waste). Any poster not adhering to this theme will not be evaluated.",
      },
    ],
    coordinators: [
        {
            "id": "coord-post-1",
            "name": "Dr. P. P. Ashtankar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-post-2",
            "name": "Dr. A. S. Khobragade",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-post-3",
            "name": "Aryan Dehankar",
            "role": "Student Coordinator",
            "phone": "+91 73856 35401",
            "email": null
        },
        {
            "id": "coord-post-4",
            "name": "Anshool Harinkhede",
            "role": "Student Coordinator",
            "phone": "+91 92845 51472",
            "email": null
        }
    ],
    eligibilityPlaceholder: "All Semesters",
    teamRequirementsPlaceholder: "Maximum 2 members per team",
    rulesPlaceholder: [
      "Theme: Strictly 'E-Scrap' (Electronic Waste).",
      "Venue: Room 301. Maximum 2 members per team.",
      "Standard A3/A2 or chart paper (hand-drawn or printed).",
      "3-5 minute live presentation + jury Q&A.",
    ],
  },

  // -------------------------------------------------------------------------
  // 7. E-GAMING (FREE FIRE & BGMI)
  // -------------------------------------------------------------------------
  {
    id: "e-gaming",
    slug: "e-gaming",
    name: "E-Gaming (Free Fire & BGMI)",
    district: "Esports Arena",
    districtIndex: 6,
    districtTagline: "The high-intensity battle arena for collegiate squad esports in Free Fire and BGMI.",
    category: "Esports & Creative",
    tag: "Collegiate Battle Royale",
    venue: "Rooms 307 and 302",
    eligibility: "All Semesters",
    teamSizeLimit: "Squad of 4 members per team",
    maxTeamMembers: 4,
    isFixedSquad: true,
    isPaid: true,
    registrationFee: "₹200 per squad",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Squad battle royale esports tournament featuring custom room matches in Free Fire and BGMI on mobile smartphones.",
    fullDescription: "High-octane collegiate esports matches hosted in Rooms 307 and 302. Squads of 4 compete in custom room lobbies under strict fair-play and native touch control rules.",
    about: "Esports Arena hosts battle royale tournament play in Free Fire and BGMI. Teams of 4 test tactical coordination, map rotation, and reflexes across custom lobbies with real-time room administration.",
    scheduleFlow: [
      { time: "Reporting & Room Allocation", activity: "Squads report to Rooms 307 and 302. Custom room IDs/passwords are shared exclusively with team leaders at the venue." },
      { time: "Qualifying Matches", activity: "Top-performing teams advance based on placement and kill points calculated by coordinators." },
      { time: "Final Showdown", activity: "Qualifying squads compete in final match(es) to determine the tournament champions." },
    ],
    rules: [
      "Device & Network Requirements: Smartphones only (No tablets, iPads, or emulators). Players must use their own mobile data internet.",
      "Fair Play & Anti-Cheat: Hacks, mods, aimbots, GFX tools, or physical triggers are strictly banned. Players must use native touch controls. Cheating results in permanent squad disqualification.",
      "In-Game Rules: Teaming up with rival squads is prohibited. Players must download required maps beforehand. Point system decided by coordinators is absolute.",
      "Conduct: No toxic behavior, shouting, or abusive language. Remain seated until the match concludes.",
    ],
    expectations: [
      "Bring fully charged smartphones with pre-downloaded game maps and active personal mobile data.",
      "Report to assigned rooms (Room 307 or 302) on time for room ID credential distribution.",
      "Play with native screen touch controls only (no physical triggers or emulators).",
      "Maintain respectful competitive sportsmanship throughout all matches.",
    ],
    formatNote: "Custom room squad matches: Qualifying round followed by grand final showdown.",
    highlights: [
      "Featured titles: Free Fire and BGMI",
      "Strict squad of 4 format (smartphones only)",
      "Hosted in designated esports rooms (Rooms 307 & 302)",
    ],
    iconName: "Gamepad2",
    bannerImage: "/images/competitions/e-gaming.webp",
    cardImage: "/images/competitions/e-gaming.webp",
    mapCoords: { x: 82, y: 61.5 },
    accentColor: "#9333EA",
    accentSecondary: "#A855F7",
    accentBg: "rgba(147, 51, 234, 0.08)",
    themeVibe: "arena",
    faqs: [
      {
        question: "Can we use tablets, iPads, or gaming triggers?",
        answer: "No. Only smartphones with native touch controls are allowed. Tablets, iPads, triggers, and PC emulators are strictly banned.",
      },
      {
        question: "Will campus Wi-Fi be provided for gaming?",
        answer: "No. All participants must ensure their own active personal mobile data connection.",
      },
    ],
    coordinators: [
        {
            "id": "coord-eg-1",
            "name": "Dr. P. U. Chati",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-eg-2",
            "name": "Dr. C. N. Bhoyar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-eg-3",
            "name": "Shivam Tatole",
            "role": "Student Coordinator",
            "phone": "+91 78210 87589",
            "email": null
        },
        {
            "id": "coord-eg-4",
            "name": "Tejas Dhanorkar",
            "role": "Student Coordinator",
            "phone": "+91 81809 32693",
            "email": null
        }
    ],
    eligibilityPlaceholder: "All Semesters",
    teamRequirementsPlaceholder: "Squad of 4 members per team",
    rulesPlaceholder: [
      "Smartphones only (No tablets/emulators); personal mobile data.",
      "Squad of 4 members. Venues: Rooms 307 and 302.",
      "Strict anti-cheat; native touch controls only.",
      "Maps must be pre-downloaded before reporting.",
    ],
  },

  // -------------------------------------------------------------------------
  // 8. OPEN MIC COMPETITION
  // -------------------------------------------------------------------------
  {
    id: "open-mic",
    slug: "open-mic",
    name: "Open Mic Competition",
    district: "Culture Concourse",
    districtIndex: 7,
    districtTagline: "The acoustic and spoken expression stage for musical, poetic, and creative performance craft.",
    category: "Esports & Creative",
    tag: "Acoustic & Spoken Showcase",
    venue: "Aeronautical Seminar Hall (Room 303)",
    eligibility: "All Semesters",
    teamSizeLimit: "Individual (Solo Performer)",
    maxTeamMembers: 1,
    isIndividualOnly: true,
    isPaid: true,
    registrationFee: "₹100 per performer",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Showcase solo creative talent—singing, poetry, comedy, or beatboxing—on a live acoustic stage under time limits.",
    fullDescription: "A vibrant solo cultural performance stage in Room 303. Individual performers take the stage for 4-5 minutes across music, poetry, standup comedy, or beatboxing.",
    about: "Open Mic celebrates stage poise, creative delivery, and artistic expression. Performers present original spoken word, acoustic singing, or comedy under a warm spotlight with live sound reinforcement.",
    scheduleFlow: [
      { time: "Reporting & Audio Setup", activity: "Participants report prior to start time. Karaoke/backing tracks (MP3 on pen drive) must be submitted to coordinators at least 30 mins to 1 hour prior." },
      { time: "Live Performances", activity: "Participants perform sequentially before the audience and judging panel (4 to 5 minutes strict limit)." },
    ],
    rules: [
      "Performance Time Limit: Strict time limit of 4 to 5 minutes per performer. Exceeding time leads to point deductions or audio cut.",
      "Content & Decorum: Must maintain standard decency. Offensive language, hate speech, or inappropriate themes result in immediate disqualification and removal from stage.",
      "Equipment & Instruments: Standard microphones and basic sound system provided. Participants must bring their own musical instruments if required.",
      "Evaluation Criteria: Evaluated on confidence, stage presence, crowd engagement, voice/delivery quality, and overall entertainment value.",
    ],
    expectations: [
      "Submit MP3 backing tracks on a pen drive at least 30-60 minutes prior to track commencement.",
      "Bring your own acoustic instruments if performing live accompaniment.",
      "Deliver a captivating performance strictly within the 4-5 minute limit.",
      "Adhere strictly to college decorum and decency guidelines.",
    ],
    formatNote: "Single-round live performance with a strict 4-5 minute stage time limit.",
    highlights: [
      "Solo showcase in Aeronautical Seminar Hall (Room 303)",
      "Strict 4-5 minute performance window",
      "Evaluation on stage presence, delivery, and entertainment value",
    ],
    iconName: "Mic2",
    bannerImage: "/images/competitions/open-mic.webp",
    cardImage: "/images/competitions/open-mic.webp",
    mapCoords: { x: 84.5, y: 36 },
    accentColor: "#C05621",
    accentSecondary: "#DD6B20",
    accentBg: "rgba(192, 86, 33, 0.08)",
    themeVibe: "culture",
    faqs: [
      {
        question: "How do we submit backing tracks for singing?",
        answer: "Backing tracks in MP3 format on a pen drive must be handed over to the audio coordinators at least 30 minutes to 1 hour before the event begins.",
      },
      {
        question: "What is the performance duration?",
        answer: "Each performer is allotted strictly 4 to 5 minutes on stage. Exceeding the limit will result in point deductions.",
      },
    ],
    coordinators: [
        {
            "id": "coord-om-1",
            "name": "Ms. A. K. Parmar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-om-2",
            "name": "Dr(Ms). J. C. Kolte",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-om-3",
            "name": "Vedant Gawande",
            "role": "Student Coordinator",
            "phone": "+91 84218 41958",
            "email": null
        },
        {
            "id": "coord-om-4",
            "name": "Mohit Kawale",
            "role": "Student Coordinator",
            "phone": "+91 95799 30801",
            "email": null
        }
    ],
    eligibilityPlaceholder: "All Semesters",
    teamRequirementsPlaceholder: "Individual (Solo Performer)",
    rulesPlaceholder: [
      "Venue: Aeronautical Seminar Hall (Room 303).",
      "Strict time limit: 4 to 5 minutes per performer.",
      "Backing tracks (MP3 on pen drive) due 30-60 mins prior.",
      "Strict decency and non-offensive content policy.",
    ],
  },
  // -------------------------------------------------------------------------
  // 9. MINI PROJECT COMPETITION
  // -------------------------------------------------------------------------
  {
    id: "mini-project-competition",
    slug: "mini-project-competition",
    name: "Mini Project Competition",
    district: "Circuit Arena",
    districtIndex: 8,
    districtTagline: "The proving ground for early engineering prototypes, embedded circuits, and hands-on hardware innovation.",
    category: "Hardware & Circuits",
    tag: "Applied Hardware Exhibition",
    venue: "3rd Floor Room No. 305",
    eligibility: "III and VI Semester Students Only",
    teamSizeLimit: "Maximum 4 members per team",
    maxTeamMembers: 4,
    isPaid: true,
    registrationFee: "₹200 per team",
    upiId: "teleera@oksbi",
    payeeName: "TELE-ERA YUGANTAR 2026",
    qrMode: "generate",
    requireUtr: true,
    requireScreenshot: true,
    shortDescription: "Exhibit operational mini projects, embedded electronics, and prototype circuits designed by III & VI semester students.",
    fullDescription: "A specialized engineering showcase for III and VI semester students to demonstrate operational mini-project models, sensor interfaces, and circuit implementations before an academic evaluation panel.",
    about: "The Mini Project Competition provides 3rd and 6th semester engineers an authentic exhibition stage to demonstrate practical circuit design, microcontroller integration, and engineering problem-solving. Teams present operational hardware models in 3rd Floor Room No. 305.",
    scheduleFlow: [
      { time: "01:00 PM", activity: "Reporting & Setup: Teams report to 3rd Floor Room No. 305 and install working models on assigned benches." },
      { time: "01:30 PM Onwards", activity: "Live Jury Evaluation: Panel visits each workstation for technical demonstration (7 mins demo + 3 mins Q&A)." },
      { time: "03:30 PM", activity: "Score Compilation & Announcement: Scoring compiled based on circuit complexity, utility, and viva defense." },
    ],
    evaluationMatrix: {
      totalPoints: "100 Points Total",
      criteria: [
        { name: "Circuit Design & Innovation", points: "25 points" },
        { name: "Hardware Implementation & Neatness", points: "25 points" },
        { name: "Practical Utility & Functionality", points: "25 points" },
        { name: "Technical Viva & Q&A Defense", points: "25 points" },
      ],
    },
    rules: [
      "Eligibility: Strictly open to III and VI semester engineering students only.",
      "Hardware Setup: Teams must bring all project hardware, power supplies, connecting wires, and test equipment.",
      "Live Demonstration: The mini project model must be fully functional and demonstrated live before the jury panel.",
      "Team Composition: Teams may comprise 1 to 4 members. Every registered member must be present in formal attire.",
      "Academic Integrity: Plagiarized commercial off-the-shelf assemblies without original implementation will be disqualified.",
    ],
    expectations: [
      "Report strictly at 01:00 PM in 3rd Floor Room No. 305 with your operational hardware model.",
      "Demonstrate live working circuit functionality under jury examination.",
      "Defend technical design choices, circuit diagrams, and component selection during Q&A.",
      "Maintain bench cleanliness and electrical safety standards throughout the exhibition.",
    ],
    formatNote: "Single-round live prototype exhibition with 10-minute jury review (7 min demo + 3 min Q&A).",
    highlights: [
      "Dedicated arena in 3rd Floor Room No. 305",
      "Strict III and VI semester eligibility tier",
      "Comprehensive 100-point hardware rubric",
    ],
    iconName: "Cpu",
    bannerImage: "/images/competitions/project-competition.webp",
    cardImage: "/images/competitions/project-competition.webp",
    mapCoords: { x: 50, y: 55 },
    accentColor: "#3978F6",
    accentSecondary: "#60A5FA",
    accentBg: "rgba(57, 120, 246, 0.08)",
    themeVibe: "circuit",
    faqs: [
      {
        question: "Who is eligible to participate in the Mini Project Competition?",
        answer: "Participation is strictly restricted to students currently enrolled in III Semester or VI Semester.",
      },
      {
        question: "What is the maximum team size?",
        answer: "Teams can have between 1 and 4 members.",
      },
      {
        question: "What will be provided at the venue?",
        answer: "A standard workbench and electrical socket will be provided. Teams must bring their own components, extension cords, and test equipment.",
      },
    ],
    coordinators: [
        {
            "id": "coord-mini-1",
            "name": "Dr. P. P. Ashtankar",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-mini-2",
            "name": "Dr(Ms). J. C. Kolte",
            "role": "Faculty Coordinator",
            "phone": null,
            "email": null
        },
        {
            "id": "coord-mini-3",
            "name": "Summit Bhagat",
            "role": "Student Coordinator",
            "phone": "+91 89992 60789",
            "email": null
        },
        {
            "id": "coord-mini-4",
            "name": "Aditya Sumatkar",
            "role": "Student Coordinator",
            "phone": "+91 90494 62518",
            "email": null
        }
    ],
    eligibilityPlaceholder: "III & VI Semester Students Only",
    teamRequirementsPlaceholder: "1 to 4 Members per team",
    rulesPlaceholder: [
      "Strictly III & VI semester students only.",
      "Operational hardware models mandatory.",
      "Venue: 3rd Floor Room No. 305 at 1:00 PM.",
      "Live 10-minute jury evaluation (7-min demo + 3-min viva).",
    ],
  },
];

export function getCompetitionBySlug(slug: string): Competition | undefined {
  return COMPETITIONS.find(
    (c) => c.slug === slug || c.id === slug || (slug === 'mock-placement' && c.slug === 'mock-placement-drive')
  );
}

export function getAllCompetitionSlugs(): string[] {
  return COMPETITIONS.map((c) => c.slug);
}

export function getCompetitionGlow(accentColor?: string, themeVibe?: string): string {
  if (themeVibe) {
    switch (themeVibe) {
      case 'innovation':
        return 'glow-blue';
      case 'research':
        return 'glow-violet';
      case 'circuit':
        return 'glow-cyan';
      case 'pitch':
        return 'glow-amber';
      case 'career':
        return 'glow-emerald';
      case 'creative':
        return 'glow-coral';
      case 'arena':
        return 'glow-purple';
      case 'culture':
        return 'glow-amber';
    }
  }

  if (accentColor) {
    const c = accentColor.toLowerCase();
    if (c.includes('8578d8')) return 'glow-violet';
    if (c.includes('9333ea')) return 'glow-purple';
    if (c.includes('e07a43')) return 'glow-amber';
    if (c.includes('2f855a')) return 'glow-emerald';
    if (c.includes('d66853')) return 'glow-coral';
    if (c.includes('c05621')) return 'glow-amber';
    if (c.includes('3b9cd8')) return 'glow-cyan';
    if (c.includes('4b91e8')) return 'glow-blue';
  }

  return 'glow-blue';
}

export const FESTIVAL_JOURNEY = [
  {
    step: "01",
    phase: "Discovery & Track Selection",
    title: "Arrival & Orientation",
    subtitle: "Concourse Check-In",
    description: "Arrive at Priyadarshini College of Engineering, check in at the reception concourse, and collect your delegate credential packet.",
    details: "Student delegates report to the central concourse at the Department of ETC, verify their registration, collect official festival credentials, and receive their district floor map."
  },
  {
    step: "02",
    phase: "District Staging",
    title: "District Navigation",
    subtitle: "Explore Your Arenas",
    description: "Navigate to your assigned district—from hardware laboratories and research seminar halls to the corporate interview suites.",
    details: "Each of the 9 competition tracks operates in a specialized venue across the engineering complex, fully equipped with test benches, projection suites, or gaming arenas."
  },
  {
    step: "03",
    phase: "Competition & Jury Defense",
    title: "Competition & Innovation",
    subtitle: "Demonstrate & Compete",
    description: "Wire live circuits, demonstrate prototypes, articulate research papers, or compete in battlegrounds under expert evaluation.",
    details: "Participants present their engineering solutions to panels composed of experienced faculty, alumni innovators, and industry professionals evaluating practical merit and technical rigor."
  },
  {
    step: "04",
    phase: "Grand Valedictory",
    title: "Valedictory & Felicitations",
    subtitle: "The Grand Gathering",
    description: "Gather with student delegates from across institutions for keynote remarks, merit honors, and celebration of engineering craft.",
    details: "The festival culminates in the central auditorium with distinguished keynote speakers, announcement of track champions, certificate distribution, and felicitation of student coordinators."
  }
];

export const ORGANIZERS = [
  {
    name: "TELE-ERA Department Student Forum",
    role: "Departmental Student Body",
    department: "Department of Electronics & Telecommunication Engineering",
    description: "The premier student forum driving tech culture, technical symposia, laboratory workshops, and peer mentoring inside the department. TELE-ERA spearheads the execution of YUGANTAR 2026.",
    badge: "Host Department Forum",
    leadershipNote: "Student leadership body coordinating registrations, venue logistics, jury coordination, and technical challenge tracks."
  },
  {
    name: "Department Faculty Advisory Board",
    role: "Academic Mentorship & Jury Board",
    department: "Department of Electronics & Telecommunication Engineering",
    description: "Distinguished professors, laboratory heads, and senior academicians providing technical oversight, evaluation rubrics, and academic jury coordination across all nine engineering arenas.",
    badge: "Faculty Mentorship",
    leadershipNote: "Oversees academic standards, evaluation matrices, hardware safety, and technical judging."
  },
  {
    name: "IIC Cell",
    role: "Institution's Innovation Council",
    department: "Priyadarshini College of Engineering, Nagpur",
    description: "Promoting innovation, entrepreneurship, and intellectual ideation across engineering disciplines.",
    badge: "Innovation Council",
    leadershipNote: "Guides hackathon, ideathon, and prototype development standards."
  }
];

export const FAQS = [
  {
    category: "General & Venue",
    question: "When and where is YUGANTAR 2026 taking place?",
    answer: "YUGANTAR 2026 will be held on 21 October 2026 at Priyadarshini College of Engineering, located at CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur, Maharashtra 440019."
  },
  {
    category: "Eligibility",
    question: "Who can participate in YUGANTAR competitions?",
    answer: "Eligibility varies by competition according to official academic rules: Project Competition & PPT Presentation are for VII Semester students; Bread Board & Mock Placement Drive are for V Semester students; Mini Project Competition is for III and VI Semester students; Ideathon, Poster, E-Gaming, and Open Mic are open to all semesters."
  },
  {
    category: "Registration Architecture",
    question: "How does registration work for each competition?",
    answer: "Each competition has its dedicated registration form on this website. When submitted, the details are permanently saved in our database and forwarded directly to the official Google Form and Google Sheets with live confirmation."
  },
  {
    category: "Participation",
    question: "Can I participate in multiple competitions?",
    answer: "Yes, provided the scheduled time slots and semester eligibility requirements permit it."
  },
  {
    category: "Payment Proof",
    question: "How do I upload payment proof screenshot?",
    answer: "You can directly upload your payment screenshot image (PNG, JPG, WebP) in the registration form. It is automatically stored in our dedicated Cloudinary infrastructure and the secure URL is mapped into your registration."
  }
];
