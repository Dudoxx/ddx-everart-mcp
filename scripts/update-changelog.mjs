#!/usr/bin/env node

/**
 * Advanced Changelog Generator
 *
 * Features:
 * - Parses conventional commits (feat, fix, docs, etc.)
 * - Handles breaking changes, scopes, and categorization
 * - Supports --dry-run and --since flags
 * - Generates Keep a Changelog format
 * - Groups commits by version and category
 * - Links to GitHub commits
 *
 * Usage:
 *   node scripts/generate-changelog.mjs
 *   node scripts/generate-changelog.mjs --dry-run
 *   node scripts/generate-changelog.mjs --since v0.6.100
 *   node scripts/generate-changelog.mjs --since 2025-01-01
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// === CONFIGURATION ===

const CONFIG = {
  changelogFile: 'CHANGELOG.md',
  versionFile: '.version',
  packageFile: 'package.json',
  repoUrl: 'https://github.com/Dudoxx/ddx-copilot-ai',
  commitTypes: {
    feat: { label: 'Features', emoji: '✨', order: 1 },
    fix: { label: 'Bug Fixes', emoji: '🐛', order: 2 },
    perf: { label: 'Performance Improvements', emoji: '⚡', order: 3 },
    refactor: { label: 'Code Refactoring', emoji: '♻️', order: 4 },
    docs: { label: 'Documentation', emoji: '📚', order: 5 },
    style: { label: 'Styles', emoji: '💎', order: 6 },
    test: { label: 'Tests', emoji: '✅', order: 7 },
    build: { label: 'Build System', emoji: '📦', order: 8 },
    ci: { label: 'CI/CD', emoji: '🔧', order: 9 },
    chore: { label: 'Chores', emoji: '🔨', order: 10 },
    revert: { label: 'Reverts', emoji: '⏪', order: 11 },
  },
};

// === UTILITIES ===

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    dryRun: args.includes('--dry-run'),
    since: null,
    help: args.includes('--help') || args.includes('-h'),
  };

  const sinceIndex = args.findIndex((arg) => arg === '--since');
  if (sinceIndex !== -1 && args[sinceIndex + 1]) {
    flags.since = args[sinceIndex + 1];
  }

  return flags;
}

function showHelp() {
  console.log(`
📝 Advanced Changelog Generator

Usage:
  node scripts/generate-changelog.mjs [options]

Options:
  --dry-run         Show what would be generated without writing
  --since <ref>     Generate changelog since specific tag or date
                    Examples: --since v0.6.100, --since 2025-01-01
  --help, -h        Show this help message

Examples:
  # Generate full changelog
  node scripts/generate-changelog.mjs

  # Preview without writing
  node scripts/generate-changelog.mjs --dry-run

  # Since specific version
  node scripts/generate-changelog.mjs --since v0.6.100

  # Since date
  node scripts/generate-changelog.mjs --since 2025-01-01

Commit Format:
  <type>(<scope>): <subject>

  <body>

  BREAKING CHANGE: <description>

Types:
  feat      - New features
  fix       - Bug fixes
  perf      - Performance improvements
  refactor  - Code refactoring
  docs      - Documentation changes
  style     - Code style changes
  test      - Test additions/changes
  build     - Build system changes
  ci        - CI/CD changes
  chore     - Other changes
  revert    - Reverts

Examples:
  feat(chat): add full-screen form expansion
  fix(auth): correct password validation
  perf(db): add compound indexes for faster queries
  feat!: migrate to React 19.2 (breaking change)
  `);
}

function getCurrentVersion() {
  try {
    const pkg = JSON.parse(readFileSync(CONFIG.packageFile, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function getBuildInfo() {
  try {
    const versionData = JSON.parse(readFileSync(CONFIG.versionFile, 'utf-8'));
    return {
      buildCount: versionData.buildCount || 0,
      lastBuildDate: versionData.lastBuildDate || new Date().toISOString(),
    };
  } catch {
    return {
      buildCount: 0,
      lastBuildDate: new Date().toISOString(),
    };
  }
}

function getGitLog(since = null) {
  try {
    let command = 'git log --pretty=format:"%H%n%an%n%ae%n%aI%n%s%n%b%n==END==" --no-merges';

    if (since) {
      // Check if it's a tag or date
      const tagExists = execSync(`git tag -l "${since}"`, { encoding: 'utf-8' }).trim();
      if (tagExists) {
        command += ` ${since}..HEAD`;
      } else {
        command += ` --since="${since}"`;
      }
    }

    const output = execSync(command, { encoding: 'utf-8' });
    return output;
  } catch (error) {
    console.error('Error getting git log:', error.message);
    return '';
  }
}

function parseCommit(commitBlock) {
  const lines = commitBlock.split('\n').filter((line) => line.trim());
  if (lines.length < 5) return null;

  const [hash, author, email, date, subject, ...bodyLines] = lines;
  const body = bodyLines.join('\n').trim();

  // Parse conventional commit format
  const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = subject.match(conventionalRegex);

  if (!match) {
    // Not a conventional commit, categorize as 'chore'
    return {
      hash,
      author,
      email,
      date,
      type: 'chore',
      scope: null,
      breaking: false,
      subject: subject,
      body,
    };
  }

  const [, type, scope, breakingMarker, description] = match;

  // Check for BREAKING CHANGE in body
  const hasBreakingChange =
    breakingMarker === '!' || body.includes('BREAKING CHANGE:') || body.includes('BREAKING-CHANGE:');

  return {
    hash,
    author,
    email,
    date,
    type: type.toLowerCase(),
    scope: scope || null,
    breaking: hasBreakingChange,
    subject: description.trim(),
    body,
  };
}

function extractBreakingChangeDescription(body) {
  const match = body.match(/BREAKING[-\s]CHANGE:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function groupCommitsByVersion(commits) {
  const groups = new Map();
  let currentVersion = getCurrentVersion();
  let currentGroup = [];

  // Simple versioning: group commits between version bumps
  // In real scenario, you'd detect version tags in git
  commits.forEach((commit) => {
    // Check if commit is a version bump
    if (
      commit.subject.match(/bump.*version|release|version.*\d+\.\d+\.\d+/i) ||
      commit.type === 'chore' && commit.subject.includes('version')
    ) {
      if (currentGroup.length > 0) {
        groups.set(currentVersion, currentGroup);
        currentGroup = [];
      }
      // Extract version from commit if possible
      const versionMatch = commit.subject.match(/\d+\.\d+\.\d+/);
      if (versionMatch) {
        currentVersion = versionMatch[0];
      }
    } else {
      currentGroup.push(commit);
    }
  });

  // Add remaining commits to current version
  if (currentGroup.length > 0) {
    groups.set(currentVersion, currentGroup);
  }

  return groups;
}

function categorizeCommits(commits) {
  const categories = {
    breaking: [],
    features: [],
    fixes: [],
    performance: [],
    refactoring: [],
    documentation: [],
    styling: [],
    testing: [],
    build: [],
    ci: [],
    chores: [],
    reverts: [],
    other: [],
  };

  commits.forEach((commit) => {
    if (commit.breaking) {
      categories.breaking.push(commit);
    }

    switch (commit.type) {
      case 'feat':
        categories.features.push(commit);
        break;
      case 'fix':
        categories.fixes.push(commit);
        break;
      case 'perf':
        categories.performance.push(commit);
        break;
      case 'refactor':
        categories.refactoring.push(commit);
        break;
      case 'docs':
        categories.documentation.push(commit);
        break;
      case 'style':
        categories.styling.push(commit);
        break;
      case 'test':
        categories.testing.push(commit);
        break;
      case 'build':
        categories.build.push(commit);
        break;
      case 'ci':
        categories.ci.push(commit);
        break;
      case 'chore':
        categories.chores.push(commit);
        break;
      case 'revert':
        categories.reverts.push(commit);
        break;
      default:
        categories.other.push(commit);
    }
  });

  return categories;
}

function formatCommitLine(commit) {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  const shortHash = commit.hash.substring(0, 7);
  const commitUrl = `${CONFIG.repoUrl}/commit/${commit.hash}`;

  return `- ${scope}${commit.subject} ([${shortHash}](${commitUrl}))`;
}

function generateChangelog(commits, version, date, buildInfo) {
  const categories = categorizeCommits(commits);
  let markdown = '';

  // Version header
  markdown += `## [${version}] - ${date}\n\n`;
  markdown += `**Build:** ${buildInfo.buildCount} | **Date:** ${buildInfo.lastBuildDate}\n\n`;

  // Breaking changes (if any)
  if (categories.breaking.length > 0) {
    markdown += `### ⚠️ BREAKING CHANGES\n\n`;
    categories.breaking.forEach((commit) => {
      const breakingDesc = extractBreakingChangeDescription(commit.body);
      markdown += `- **${commit.subject}**\n`;
      if (breakingDesc) {
        markdown += `  ${breakingDesc}\n`;
      }
      const shortHash = commit.hash.substring(0, 7);
      const commitUrl = `${CONFIG.repoUrl}/commit/${commit.hash}`;
      markdown += `  ([${shortHash}](${commitUrl}))\n`;
    });
    markdown += '\n';
  }

  // Features
  if (categories.features.length > 0) {
    markdown += `### ✨ Features\n\n`;
    categories.features.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Bug Fixes
  if (categories.fixes.length > 0) {
    markdown += `### 🐛 Bug Fixes\n\n`;
    categories.fixes.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Performance
  if (categories.performance.length > 0) {
    markdown += `### ⚡ Performance Improvements\n\n`;
    categories.performance.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Refactoring
  if (categories.refactoring.length > 0) {
    markdown += `### ♻️ Code Refactoring\n\n`;
    categories.refactoring.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Documentation
  if (categories.documentation.length > 0) {
    markdown += `### 📚 Documentation\n\n`;
    categories.documentation.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Tests
  if (categories.testing.length > 0) {
    markdown += `### ✅ Tests\n\n`;
    categories.testing.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Build System
  if (categories.build.length > 0) {
    markdown += `### 📦 Build System\n\n`;
    categories.build.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // CI/CD
  if (categories.ci.length > 0) {
    markdown += `### 🔧 CI/CD\n\n`;
    categories.ci.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Chores
  if (categories.chores.length > 0) {
    markdown += `### 🔨 Chores\n\n`;
    categories.chores.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  // Reverts
  if (categories.reverts.length > 0) {
    markdown += `### ⏪ Reverts\n\n`;
    categories.reverts.forEach((commit) => {
      markdown += formatCommitLine(commit) + '\n';
    });
    markdown += '\n';
  }

  return markdown;
}

function generateHeader() {
  return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Project:** DDX Copilot AI
**Owner:** Walid Boudabbous (Dudoxx UG, Hamburg)
**Repository:** ${CONFIG.repoUrl}

---

`;
}

function parseGitLog(logOutput) {
  const commits = [];
  const commitBlocks = logOutput.split('==END==').filter((block) => block.trim());

  commitBlocks.forEach((block) => {
    const commit = parseCommit(block);
    if (commit) {
      commits.push(commit);
    }
  });

  return commits;
}

function readExistingChangelog() {
  try {
    if (existsSync(CONFIG.changelogFile)) {
      return readFileSync(CONFIG.changelogFile, 'utf-8');
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return null;
}

function mergeChangelog(newContent, existingContent) {
  if (!existingContent) {
    return newContent;
  }

  // Extract existing entries (everything after header)
  const headerMatch = existingContent.match(/^([\s\S]*?---\s*\n+)/);
  const header = headerMatch ? headerMatch[1] : generateHeader();

  const existingEntries = existingContent.substring(header.length);

  // Get current version to avoid duplicates
  const currentVersion = getCurrentVersion();
  const versionRegex = new RegExp(`^## \\[${currentVersion}\\]`, 'm');

  if (versionRegex.test(existingEntries)) {
    // Current version already in changelog, replace it
    const updatedEntries = existingEntries.replace(
      new RegExp(`^## \\[${currentVersion}\\][\\s\\S]*?(?=^## \\[|$)`, 'm'),
      newContent
    );
    return header + updatedEntries;
  } else {
    // Prepend new version
    return header + newContent + existingEntries;
  }
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function generateStats(commits) {
  const stats = {
    total: commits.length,
    authors: new Set(commits.map((c) => c.author)).size,
    types: {},
    scopes: new Set(),
    breaking: commits.filter((c) => c.breaking).length,
  };

  commits.forEach((commit) => {
    stats.types[commit.type] = (stats.types[commit.type] || 0) + 1;
    if (commit.scope) {
      stats.scopes.add(commit.scope);
    }
  });

  return stats;
}

// === MAIN FUNCTION ===

async function main() {
  const flags = parseArgs();

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  console.log('📝 Generating Changelog...\n');

  // Get current version and build info
  const version = getCurrentVersion();
  const buildInfo = getBuildInfo();
  const date = formatDate(buildInfo.lastBuildDate);

  console.log(`Version: ${version}`);
  console.log(`Build: ${buildInfo.buildCount}`);
  console.log(`Date: ${date}`);
  if (flags.since) {
    console.log(`Since: ${flags.since}`);
  }
  console.log('');

  // Get git log
  const logOutput = getGitLog(flags.since);

  if (!logOutput) {
    console.log('⚠️  No git commits found');
    process.exit(1);
  }

  // Parse commits
  const commits = parseGitLog(logOutput);

  if (commits.length === 0) {
    console.log('⚠️  No commits to process');
    process.exit(0);
  }

  console.log(`📊 Commits analyzed: ${commits.length}\n`);

  // Generate stats
  const stats = generateStats(commits);

  console.log('📈 Statistics:');
  console.log(`   Total commits: ${stats.total}`);
  console.log(`   Authors: ${stats.authors}`);
  console.log(`   Breaking changes: ${stats.breaking}`);
  console.log(`   Scopes: ${stats.scopes.size > 0 ? Array.from(stats.scopes).join(', ') : 'none'}`);
  console.log('');
  console.log('   Commit types:');
  Object.entries(stats.types)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      const typeInfo = CONFIG.commitTypes[type] || { emoji: '📄', label: type };
      console.log(`     ${typeInfo.emoji} ${typeInfo.label}: ${count}`);
    });
  console.log('');

  // Generate changelog content
  const header = generateHeader();
  const changelogEntry = generateChangelog(commits, version, date, buildInfo);

  // Read existing changelog
  const existingChangelog = readExistingChangelog();

  // Merge or create new
  const finalChangelog = existingChangelog
    ? mergeChangelog(changelogEntry, existingChangelog)
    : header + changelogEntry;

  // Dry run or write
  if (flags.dryRun) {
    console.log('🔍 DRY RUN - Preview of generated changelog:\n');
    console.log('─'.repeat(80));
    console.log(changelogEntry);
    console.log('─'.repeat(80));
    console.log('\n✅ Dry run complete. Use without --dry-run to write to file.');
  } else {
    writeFileSync(CONFIG.changelogFile, finalChangelog, 'utf-8');
    console.log(`✅ Changelog written to ${CONFIG.changelogFile}`);
    console.log(`   Added ${commits.length} commits to version ${version}`);

    // Show summary of what was added
    console.log('\n📝 Summary of changes:');
    const categories = categorizeCommits(commits);
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        console.log(`   ${categoryName}: ${items.length}`);
      }
    });
  }

  console.log('\n🎉 Changelog generation complete!');
}

// === RUN ===

main().catch((error) => {
  console.error('❌ Error generating changelog:', error.message);
  process.exit(1);
});
