import fs from 'fs';

const SCHEDULE_DATA = [
  {
    slug: 'ppt-presentation',
    name: 'PPT Presentation Competition',
    faculty: [
      { name: 'Dr. A. K. Kondelwar', role: 'Faculty Coordinator' },
      { name: 'Mrs. S. S. Mankar', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Pooja Konge', phone: '+91 95793 28823', role: 'Student Coordinator' },
      { name: 'Dishant Chokhande', phone: '+91 96895 87991', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'project-competition',
    name: 'Project Competition',
    faculty: [
      { name: 'Dr. (Mrs) J. M. Bhattad', role: 'Faculty Coordinator' },
      { name: 'Mr. D. G. Gahane', role: 'Faculty Coordinator' },
      { name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator' },
      { name: 'Ms. P. B. Pendke', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Khushi Pardhi', phone: '+91 95524 58818', role: 'Student Coordinator' },
      { name: 'Samsher Kode', phone: '+91 93593 83375', role: 'Student Coordinator' },
      { name: 'Om Wadaskar', phone: '+91 70581 36648', role: 'Student Coordinator' },
      { name: 'Gaurav Rajurkar', phone: '+91 96579 51153', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'mock-placement-drive',
    name: 'Mock Placement Drive',
    faculty: [
      { name: 'Mrs. P. J. Suryawanshi', role: 'Faculty Coordinator' },
      { name: 'Gomati Deshmukh', role: 'Faculty Coordinator' },
      { name: 'Mrs. R. R. Zalke', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Vedant Gaikwad', phone: '+91 96998 64120', role: 'Student Coordinator' },
      { name: 'Student Coordinator', phone: '+91 89991 89509', role: 'Student Coordinator' },
      { name: 'Aachal Dhapekar', phone: '+91 93733 85732', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'breadboard-competition',
    name: 'Bread Board Competition',
    faculty: [
      { name: 'Dr. S. P. Washimkar', role: 'Faculty Coordinator' },
      { name: 'Dr. V. V. Panchbhai', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Ujjwal Barange', phone: '+91 79874 94482', role: 'Student Coordinator' },
      { name: 'Rizam Ramteke', phone: '+91 88057 94318', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'ideathon',
    name: 'Ideathon',
    faculty: [
      { name: 'Dr. N. S. Ambatkar', role: 'Faculty Coordinator' },
      { name: 'Mr. P. R. Lakhe', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Prathemesh Pawar', phone: '+91 72767 85069', role: 'Student Coordinator' },
      { name: 'Yatharth Kathane', phone: '+91 79727 23911', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'poster-competition',
    name: 'Poster Competition',
    faculty: [
      { name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator' },
      { name: 'Dr. A. S. Khobragade', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Aryan Dehankar', phone: '+91 73856 35401', role: 'Student Coordinator' },
      { name: 'Anshool Harinkhede', phone: '+91 92845 51472', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'e-gaming',
    name: 'E-Gaming (Free Fire & BGMI)',
    faculty: [
      { name: 'Dr. P. U. Chati', role: 'Faculty Coordinator' },
      { name: 'Dr. C. N. Bhoyar', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Shivam Tatole', phone: '+91 78210 87589', role: 'Student Coordinator' },
      { name: 'Tejas Dhanorkar', phone: '+91 81809 32693', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'open-mic',
    name: 'Open Mic Competition',
    faculty: [
      { name: 'Ms. A. K. Parmar', role: 'Faculty Coordinator' },
      { name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Vedant Gawande', phone: '+91 84218 41958', role: 'Student Coordinator' },
      { name: 'Mohit Kawale', phone: '+91 95799 30801', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'mini-project-competition',
    name: 'Mini Project Competition',
    faculty: [
      { name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator' },
      { name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Summit Bhagat', phone: '+91 89992 60789', role: 'Student Coordinator' },
      { name: 'Aditya Sumatkar', phone: '+91 90494 62518', role: 'Student Coordinator' },
    ],
  },
];

async function generateReport() {
  const res = await fetch('http://localhost:3000/api/competitions');
  const json = await res.json();
  const apiComps = json.competitions || json;

  console.log('| Competition | Expected Faculty Coordinators (Excel) | Expected Student Coordinators (Excel) | Public API Returned Coordinators | Reconciliation Status |');
  console.log('|---|---|---|---|---|');

  for (const item of SCHEDULE_DATA) {
    const apiComp = apiComps.find(c => c.slug === item.slug);
    const expFaculty = item.faculty.map(f => f.name).join('<br/>');
    const expStudent = item.students.map(s => `${s.name}${s.phone ? ` (${s.phone})` : ''}`).join('<br/>');

    let retFaculty = 'None';
    let retStudent = 'None';
    let status = 'MISMATCH';

    if (apiComp && apiComp.coordinators) {
      const fList = apiComp.coordinators.filter(c => c.role.toLowerCase().includes('faculty'));
      const sList = apiComp.coordinators.filter(c => c.role.toLowerCase().includes('student'));
      retFaculty = fList.map(f => f.name).join('<br/>');
      retStudent = sList.map(s => `${s.name}${s.phone ? ` (${s.phone})` : ''}`).join('<br/>');

      const facultyMatch = item.faculty.length === fList.length && item.faculty.every(ef => fList.some(rf => rf.name.trim().toLowerCase() === ef.name.trim().toLowerCase()));
      const studentMatch = item.students.length === sList.length && item.students.every(es => sList.some(rs => rs.name.trim().toLowerCase() === es.name.trim().toLowerCase()));

      status = (facultyMatch && studentMatch) ? 'EXACT MATCH' : 'DISCREPANCY';
    }

    console.log(`| **${item.name}** | ${expFaculty} | ${expStudent} | **Faculty:**<br/>${retFaculty}<br/><br/>**Students:**<br/>${retStudent} | ${status} |`);
  }
}

generateReport().catch(console.error);
