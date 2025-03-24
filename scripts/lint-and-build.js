#!/usr/bin/env node

/**
 * Script to run a complete lint and build process with clear error reporting
 * Run with: node scripts/lint-and-build.js
 */

const { execSync } = require('child_process');
const chalk = require('chalk') || { green: text => text, red: text => text, yellow: text => text, blue: text => text, bold: text => text };

// Function to run a command and return its output
function runCommand(command, options = {}) {
  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stdout?.toString() || error.message };
  }
}

console.log(chalk.blue.bold('🚀 Starting Lint and Build Process\n'));

// Step 1: Format code
console.log(chalk.blue('📝 Step 1: Formatting code with Prettier...'));
const formatResult = runCommand('npm run format');
if (formatResult.success) {
  console.log(chalk.green('✅ Code formatting successful!'));
} else {
  console.log(chalk.red('❌ Code formatting failed:'));
  console.log(formatResult.output);
  process.exit(1);
}

// Step 2: Fix linting issues
console.log(chalk.blue('\n📝 Step 2: Fixing linting issues with ESLint...'));
const lintResult = runCommand('npm run lint:fix');
if (lintResult.success) {
  console.log(chalk.green('✅ Linting successful!'));
} else {
  console.log(chalk.yellow('⚠️ Linting found issues that need to be addressed:'));
  console.log(lintResult.output);
  
  // Continue to next step but note that there are still issues
  console.log(chalk.yellow('\n⚠️ Some linting issues remain. Fix them manually before committing.'));
}

// Step 3: Check TypeScript
console.log(chalk.blue('\n📝 Step 3: Checking TypeScript types...'));
const typeCheckResult = runCommand('npm run typecheck');
if (typeCheckResult.success) {
  console.log(chalk.green('✅ TypeScript check successful!'));
} else {
  console.log(chalk.red('❌ TypeScript check failed:'));
  console.log(typeCheckResult.output);
  
  console.log(chalk.yellow('\n⚠️ Fix TypeScript errors before continuing. Use `npm run find-errors` for guidance.'));
  const shouldContinue = process.argv.includes('--force');
  if (!shouldContinue) {
    console.log(chalk.red('❌ Build process halted due to TypeScript errors.'));
    console.log(chalk.yellow('   Run with --force to continue anyway: node scripts/lint-and-build.js --force'));
    process.exit(1);
  }
  console.log(chalk.yellow('\n⚠️ Continuing with build despite TypeScript errors (--force flag used)'));
}

// Step 4: Build the application
console.log(chalk.blue('\n📝 Step 4: Building the application...'));
const buildResult = runCommand('NODE_ENV=production next build', { stdio: 'inherit' });
if (buildResult.success) {
  console.log(chalk.green('✅ Build successful!'));
} else {
  console.log(chalk.red('❌ Build failed:'));
  console.log(buildResult.output);
  process.exit(1);
}

console.log(chalk.green.bold('\n🎉 Lint and Build Process Completed Successfully!'));
console.log(chalk.blue('   The application is now ready for deployment.')); 