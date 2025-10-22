#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// VERSION MANAGER
// =============================================================================

class VersionManager {
  constructor() {
    this.packagePath = path.join(process.cwd(), 'package.json');
    this.versionFilePath = path.join(process.cwd(), '.version');
  }

  // Read current package.json
  readPackage() {
    if (!fs.existsSync(this.packagePath)) {
      throw new Error('package.json not found');
    }
    return JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
  }

  // Write package.json
  writePackage(packageData) {
    fs.writeFileSync(this.packagePath, JSON.stringify(packageData, null, 2) + '\n');
  }

  // Read version metadata
  readVersionMetadata() {
    if (!fs.existsSync(this.versionFilePath)) {
      return {
        buildCount: 0,
        lastBuildDate: null,
        commitCount: 0
      };
    }
    return JSON.parse(fs.readFileSync(this.versionFilePath, 'utf8'));
  }

  // Write version metadata
  writeVersionMetadata(metadata) {
    fs.writeFileSync(this.versionFilePath, JSON.stringify(metadata, null, 2) + '\n');
  }

  // Parse semantic version
  parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }
    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      prerelease: match[4] || null
    };
  }

  // Format semantic version
  formatVersion({ major, minor, patch, prerelease }) {
    let version = `${major}.${minor}.${patch}`;
    if (prerelease) {
      version += `-${prerelease}`;
    }
    return version;
  }

  // Increment version
  incrementVersion(type = 'patch') {
    const packageData = this.readPackage();
    const currentVersion = this.parseVersion(packageData.version);
    const metadata = this.readVersionMetadata();

    // Increment version based on type
    switch (type) {
      case 'major':
        currentVersion.major++;
        currentVersion.minor = 0;
        currentVersion.patch = 0;
        break;
      case 'minor':
        currentVersion.minor++;
        currentVersion.patch = 0;
        break;
      case 'patch':
        currentVersion.patch++;
        break;
      default:
        throw new Error(`Invalid version type: ${type}. Use major, minor, or patch.`);
    }

    // Update metadata
    metadata.buildCount++;
    metadata.lastBuildDate = new Date().toISOString();
    metadata.commitCount++;

    // Update package.json
    packageData.version = this.formatVersion(currentVersion);
    
    // Add build metadata if it doesn't exist
    if (!packageData.build) {
      packageData.build = {};
    }
    
    packageData.build.count = metadata.buildCount;
    packageData.build.date = metadata.lastBuildDate;
    packageData.build.commit = this.getCommitHash();

    // Write files
    this.writePackage(packageData);
    this.writeVersionMetadata(metadata);

    return {
      oldVersion: this.formatVersion(this.parseVersion(this.readPackage().version)),
      newVersion: packageData.version,
      buildCount: metadata.buildCount
    };
  }

  // Get current git commit hash
  getCommitHash() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 7);
    } catch (error) {
      return 'unknown';
    }
  }

  // Get git branch name
  getBranchName() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  // Check if there are uncommitted changes
  hasUncommittedChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  // Auto-increment based on commit message or changes
  autoIncrement() {
    const commitMessage = this.getLastCommitMessage();
    
    // Determine version increment type based on commit message
    let incrementType = 'patch'; // default
    
    if (commitMessage.includes('BREAKING CHANGE') || commitMessage.includes('major:')) {
      incrementType = 'major';
    } else if (commitMessage.includes('feat:') || commitMessage.includes('feature:') || 
               commitMessage.includes('minor:')) {
      incrementType = 'minor';
    } else if (commitMessage.includes('fix:') || commitMessage.includes('patch:') ||
               commitMessage.includes('chore:') || commitMessage.includes('docs:')) {
      incrementType = 'patch';
    }

    return this.incrementVersion(incrementType);
  }

  // Get last commit message
  getLastCommitMessage() {
    try {
      return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    } catch (error) {
      return '';
    }
  }

  // Display current version info
  displayVersion() {
    const packageData = this.readPackage();
    const metadata = this.readVersionMetadata();
    const branch = this.getBranchName();
    const commit = this.getCommitHash();

    console.log('📦 DDX Copilot AI Version Information:');
    console.log(`   Version: ${packageData.version}`);
    console.log(`   Build Count: ${metadata.buildCount}`);
    console.log(`   Last Build: ${metadata.lastBuildDate || 'Never'}`);
    console.log(`   Git Branch: ${branch}`);
    console.log(`   Git Commit: ${commit}`);
    
    if (this.hasUncommittedChanges()) {
      console.log('   Status: 🟡 Uncommitted changes detected');
    } else {
      console.log('   Status: ✅ Clean working directory');
    }
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const versionManager = new VersionManager();

  try {
    switch (command) {
      case 'increment':
      case 'inc':
        const type = args[1] || 'patch';
        const result = versionManager.incrementVersion(type);
        console.log(`✅ Version updated: ${result.oldVersion} → ${result.newVersion}`);
        console.log(`   Build count: ${result.buildCount}`);
        break;

      case 'auto':
        const autoResult = versionManager.autoIncrement();
        console.log(`✅ Version auto-updated: ${autoResult.oldVersion} → ${autoResult.newVersion}`);
        console.log(`   Build count: ${autoResult.buildCount}`);
        break;

      case 'show':
      case 'info':
        versionManager.displayVersion();
        break;

      case 'build-increment':
        const buildResult = versionManager.incrementVersion('patch');
        console.log(`🔨 Build version: ${buildResult.newVersion} (build ${buildResult.buildCount})`);
        break;

      default:
        console.log(`
📦 DDX Copilot AI Version Manager

Usage:
  node scripts/version-manager.js <command> [options]

Commands:
  increment <type>    Increment version (major, minor, patch)
  auto               Auto-increment based on commit message
  build-increment    Increment patch version for builds
  show               Display current version information

Examples:
  node scripts/version-manager.js increment minor
  node scripts/version-manager.js auto
  node scripts/version-manager.js show
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default VersionManager;
