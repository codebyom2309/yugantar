import fs from 'fs';

let content = fs.readFileSync('src/data/events.ts', 'utf8');

// Replace eligibility and descriptions for mini-project-competition
content = content.replace(
  '    eligibility: "Semester I and Semester V Students Only",',
  '    eligibility: "Semester 3 & V Students Only",\n    allowedSemesters: ["III", "V"],'
);

content = content.replace(
  'Exhibit operational mini projects, embedded electronics, and prototype circuits designed by Semester I & V students.',
  'Exhibit operational mini projects, embedded electronics, and prototype circuits designed by Semester III & V students.'
);

content = content.replace(
  'A specialized inter-collegiate engineering showcase for Semester I and Semester V students to demonstrate',
  'A specialized inter-collegiate engineering showcase for Semester III and Semester V students to demonstrate'
);

content = content.replace(
  'The Inter-Collegiate Mini Project Competition provides 1st and 5th semester engineers',
  'The Inter-Collegiate Mini Project Competition provides 3rd and 5th semester engineers'
);

content = content.replace(
  'Eligibility: Strictly open to Semester I and Semester V engineering students only.',
  'Eligibility: Strictly open to Semester III and Semester V engineering students only.'
);

content = content.replace(
  'Strict Semester I and Semester V eligibility tier',
  'Strict Semester III and Semester V eligibility tier'
);

content = content.replace(
  'Participation is open to students currently enrolled in Semester I or Semester V from any engineering college.',
  'Participation is open to students currently enrolled in Semester III or Semester V from any engineering college.'
);

content = content.replace(
  'Mini Project Competition is for Semester I and Semester V students;',
  'Mini Project Competition is for Semester III and Semester V students;'
);

fs.writeFileSync('src/data/events.ts', content, 'utf8');
console.log('Successfully updated events.ts for Mini Project Competition!');
