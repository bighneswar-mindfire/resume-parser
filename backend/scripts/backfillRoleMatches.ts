import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Resume } from '../src/models/Resume.js';
import { NlpParserService } from '../src/services/nlpParser.js';
import { RoleMatcherService } from '../src/services/roleMatcher.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);

  const resumes = await Resume.find(
    { status: 'COMPLETED', $or: [{ matchedRoles: { $size: 0 } }, { matchedRoles: null }] },
    { rawText: 1, skills: 1, experience: 1 }
  );

  console.log(`Found ${resumes.length} completed resumes without role matches.`);

  let updated = 0;
  for (const resume of resumes) {
    if (!resume.rawText) {
      console.warn(`Skipping ${resume._id}: no rawText stored.`);
      continue;
    }

    const parsed = NlpParserService.parse(resume.rawText);
    const matchedRoles = RoleMatcherService.match(parsed, resume.rawText);

    await Resume.updateOne({ _id: resume._id }, { matchedRoles });
    updated += 1;

    const top = matchedRoles[0];
    console.log(`${resume._id}: top match ${top?.roleName} (${top?.score}%)`);
  }

  console.log(`Done. Updated ${updated}/${resumes.length}.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
