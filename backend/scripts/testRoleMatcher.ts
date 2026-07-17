import { NlpParserService } from '../src/services/nlpParser.js';
import { RoleMatcherService } from '../src/services/roleMatcher.js';

const samples: Record<string, string> = {
  frontendCandidate: `Jane Doe
jane@x.com
Skills: React, JavaScript, TypeScript, HTML, CSS, Next.js
Frontend developer building responsive SPAs`,
  devopsCandidate: `Sam Lee
sam@x.com
Skills: Docker, Kubernetes, AWS, Terraform, Jenkins, CI/CD
DevOps engineer, 4 years of experience in infrastructure and monitoring`,
  backendCandidate: `Raj Patel
raj@x.com
Skills: Node.js, Express, MongoDB, PostgreSQL, Redis, SQL
Backend developer building REST APIs and microservices`,
  emptyResume: ``,
};

for (const [label, text] of Object.entries(samples)) {
  const parsed = NlpParserService.parse(text);
  const matches = RoleMatcherService.match(parsed, text);
  console.log(`${label}:`);
  matches.forEach((m) => console.log(`  ${m.roleName.padEnd(22)} ${m.score}%`));
}
