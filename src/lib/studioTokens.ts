import { DataTokenCategory, DataTokenDefinition } from '@/types/studio';
import { REGISTRATION_FORMS, getRegistrationFormBySlug } from '@/data/registrationForms';
import { COMPETITIONS } from '@/data/events';

export const DATA_TOKEN_CATEGORIES: DataTokenCategory[] = [
  {
    category: 'Registration',
    description: 'Unique registration identifiers, timestamps, and metadata',
    tokens: [
      {
        token: '{{registration.id}}',
        name: 'Registration ID',
        description: 'Formatted participant registration code',
        dataType: 'string',
        sampleValue: 'YUG-PROJ-8421',
        category: 'Registration',
        isCommon: true,
      },
      {
        token: '{{registration.date}}',
        name: 'Registration Date',
        description: 'Date when the attendee registered',
        dataType: 'date',
        sampleValue: '14 Oct 2026',
        category: 'Registration',
        isCommon: true,
      },
      {
        token: '{{registration.submissionStatus}}',
        name: 'Submission Status',
        description: 'Current status of the registration submission',
        dataType: 'string',
        sampleValue: 'Confirmed',
        category: 'Registration',
        isCommon: true,
      },
      {
        token: '{{registration.verifyToken}}',
        name: 'Verification Reference',
        description: 'Cryptographic token used for entry scanning',
        dataType: 'string',
        sampleValue: 'yug_vf_9a2b8e3d',
        category: 'Registration',
        isCommon: true,
      },
    ],
  },
  {
    category: 'Participant',
    description: 'Primary candidate or team leader profile details',
    tokens: [
      {
        token: '{{participant.name}}',
        name: 'Participant / Leader Name',
        description: 'Full legal name of the registered student',
        dataType: 'string',
        sampleValue: 'Aarav Deshmukh',
        category: 'Participant',
        isCommon: true,
      },
      {
        token: '{{participant.email}}',
        name: 'Email Address',
        description: 'Official contact email of the participant',
        dataType: 'string',
        sampleValue: 'aarav.deshmukh@pce.ac.in',
        category: 'Participant',
        isCommon: true,
      },
      {
        token: '{{participant.phone}}',
        name: 'Contact Number',
        description: 'WhatsApp or mobile telephone number',
        dataType: 'string',
        sampleValue: '+91 98765 43210',
        category: 'Participant',
        isCommon: true,
      },
    ],
  },
  {
    category: 'Academic Information',
    description: 'College, engineering department, and semester records',
    tokens: [
      {
        token: '{{participant.college}}',
        name: 'College Name',
        description: 'Enrolled university or institute',
        dataType: 'string',
        sampleValue: 'Priyadarshini College of Engineering, Nagpur',
        category: 'Academic Information',
        isCommon: true,
      },
      {
        token: '{{participant.branch}}',
        name: 'Branch / Department',
        description: 'Academic engineering discipline',
        dataType: 'string',
        sampleValue: 'Electronics & Telecommunication (ETC)',
        category: 'Academic Information',
        isCommon: true,
      },
      {
        token: '{{participant.semester}}',
        name: 'Current Semester',
        description: 'Active semester of study (I, III, V, VII)',
        dataType: 'string',
        sampleValue: 'VII Sem',
        category: 'Academic Information',
        isCommon: true,
      },
      {
        token: '{{academic.prn}}',
        name: 'University PRN / Roll No',
        description: 'University permanent registration number (Mock Placement only)',
        dataType: 'string',
        sampleValue: '2023ETC1042',
        category: 'Academic Information',
        isCommon: false,
        applicableCompetitions: ['mock-placement-drive'],
      },
      {
        token: '{{academic.cgpa}}',
        name: 'Current CGPA / Percentage',
        description: 'Candidate academic aggregate score',
        dataType: 'string',
        sampleValue: '8.85 CGPA',
        category: 'Academic Information',
        isCommon: false,
        applicableCompetitions: ['mock-placement-drive'],
      },
    ],
  },
  {
    category: 'Team & Squad',
    description: 'Team name, roster list, and squad composition',
    tokens: [
      {
        token: '{{team.name}}',
        name: 'Team / Squad Name',
        description: 'Registered team name (falls back to participant name for solo)',
        dataType: 'string',
        sampleValue: 'Nexus Innovators',
        category: 'Team & Squad',
        isCommon: true,
      },
      {
        token: '{{team.size}}',
        name: 'Team Member Count',
        description: 'Total number of members in the team or squad',
        dataType: 'number',
        sampleValue: '3',
        category: 'Team & Squad',
        isCommon: true,
      },
      {
        token: '{{team.membersList}}',
        name: 'Full Team Roster',
        description: 'Comma-separated list of all team members',
        dataType: 'string',
        sampleValue: 'Aarav Deshmukh (Lead), Tanvi Sharma, Rohan Verma',
        category: 'Team & Squad',
        isCommon: true,
      },
      {
        token: '{{team.member2}}',
        name: 'Member 2 Name',
        description: 'Name of the second team member',
        dataType: 'string',
        sampleValue: 'Tanvi Sharma',
        category: 'Team & Squad',
        isCommon: false,
        applicableCompetitions: [
          'project-competition',
          'ppt-presentation',
          'breadboard-competition',
          'ideathon',
          'poster-competition',
          'e-gaming',
        ],
      },
      {
        token: '{{team.member3}}',
        name: 'Member 3 Name',
        description: 'Name of the third team member',
        dataType: 'string',
        sampleValue: 'Rohan Verma',
        category: 'Team & Squad',
        isCommon: false,
        applicableCompetitions: ['project-competition', 'ppt-presentation', 'ideathon', 'e-gaming'],
      },
      {
        token: '{{team.member4}}',
        name: 'Member 4 Name',
        description: 'Name of the fourth team member',
        dataType: 'string',
        sampleValue: 'Sneha Patil',
        category: 'Team & Squad',
        isCommon: false,
        applicableCompetitions: ['project-competition', 'ppt-presentation', 'ideathon', 'e-gaming'],
      },
      {
        token: '{{squad.game}}',
        name: 'E-Gaming Title',
        description: 'Selected esports tournament title (Free Fire or BGMI)',
        dataType: 'string',
        sampleValue: 'BGMI',
        category: 'Team & Squad',
        isCommon: false,
        applicableCompetitions: ['e-gaming'],
      },
      {
        token: '{{squad.leaderIGN}}',
        name: 'Leader In-Game Name & ID',
        description: 'IGN character ID of the squad leader',
        dataType: 'string',
        sampleValue: 'NexusPhantom#59218',
        category: 'Team & Squad',
        isCommon: false,
        applicableCompetitions: ['e-gaming'],
      },
    ],
  },
  {
    category: 'Competition',
    description: 'Event details, district, schedule time, and venue coordinates',
    tokens: [
      {
        token: '{{competition.name}}',
        name: 'Competition Title',
        description: 'Full title of the competition track',
        dataType: 'string',
        sampleValue: 'Inter-Collegiate Project Competition',
        category: 'Competition',
        isCommon: true,
      },
      {
        token: '{{competition.category}}',
        name: 'Category Track',
        description: 'Technical category of the arena',
        dataType: 'string',
        sampleValue: 'Hardware & Circuits',
        category: 'Competition',
        isCommon: true,
      },
      {
        token: '{{competition.venue}}',
        name: 'Event Venue',
        description: 'Designated campus room or lab venue',
        dataType: 'string',
        sampleValue: 'PCE Campus, Digdoh Hills, Nagpur',
        category: 'Competition',
        isCommon: true,
      },
      {
        token: '{{competition.date}}',
        name: 'Festival Date',
        description: 'Date of the competition event',
        dataType: 'string',
        sampleValue: '19 October 2026',
        category: 'Competition',
        isCommon: true,
      },
      {
        token: '{{competition.reportingTime}}',
        name: 'Reporting Time',
        description: 'Official reporting time for participants',
        dataType: 'string',
        sampleValue: '08:30 AM IST',
        category: 'Competition',
        isCommon: true,
      },
      {
        token: '{{competition.titleSpecific}}',
        name: 'Project / Idea / Poster / Act Title',
        description: 'Submitted title of project, paper, circuit, startup idea or performance',
        dataType: 'string',
        sampleValue: 'Autonomous Micro-Grid Power Controller',
        category: 'Competition',
        isCommon: false,
        applicableCompetitions: [
          'project-competition',
          'ppt-presentation',
          'breadboard-competition',
          'ideathon',
          'poster-competition',
          'open-mic',
        ],
      },
    ],
  },
  {
    category: 'Payment',
    description: 'Fee, transaction identifier, and verified settlement status',
    tokens: [
      {
        token: '{{payment.status}}',
        name: 'Payment Status',
        description: 'Verified confirmation status',
        dataType: 'string',
        sampleValue: 'Verified',
        category: 'Payment',
        isCommon: true,
      },
      {
        token: '{{payment.fee}}',
        name: 'Registration Fee',
        description: 'Amount charged for this entry',
        dataType: 'string',
        sampleValue: '₹300 / Team',
        category: 'Payment',
        isCommon: true,
      },
      {
        token: '{{payment.id}}',
        name: 'UTR / Transaction ID',
        description: 'UPI transaction reference submitted by user',
        dataType: 'string',
        sampleValue: 'UPI482910482910',
        category: 'Payment',
        isCommon: true,
      },
    ],
  },
  {
    category: 'Certificate',
    description: 'Certificate issuance records, recipient citations, and rankings',
    tokens: [
      {
        token: '{{certificate.id}}',
        name: 'Certificate ID',
        description: 'Official tamper-proof certificate identifier',
        dataType: 'string',
        sampleValue: 'CERT-YUG-2026-9481',
        category: 'Certificate',
        isCommon: true,
      },
      {
        token: '{{certificate.recipient}}',
        name: 'Recipient Name',
        description: 'Formatted name of the awardee or participant',
        dataType: 'string',
        sampleValue: 'Aarav Deshmukh',
        category: 'Certificate',
        isCommon: true,
      },
      {
        token: '{{certificate.rank}}',
        name: 'Achievement Rank / Award',
        description: 'Designation such as 1st Prize Winner, 2nd Place, or Participant',
        dataType: 'string',
        sampleValue: '1st Place Winner',
        category: 'Certificate',
        isCommon: true,
      },
      {
        token: '{{certificate.issueDate}}',
        name: 'Issue Date',
        description: 'Formal date of certificate award',
        dataType: 'date',
        sampleValue: '19 October 2026',
        category: 'Certificate',
        isCommon: true,
      },
      {
        token: '{{certificate.issuer}}',
        name: 'Issuing Organization',
        description: 'Official department forum name',
        dataType: 'string',
        sampleValue: 'Tele-Era Student Forum & Dept. of ETC',
        category: 'Certificate',
        isCommon: true,
      },
    ],
  },
];

/**
 * Returns all tokens applicable to a specific competition.
 * If competitionSlug is '__global__' or empty, returns all tokens marked isCommon.
 */
export function getTokensForCompetition(competitionSlug?: string): DataTokenDefinition[] {
  const allTokens = DATA_TOKEN_CATEGORIES.flatMap((c) => c.tokens);
  if (!competitionSlug || competitionSlug === '__global__') {
    return allTokens;
  }

  return allTokens.filter((token) => {
    if (!token.applicableCompetitions) return true;
    return token.applicableCompetitions.includes(competitionSlug);
  });
}

/**
 * Builds a dictionary of sample token values for live canvas preview.
 */
export function getSampleTokenValues(competitionSlug?: string): Record<string, string> {
  const comp = COMPETITIONS.find((c) => c.slug === competitionSlug) || COMPETITIONS[0];
  const form = getRegistrationFormBySlug(competitionSlug || 'project-competition');

  return {
    '{{registration.id}}': 'YUG-2026-REG-8421',
    '{{registration.date}}': '14 Oct 2026',
    '{{registration.submissionStatus}}': 'Confirmed',
    '{{registration.verifyToken}}': 'yug_vf_9a2b8e3d',
    '{{participant.name}}': 'Aarav Deshmukh',
    '{{participant.email}}': 'aarav.deshmukh@pce.ac.in',
    '{{participant.phone}}': '+91 98765 43210',
    '{{participant.college}}': 'Priyadarshini College of Engineering, Nagpur',
    '{{participant.branch}}': 'Electronics & Telecommunication (ETC)',
    '{{participant.semester}}': 'VII Sem',
    '{{academic.prn}}': '2023ETC1042',
    '{{academic.cgpa}}': '8.85 CGPA',
    '{{team.name}}': 'Nexus Innovators',
    '{{team.size}}': '3',
    '{{team.membersList}}': 'Aarav Deshmukh (Lead), Tanvi Sharma, Rohan Verma',
    '{{team.member2}}': 'Tanvi Sharma',
    '{{team.member3}}': 'Rohan Verma',
    '{{team.member4}}': 'Sneha Patil',
    '{{squad.game}}': 'BGMI',
    '{{squad.leaderIGN}}': 'NexusPhantom#59218',
    '{{competition.name}}': comp?.name || 'Inter-Collegiate Project Competition',
    '{{competition.category}}': comp?.category || 'Hardware & Circuits',
    '{{competition.venue}}': comp?.venue || 'PCE Campus, Digdoh Hills, Nagpur',
    '{{competition.date}}': '19 October 2026',
    '{{competition.reportingTime}}': '08:30 AM IST',
    '{{competition.titleSpecific}}': 'Autonomous Micro-Grid Power Controller',
    '{{payment.status}}': 'Verified',
    '{{payment.fee}}': comp?.registrationFee || '₹300 / Team',
    '{{payment.id}}': 'UPI482910482910',
    '{{certificate.id}}': 'CERT-YUG-2026-9481',
    '{{certificate.recipient}}': 'Aarav Deshmukh',
    '{{certificate.rank}}': '1st Place Winner',
    '{{certificate.issueDate}}': '19 October 2026',
    '{{certificate.issuer}}': 'Tele-Era Student Forum & Dept. of ETC',
  };
}

/**
 * Resolves token text using provided real or sample data map.
 */
export function resolveTokens(text: string, values: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{[a-zA-Z0-9_.]+\}\}/g, (match) => {
    return values[match] !== undefined ? values[match] : match;
  });
}

/**
 * Exports formatted documentation string suitable for copying to Canva / AI prompts.
 */
export function exportTokenDocumentation(competitionSlug?: string): string {
  const tokens = getTokensForCompetition(competitionSlug);
  const comp = COMPETITIONS.find((c) => c.slug === competitionSlug);

  let doc = `# YUGANTAR 2026 — Data Tokens Documentation\n`;
  if (comp) {
    doc += `Event: ${comp.name} (${comp.slug})\nCategory: ${comp.category}\n\n`;
  } else {
    doc += `Scope: Global (Applicable to all 8 Arenas)\n\n`;
  }

  doc += `Use these exact placeholder tokens in your Canva text blocks or background specifications:\n\n`;

  const grouped: Record<string, DataTokenDefinition[]> = {};
  tokens.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  for (const [category, items] of Object.entries(grouped)) {
    doc += `### ${category}\n`;
    items.forEach((item) => {
      doc += `- \`${item.token}\`: ${item.name} (e.g. "${item.sampleValue}") — ${item.description}\n`;
    });
    doc += `\n`;
  }

  return doc;
}
