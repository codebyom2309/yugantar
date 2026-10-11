/**
 * YUGANTAR 2026 — Registration Form Configurations
 *
 * Complete mapping of all 8 competition Google Forms with their
 * field definitions, entry IDs, validation rules, and options.
 *
 * Every entry ID in this file was extracted from the official
 * "Event Registration Forms Entry Ids (1).md" document.
 */

// ---------------------------------------------------------------------------
// Shared option sets (from user-supplied data)
// ---------------------------------------------------------------------------

export const COLLEGE_OPTIONS = [
  'PCE', 'GHRCE', 'PIET', 'YCCE', 'VNIT', 'RCOEM',
  'LITU / LIT', 'GCOEN', 'SVPCET', 'IIITN', 'Other',
] as const;

export const BRANCH_OPTIONS = [
  'CSE', 'CT', 'IT', 'AI & DS', 'ETC', 'ECE',
  'ME / MECH', 'CE / CIVIL', 'EE', 'CHEM', 'AERO',
  'BIOTECH', 'IoT', 'ROBO & AI', 'Other',
] as const;

export const SEMESTER_OPTIONS = ['I', 'III', 'V', 'VII'] as const;

export const TEAM_SIZE_OPTIONS_4 = ['1', '2', '3', '4'] as const;
export const TEAM_SIZE_OPTIONS_2 = ['1', '2'] as const;

export const GAME_TITLE_OPTIONS = ['Free Fire', 'BGMI'] as const;

// ---------------------------------------------------------------------------
// Field definition types
// ---------------------------------------------------------------------------

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox';

export interface FormField {
  /** Internal key used by the website form */
  key: string;
  /** Google Forms entry ID (without 'entry.' prefix) */
  entryId: string;
  /** Display label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below the field */
  helpText?: string;
  /** Field input type */
  type: FieldType;
  /** Is this field required? */
  required: boolean;
  /** Options for select/radio fields */
  options?: readonly string[];
  /** Validation regex pattern */
  pattern?: string;
  /** Min length */
  minLength?: number;
  /** Max length */
  maxLength?: number;
  /**
   * Conditional visibility:
   * Show this field only when the specified field has one of the listed values.
   */
  showWhen?: {
    field: string;
    values: string[];
  };
  /** Field group for visual sectioning */
  group?: string;
}

export interface RegistrationFormConfig {
  /** Competition slug — must match events.ts */
  competitionSlug: string;
  /** Competition display name */
  competitionName: string;
  /** Google Form ID (extracted from URL) */
  googleFormId: string;
  /** Full Google Form URL */
  googleFormUrl: string;
  /** Direct formResponse submission endpoint */
  formResponseUrl: string;
  /** All form fields in order */
  fields: FormField[];
  /** Acknowledgment field entry ID (always the last checkbox-style field) */
  acknowledgmentEntryId: string;
  /** Acknowledgment label text */
  acknowledgmentLabel: string;
}

// ---------------------------------------------------------------------------
// 1. PROJECT COMPETITION
// ---------------------------------------------------------------------------

const projectCompetition: RegistrationFormConfig = {
  competitionSlug: 'project-competition',
  competitionName: 'Inter-Collegiate Project Competition',
  googleFormId: '1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8',
  googleFormUrl: 'https://docs.google.com/forms/d/1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8/formResponse',
  acknowledgmentEntryId: '522674004',
  acknowledgmentLabel: 'I acknowledge the competition rules, confirm the originality of our work, and agree to abide by the official guidelines.',
  fields: [
    // --- Leader Info ---
    { key: 'leaderName', entryId: '1247623769', label: 'Team Leader Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Team Leader' },
    { key: 'leaderPhone', entryId: '1886253153', label: 'Team Leader WhatsApp / Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Team Leader' },
    { key: 'leaderEmail', entryId: '57127786', label: 'Team Leader Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Team Leader' },
    { key: 'leaderCollege', entryId: '355433790', label: 'Team Leader College Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Team Leader' },
    { key: 'leaderBranch', entryId: '677017667', label: 'Team Leader Branch', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Team Leader' },
    { key: 'leaderSemester', entryId: '1484093551', label: 'Team Leader Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Team Leader' },
    // --- Project Info ---
    { key: 'teamName', entryId: '1310711298', label: 'Team Name', type: 'text', required: true, placeholder: 'Your team name', group: 'Project Details' },
    { key: 'projectTitle', entryId: '1767563588', label: 'Project Title', type: 'text', required: true, placeholder: 'Title of your project', group: 'Project Details' },
    { key: 'projectTheme', entryId: '783060620', label: 'Project Theme / Domain', type: 'text', required: true, placeholder: 'e.g., IoT, Robotics, Embedded Systems', group: 'Project Details' },
    { key: 'projectSynopsis', entryId: '742691939', label: 'Project Synopsis / Report Link', type: 'url', required: false, placeholder: 'Paste Google Drive / Cloud link', helpText: 'Share a link to your project report or synopsis document.', group: 'Project Details' },
    // --- Team Size ---
    { key: 'teamSize', entryId: '1973523851', label: 'Number of Team Members', type: 'select', required: true, options: TEAM_SIZE_OPTIONS_4, group: 'Team Composition' },
    // --- Member 2 ---
    { key: 'member2Name', entryId: '559266168', label: 'Member 2 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2College', entryId: '987736817', label: 'Member 2 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2Branch', entryId: '1818674262', label: 'Member 2 Branch', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2Semester', entryId: '1202806662', label: 'Member 2 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    // --- Member 3 ---
    { key: 'member3Name', entryId: '330783630', label: 'Member 3 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3College', entryId: '1244926580', label: 'Member 3 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3Branch', entryId: '12314873', label: 'Member 3 Branch', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3Semester', entryId: '2002355985', label: 'Member 3 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    // --- Member 4 ---
    { key: 'member4Name', entryId: '167934536', label: 'Member 4 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4College', entryId: '341120015', label: 'Member 4 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4Branch', entryId: '1114475021', label: 'Member 4 Branch', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4Semester', entryId: '2091625677', label: 'Member 4 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    // --- Payment ---
    { key: 'paymentId', entryId: '870331274', label: 'Payment Transaction ID / UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '576016933', label: 'Payment Proof / Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur link', helpText: 'Upload your payment screenshot to Google Drive or Imgur and paste the link.', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 2. PPT PRESENTATION COMPETITION
// ---------------------------------------------------------------------------

const pptPresentation: RegistrationFormConfig = {
  competitionSlug: 'ppt-presentation',
  competitionName: 'Inter-Collegiate PPT Presentation Competition',
  googleFormId: '1nXblcJviqnUx-B4KZAtV755eaJN4Vw6MxjOPaSpwh5g',
  googleFormUrl: 'https://docs.google.com/forms/d/1nXblcJviqnUx-B4KZAtV755eaJN4Vw6MxjOPaSpwh5g/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/1nXblcJviqnUx-B4KZAtV755eaJN4Vw6MxjOPaSpwh5g/formResponse',
  acknowledgmentEntryId: '261158896',
  acknowledgmentLabel: 'I acknowledge the competition rules, confirm the originality of our presentation, and agree to abide by the official guidelines.',
  fields: [
    { key: 'leaderName', entryId: '1985629791', label: 'Lead Presenter / Team Leader Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Lead Presenter' },
    { key: 'leaderPhone', entryId: '1168653731', label: 'WhatsApp / Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Lead Presenter' },
    { key: 'leaderEmail', entryId: '868467667', label: 'Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Lead Presenter' },
    { key: 'leaderCollege', entryId: '2117897775', label: 'Lead Presenter College Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Lead Presenter' },
    { key: 'leaderBranch', entryId: '1156338937', label: 'Lead Presenter Branch', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Lead Presenter' },
    { key: 'leaderSemester', entryId: '188248857', label: 'Lead Presenter Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Lead Presenter' },
    { key: 'teamName', entryId: '1763219760', label: 'Team Name', type: 'text', required: true, placeholder: 'Your team name', group: 'Presentation Details' },
    { key: 'presentationTitle', entryId: '38584934', label: 'Presentation Title', type: 'text', required: true, placeholder: 'Title of your presentation', group: 'Presentation Details' },
    { key: 'pptTheme', entryId: '432181743', label: 'PPT Theme / Topic', type: 'text', required: true, placeholder: 'e.g., 5G Networks, AI in Healthcare', group: 'Presentation Details' },
    { key: 'pptLink', entryId: '189059947', label: 'Upload PPT or Abstract Link', type: 'url', required: false, placeholder: 'Paste Google Drive link', helpText: 'Share a link to your PPT or abstract document.', group: 'Presentation Details' },
    { key: 'teamSize', entryId: '1981021729', label: 'Number of Team Members', type: 'select', required: true, options: TEAM_SIZE_OPTIONS_4, group: 'Team Composition' },
    { key: 'member2Name', entryId: '119189292', label: 'Member 2 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2College', entryId: '943882362', label: 'Member 2 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2Branch', entryId: '683755649', label: 'Member 2 Branch', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2Semester', entryId: '1930554198', label: 'Member 2 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member3Name', entryId: '50654028', label: 'Member 3 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3College', entryId: '1004506005', label: 'Member 3 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3Branch', entryId: '1462257507', label: 'Member 3 Branch', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3Semester', entryId: '298977695', label: 'Member 3 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member4Name', entryId: '647356100', label: 'Member 4 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4College', entryId: '891489655', label: 'Member 4 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4Branch', entryId: '44042998', label: 'Member 4 Branch', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4Semester', entryId: '1029928251', label: 'Member 4 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'paymentId', entryId: '1394783099', label: 'Payment Transaction ID / UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '162630126', label: 'Payment Proof / Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 3. BREADBOARD COMPETITION
// ---------------------------------------------------------------------------

const breadboardCompetition: RegistrationFormConfig = {
  competitionSlug: 'breadboard-competition',
  competitionName: 'Bread Board Competition',
  googleFormId: '13bSoKK8N4isK3oyEJE2-xP145_ugSq5mEfLaPEHsj_o',
  googleFormUrl: 'https://docs.google.com/forms/d/13bSoKK8N4isK3oyEJE2-xP145_ugSq5mEfLaPEHsj_o/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/13bSoKK8N4isK3oyEJE2-xP145_ugSq5mEfLaPEHsj_o/formResponse',
  acknowledgmentEntryId: '1315702359',
  acknowledgmentLabel: 'I acknowledge the competition rules, lab safety guidelines, and agree to abide by the official instructions.',
  fields: [
    { key: 'leaderName', entryId: '566536647', label: 'Team Leader or Participant Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Participant Info' },
    { key: 'leaderPhone', entryId: '154310965', label: 'WhatsApp or Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Participant Info' },
    { key: 'leaderEmail', entryId: '962808175', label: 'Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Participant Info' },
    { key: 'leaderCollege', entryId: '90242417', label: 'College Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Participant Info' },
    { key: 'leaderBranch', entryId: '589275917', label: 'Branch or Department', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Participant Info' },
    { key: 'leaderSemester', entryId: '2050284072', label: 'Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Participant Info' },
    { key: 'teamName', entryId: '1957481608', label: 'Team Name', type: 'text', required: false, placeholder: 'Leave blank if participating solo', helpText: 'Optional — only required for duo teams.', group: 'Competition Details' },
    { key: 'circuitTitle', entryId: '1429441812', label: 'Circuit or Project Title', type: 'text', required: false, placeholder: 'If applicable', group: 'Competition Details' },
    { key: 'teamSize', entryId: '1366053189', label: 'Number of Team Members', type: 'select', required: true, options: TEAM_SIZE_OPTIONS_2, group: 'Team Composition' },
    { key: 'member2Name', entryId: '993776401', label: 'Member 2 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'member2College', entryId: '1184417463', label: 'Member 2 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'member2Branch', entryId: '594664259', label: 'Member 2 Branch or Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'member2Semester', entryId: '166347228', label: 'Member 2 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'paymentId', entryId: '1352812692', label: 'Payment Transaction ID or UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '974311977', label: 'Payment Proof or Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 4. IDEATHON
// ---------------------------------------------------------------------------

const ideathon: RegistrationFormConfig = {
  competitionSlug: 'ideathon',
  competitionName: 'Ideathon',
  googleFormId: '1sxNwzdhO7vRkMV_ADtPPVG5ddPlNXvWYk6mKW9kmkXA',
  googleFormUrl: 'https://docs.google.com/forms/d/1sxNwzdhO7vRkMV_ADtPPVG5ddPlNXvWYk6mKW9kmkXA/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/1sxNwzdhO7vRkMV_ADtPPVG5ddPlNXvWYk6mKW9kmkXA/formResponse',
  acknowledgmentEntryId: '541048927',
  acknowledgmentLabel: 'I acknowledge the competition rules, code of conduct, and agree to abide by the official guidelines.',
  fields: [
    { key: 'leaderName', entryId: '2086855781', label: 'Team Leader Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Team Leader' },
    { key: 'leaderPhone', entryId: '982907548', label: 'WhatsApp / Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Team Leader' },
    { key: 'leaderEmail', entryId: '1244529215', label: 'Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Team Leader' },
    { key: 'leaderCollege', entryId: '974653953', label: 'Team Leader College Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Team Leader' },
    { key: 'leaderBranch', entryId: '894111056', label: 'Team Leader Branch / Department', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Team Leader' },
    { key: 'leaderSemester', entryId: '2068998990', label: 'Team Leader Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Team Leader' },
    { key: 'teamName', entryId: '1596665611', label: 'Team Name', type: 'text', required: true, placeholder: 'Your team name', group: 'Idea Details' },
    { key: 'ideaTitle', entryId: '545990831', label: 'Idea Title / Startup Name', type: 'text', required: true, placeholder: 'Your idea or startup name', group: 'Idea Details' },
    { key: 'ideaTheme', entryId: '33003986', label: 'Idea Theme / Domain', type: 'text', required: true, placeholder: 'e.g., Smart City, HealthTech, EdTech', group: 'Idea Details' },
    { key: 'ideaSummary', entryId: '67435564', label: 'Brief Idea Summary / Problem Statement Link', type: 'url', required: false, placeholder: 'Paste Google Drive / Cloud link', group: 'Idea Details' },
    { key: 'teamSize', entryId: '1100945841', label: 'Number of Team Members', type: 'select', required: true, options: TEAM_SIZE_OPTIONS_4, group: 'Team Composition' },
    { key: 'member2Name', entryId: '1708504570', label: 'Member 2 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2College', entryId: '1104161249', label: 'Member 2 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2Branch', entryId: '1050470056', label: 'Member 2 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member2Semester', entryId: '1856157339', label: 'Member 2 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Team Member 2' },
    { key: 'member3Name', entryId: '1834671462', label: 'Member 3 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3College', entryId: '283234466', label: 'Member 3 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3Branch', entryId: '863994683', label: 'Member 3 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member3Semester', entryId: '959955327', label: 'Member 3 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Team Member 3' },
    { key: 'member4Name', entryId: '2080953410', label: 'Member 4 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4College', entryId: '432593285', label: 'Member 4 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4Branch', entryId: '392083215', label: 'Member 4 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'member4Semester', entryId: '1507299716', label: 'Member 4 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Team Member 4' },
    { key: 'paymentId', entryId: '675248234', label: 'Payment Transaction ID / UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '1339617157', label: 'Payment Proof / Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 5. POSTER COMPETITION
// ---------------------------------------------------------------------------

const posterCompetition: RegistrationFormConfig = {
  competitionSlug: 'poster-competition',
  competitionName: 'Inter-Collegiate Poster Competition',
  googleFormId: '1W5_1yyh0C8V00Z7FHAO1g-z2i1iAWznGbjHM7JB-UHs',
  googleFormUrl: 'https://docs.google.com/forms/d/1W5_1yyh0C8V00Z7FHAO1g-z2i1iAWznGbjHM7JB-UHs/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/1W5_1yyh0C8V00Z7FHAO1g-z2i1iAWznGbjHM7JB-UHs/formResponse',
  acknowledgmentEntryId: '702259596',
  acknowledgmentLabel: 'I acknowledge the competition rules, confirm the originality of our poster, and agree to abide by the official guidelines.',
  fields: [
    { key: 'leaderName', entryId: '510326380', label: 'Team Leader / Participant Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Participant Info' },
    { key: 'leaderPhone', entryId: '883135659', label: 'WhatsApp / Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Participant Info' },
    { key: 'leaderEmail', entryId: '1334609793', label: 'Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Participant Info' },
    { key: 'leaderCollege', entryId: '1830462743', label: 'College Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Participant Info' },
    { key: 'leaderBranch', entryId: '1218070677', label: 'Branch / Department', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Participant Info' },
    { key: 'leaderSemester', entryId: '1494581515', label: 'Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Participant Info' },
    { key: 'teamName', entryId: '847848111', label: 'Team Name', type: 'text', required: false, placeholder: 'Leave blank if participating solo', group: 'Poster Details' },
    { key: 'posterTitle', entryId: '2011269066', label: 'Poster Title / Concept', type: 'text', required: true, placeholder: 'Title of your poster', group: 'Poster Details' },
    { key: 'teamSize', entryId: '775534102', label: 'Number of Team Members', type: 'select', required: true, options: TEAM_SIZE_OPTIONS_2, group: 'Team Composition' },
    { key: 'member2Name', entryId: '1215008858', label: 'Member 2 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'member2College', entryId: '1497096461', label: 'Member 2 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'member2Branch', entryId: '405489680', label: 'Member 2 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'member2Semester', entryId: '1630646540', label: 'Member 2 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['2'] }, group: 'Team Member 2' },
    { key: 'posterDraft', entryId: '607528050', label: 'Optional Poster Draft / Idea Link', type: 'url', required: false, placeholder: 'Paste Google Drive / Cloud link', helpText: 'Optional — share a draft of your poster concept.', group: 'Poster Details' },
    { key: 'paymentId', entryId: '761849121', label: 'Payment Transaction ID / UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '170328694', label: 'Payment Proof / Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur / Cloud link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 6. E-GAMING — FREE FIRE AND BGMI
// ---------------------------------------------------------------------------

const eGaming: RegistrationFormConfig = {
  competitionSlug: 'e-gaming',
  competitionName: 'Inter-Collegiate E-Gaming Competition',
  googleFormId: '1BL5B2b55wmMCcvjFYkbKUitOKn_-CBxFmNKlk8o8J2k',
  googleFormUrl: 'https://docs.google.com/forms/d/1BL5B2b55wmMCcvjFYkbKUitOKn_-CBxFmNKlk8o8J2k/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/1BL5B2b55wmMCcvjFYkbKUitOKn_-CBxFmNKlk8o8J2k/formResponse',
  acknowledgmentEntryId: '1355941974',
  acknowledgmentLabel: 'I agree to fair play rules, the anti-cheating agreement, and confirm that all squad members will compete on legitimate mobile devices only.',
  fields: [
    { key: 'squadName', entryId: '966676895', label: 'Squad / Team Name', type: 'text', required: true, placeholder: 'Your squad name', group: 'Squad Info' },
    { key: 'gameTitle', entryId: '1023829268', label: 'Game Title', type: 'select', required: true, options: GAME_TITLE_OPTIONS, group: 'Squad Info' },
    { key: 'leaderName', entryId: '2049477169', label: 'Squad Leader Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Squad Leader' },
    { key: 'leaderIGN', entryId: '1761808665', label: 'Squad Leader In-Game Name (IGN) & Character ID', type: 'text', required: true, placeholder: 'e.g., ProPlayer#1234', group: 'Squad Leader' },
    { key: 'leaderPhone', entryId: '711467638', label: 'Squad Leader WhatsApp / Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Squad Leader' },
    { key: 'leaderEmail', entryId: '897461599', label: 'Squad Leader Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Squad Leader' },
    { key: 'leaderCollege', entryId: '6582343', label: 'Squad Leader College Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Squad Leader' },
    { key: 'leaderBranch', entryId: '915519158', label: 'Squad Leader Branch / Department', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Squad Leader' },
    { key: 'leaderSemester', entryId: '1807281047', label: 'Squad Leader Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Squad Leader' },
    { key: 'teamSize', entryId: '220300563', label: 'Number of Squad Members', type: 'select', required: true, options: TEAM_SIZE_OPTIONS_4, group: 'Squad Composition' },
    // Player 2
    { key: 'member2Name', entryId: '1112943201', label: 'Player 2 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Player 2' },
    { key: 'member2IGN', entryId: '213519491', label: 'Player 2 In-Game Name (IGN) & Character ID', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Player 2' },
    { key: 'member2College', entryId: '1747865620', label: 'Player 2 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Player 2' },
    { key: 'member2Branch', entryId: '259483466', label: 'Player 2 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Player 2' },
    { key: 'member2Semester', entryId: '2113316285', label: 'Player 2 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['2', '3', '4'] }, group: 'Player 2' },
    // Player 3
    { key: 'member3Name', entryId: '796405544', label: 'Player 3 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Player 3' },
    { key: 'member3IGN', entryId: '296616436', label: 'Player 3 In-Game Name (IGN) & Character ID', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Player 3' },
    { key: 'member3College', entryId: '1145793559', label: 'Player 3 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Player 3' },
    { key: 'member3Branch', entryId: '809009254', label: 'Player 3 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Player 3' },
    { key: 'member3Semester', entryId: '2013712487', label: 'Player 3 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['3', '4'] }, group: 'Player 3' },
    // Player 4
    { key: 'member4Name', entryId: '144804034', label: 'Player 4 Full Name', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Player 4' },
    { key: 'member4IGN', entryId: '1339314097', label: 'Player 4 In-Game Name (IGN) & Character ID', type: 'text', required: false, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Player 4' },
    { key: 'member4College', entryId: '1376815736', label: 'Player 4 College Name', type: 'select', required: false, options: COLLEGE_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Player 4' },
    { key: 'member4Branch', entryId: '641312343', label: 'Player 4 Branch / Department', type: 'select', required: false, options: BRANCH_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Player 4' },
    { key: 'member4Semester', entryId: '1423484077', label: 'Player 4 Semester', type: 'select', required: false, options: SEMESTER_OPTIONS, showWhen: { field: 'teamSize', values: ['4'] }, group: 'Player 4' },
    { key: 'clanLogo', entryId: '188298062', label: 'Team / Clan Logo Link', type: 'url', required: false, placeholder: 'Paste Google Drive / Cloud link', helpText: 'Optional — share your squad logo.', group: 'Squad Info' },
    { key: 'paymentId', entryId: '1809570722', label: 'Payment Transaction ID / UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '1750245423', label: 'Payment Proof / Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur / Cloud link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 7. OPEN MIC
// ---------------------------------------------------------------------------

const openMic: RegistrationFormConfig = {
  competitionSlug: 'open-mic',
  competitionName: 'Inter-Collegiate Open Mic Competition',
  googleFormId: '1AxN0p0LChkcSoqMApeZ0Elyd2fPW2x49Z4IiBcKZlBI',
  googleFormUrl: 'https://docs.google.com/forms/d/1AxN0p0LChkcSoqMApeZ0Elyd2fPW2x49Z4IiBcKZlBI/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/1AxN0p0LChkcSoqMApeZ0Elyd2fPW2x49Z4IiBcKZlBI/formResponse',
  acknowledgmentEntryId: '1017466095',
  acknowledgmentLabel: 'I agree to the content guidelines undertaking and confirm my performance adheres to campus cultural standards.',
  fields: [
    { key: 'leaderName', entryId: '1065262970', label: 'Performer Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Performer Info' },
    { key: 'leaderPhone', entryId: '1729859348', label: 'WhatsApp / Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Performer Info' },
    { key: 'leaderEmail', entryId: '1864978237', label: 'Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Performer Info' },
    { key: 'leaderCollege', entryId: '1728042725', label: 'College / Institute Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Performer Info' },
    { key: 'leaderBranch', entryId: '1628692784', label: 'Branch / Department', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Performer Info' },
    { key: 'leaderSemester', entryId: '1944548289', label: 'Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Performer Info' },
    { key: 'performanceCategory', entryId: '871293896', label: 'Performance Category', type: 'text', required: true, placeholder: 'e.g., Poetry, Stand-up Comedy, Singing', group: 'Performance Details' },
    { key: 'performanceLanguage', entryId: '341625968', label: 'Language of Performance', type: 'text', required: true, placeholder: 'e.g., Hindi, English, Marathi', group: 'Performance Details' },
    { key: 'performanceTitle', entryId: '1934238584', label: 'Performance Title / Brief Theme', type: 'text', required: true, placeholder: 'Title or theme of your act', group: 'Performance Details' },
    { key: 'technicalRequirements', entryId: '421251375', label: 'Stage and Technical Requirements', type: 'textarea', required: false, placeholder: 'Describe any mic, audio, or stage setup needs', group: 'Performance Details' },
    { key: 'backingTrack', entryId: '700891645', label: 'Audio Backing Track Link', type: 'url', required: false, placeholder: 'Paste Google Drive link', helpText: 'Optional — submit in advance if you need a backing track.', group: 'Performance Details' },
    { key: 'paymentId', entryId: '787199701', label: 'Registration Fee Transaction ID / UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '1138344862', label: 'Payment Proof / Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// 8. MOCK PLACEMENT DRIVE
// ---------------------------------------------------------------------------

const mockPlacement: RegistrationFormConfig = {
  competitionSlug: 'mock-placement-drive',
  competitionName: 'Mock Placement Drive',
  googleFormId: 'e/1FAIpQLScjOWajk7h8k4f-DIMNsXmev0FwTv376PBK5QG2KU48ZvyMsA',
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScjOWajk7h8k4f-DIMNsXmev0FwTv376PBK5QG2KU48ZvyMsA/viewform',
  formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScjOWajk7h8k4f-DIMNsXmev0FwTv376PBK5QG2KU48ZvyMsA/formResponse',
  acknowledgmentEntryId: '2103563607',
  acknowledgmentLabel: 'I agree to the dress code requirements, attendance undertaking, and confirm I will attend in formal attire.',
  fields: [
    { key: 'leaderName', entryId: '379295386', label: 'Candidate Full Name', type: 'text', required: true, placeholder: 'Enter full name', group: 'Candidate Info' },
    { key: 'leaderPhone', entryId: '417173720', label: 'WhatsApp and Contact Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX', pattern: '^[+]?[0-9\\s-]{10,15}$', group: 'Candidate Info' },
    { key: 'leaderEmail', entryId: '1701361007', label: 'Email Address', type: 'email', required: true, placeholder: 'name@college.edu', group: 'Candidate Info' },
    { key: 'leaderCollege', entryId: '1230790993', label: 'College and Institute Name', type: 'select', required: true, options: COLLEGE_OPTIONS, group: 'Candidate Info' },
    { key: 'leaderBranch', entryId: '1877467127', label: 'Branch and Department', type: 'select', required: true, options: BRANCH_OPTIONS, group: 'Candidate Info' },
    { key: 'leaderSemester', entryId: '538314758', label: 'Current Semester', type: 'select', required: true, options: SEMESTER_OPTIONS, group: 'Candidate Info' },
    { key: 'prn', entryId: '498124197', label: 'University PRN and Roll Number', type: 'text', required: true, placeholder: 'e.g., 2023XXXX1234', group: 'Academic Details' },
    { key: 'cgpa', entryId: '415906003', label: 'Current Aggregate CGPA and Percentage', type: 'text', required: true, placeholder: 'e.g., 8.5 CGPA / 82%', group: 'Academic Details' },
    { key: 'preferredDomain', entryId: '1946721301', label: 'Preferred Domain and Role', type: 'text', required: true, placeholder: 'e.g., Software Dev, VLSI, Embedded Systems', group: 'Professional Details' },
    { key: 'technicalSkills', entryId: '765027768', label: 'Key Technical Skills', type: 'textarea', required: true, placeholder: 'List your core technical skills', group: 'Professional Details' },
    { key: 'resumeLink', entryId: '1075894283', label: 'Resume and CV Link', type: 'url', required: true, placeholder: 'Paste Google Drive link to your resume', helpText: 'Upload your updated resume/CV to Google Drive and share the link.', group: 'Professional Details' },
    { key: 'paymentId', entryId: '1985451643', label: 'Registration Fee Transaction ID and UTR Number', type: 'text', required: true, placeholder: 'e.g., UPI12345678', group: 'Payment' },
    { key: 'paymentProof', entryId: '549130376', label: 'Payment Proof and Screenshot Link', type: 'url', required: true, placeholder: 'Paste Google Drive / Imgur link', group: 'Payment' },
  ],
};

// ---------------------------------------------------------------------------
// EXPORTED REGISTRY
// ---------------------------------------------------------------------------

export const REGISTRATION_FORMS: RegistrationFormConfig[] = [
  projectCompetition,
  pptPresentation,
  breadboardCompetition,
  ideathon,
  posterCompetition,
  eGaming,
  openMic,
  mockPlacement,
];

export function getRegistrationFormBySlug(
  slug: string,
): RegistrationFormConfig | undefined {
  return REGISTRATION_FORMS.find(
    (f) =>
      f.competitionSlug === slug ||
      (slug === 'mock-placement' && f.competitionSlug === 'mock-placement-drive') ||
      (slug === 'breadboard' && f.competitionSlug === 'breadboard-competition'),
  );
}
