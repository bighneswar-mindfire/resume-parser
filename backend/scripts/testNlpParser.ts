/* Ad-hoc robustness test for NlpParserService — run: npx tsx scripts/testNlpParser.ts */
import { NlpParserService } from '../src/services/nlpParser.js';

const samples: Record<string, string> = {
  // 1. Classic clean format
  classic: `John Smith
john.smith@gmail.com | +1 (555) 123-4567
San Francisco, CA

PROFESSIONAL SUMMARY
Senior software engineer with 8 years of experience building web apps.

WORK EXPERIENCE
Senior Engineer, Acme Corp
2019 - Present
- Built React and Node.js services

Software Engineer, Beta Inc
2016 - 2019
- Python, Django, PostgreSQL

EDUCATION
Stanford University
B.S. in Computer Science, 2016

SKILLS
JavaScript, TypeScript, React, Node.js, Python, Django, PostgreSQL, Docker, AWS`,

  // 2. ALL-CAPS name + headers with decorations (common PDF export)
  allCapsDecorated: `PRIYA SHARMA
=====================================
Email: priya.sharma@outlook.com
Mobile: +91-9876543210

===== TECHNICAL SKILLS =====
* Java, Spring Boot, MySQL
* Kubernetes, Jenkins, CI/CD

===== EXPERIENCE =====
Infosys Ltd | Software Developer | Jan 2021 - Present
TCS | Junior Developer | Jun 2018 - Dec 2020

===== EDUCATION =====
B.Tech in Information Technology
National Institute of Technology, Rourkela — 2018`,

  // 3. Two-column PDF extraction (interleaved text, no clean headers)
  twoColumnMangled: `Rahul Verma Skills
rahul.v@yahoo.co.in React Angular
9123456780 TypeScript GraphQL
Bengaluru, India Docker
Experience
Flipkart — SDE II (2022 – Present) Education
Amazon — SDE I (2020 – 2022) M.Tech, IIT Delhi, 2020
B.Tech, VIT, 2018`,

  // 4. OCR-noisy image resume (tesseract artifacts)
  ocrNoisy: `M a r i a   G o n z a l e z
maria.gonzalez@ hotmail.com
Ph0ne: 555 987 6543

W0RK EXPERlENCE
Full Stack Developer , WebWorks lnc.
2017 — 2023
Built apps using Vue , Express and MongoDB

EDUCATlON
Bachelor of Science ln Computer Science
State Un1versity 2016`,

  // 5. Name lowercase + contact-first layout, "Curriculum Vitae" title line
  lowercaseNameCvTitle: `Curriculum Vitae

email: alex.chen.dev@proton.me
phone: (415) 555-0100

alex chen
Software Developer

Skills: rust, go, kubernetes, terraform, gcp

Employment History
2021-present  Platform Engineer @ Stripe
2018-2021     Backend Dev @ Square

Academic Background
MSc Computer Science, UC Berkeley (2018)`,

  // 6. Minimal / fresher resume, no experience section, skills inline
  fresher: `Ananya Patel
ananya.patel2024@gmail.com
+91 8765432109

Objective: Seeking an entry-level role.

I am proficient in HTML, CSS, JavaScript and learning React and Node.js.

Education
B.Tech Computer Science, KIIT University, expected 2025`,
};

for (const [label, text] of Object.entries(samples)) {
  const r = NlpParserService.parse(text);
  console.log(`\n========== ${label} ==========`);
  console.log(JSON.stringify(r, null, 2));
}
