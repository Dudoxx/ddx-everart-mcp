#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;
console.log(`📦 Current version: ${currentVersion}`);

// Count changed files since last tag
try {
  const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', {
    encoding: 'utf8',
  }).trim();

  let diffCommand = 'git diff --name-only HEAD~1 HEAD';

  if (lastTag) {
    diffCommand = `git diff --name-only ${lastTag} HEAD`;
  }

  const changedFiles = execSync(diffCommand, { encoding: 'utf8' })
    .split('\n')
    .filter(
      (file) =>
        file.trim() &&
        !file.startsWith('package-lock.json') &&
        !file.startsWith('pnpm-lock.yaml') &&
        !file.startsWith('CHANGELOG.md')
    );

  console.log(`📝 Changed files: ${changedFiles.length}`);

  // Determine version bump type
  let newVersion;
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  // Check for breaking changes in commit messages
  const commitMessages = execSync(
    lastTag ? `git log --pretty=format:"%s" ${lastTag}..HEAD` : 'git log --pretty=format:"%s" HEAD~5..HEAD',
    { encoding: 'utf8' }
  );

  const hasBreakingChanges =
    commitMessages.includes('BREAKING CHANGE') || commitMessages.includes('!:');

  if (hasBreakingChanges) {
    // Major bump for breaking changes
    newVersion = `${major + 1}.0.0`;
    console.log('💥 Breaking changes detected → major bump');
  } else if (changedFiles.length >= 5) {
    // Minor bump for significant changes
    newVersion = `${major}.${minor + 1}.0`;
    console.log('✨ Significant changes detected → minor bump');
  } else {
    // Patch bump for small changes
    newVersion = `${major}.${minor}.${patch + 1}`;
    console.log('🔧 Minor changes detected → patch bump');
  }

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`✅ Version bumped from ${currentVersion} to ${newVersion}`);
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. Run: pnpm run changelog:update');
  console.log('   3. Commit: git add package.json CHANGELOG.md');
  console.log(`   4. Tag: git tag -a v${newVersion} -m "Release v${newVersion}"`);
  console.log('   5. Push: git push && git push --tags');
} catch (error) {
  console.error('❌ Error bumping version:', error.message);
  process.exit(1);
}
