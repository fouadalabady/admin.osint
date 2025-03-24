#!/usr/bin/env node

/**
 * Script to find and help fix common TypeScript and ESLint errors
 * Run with: node scripts/fix-common-errors.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing project for common errors...\n');

// Get TypeScript errors
console.log('📝 Running TypeScript check...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ No TypeScript errors found!');
} catch (error) {
  const tsErrors = error.stdout.toString();
  console.log('\n❌ TypeScript errors found:');
  
  // Extract and analyze common patterns
  const anyTypeUsage = (tsErrors.match(/Type 'any'/g) || []).length;
  const implicitAny = (tsErrors.match(/implicitly has an 'any' type/g) || []).length;
  const missingTypes = (tsErrors.match(/is missing the following properties/g) || []).length;
  const promiseErrors = (tsErrors.match(/Promise</g) || []).length;
  
  console.log(`   - 'any' type usage: ${anyTypeUsage}`);
  console.log(`   - Implicit 'any' types: ${implicitAny}`);
  console.log(`   - Missing type properties: ${missingTypes}`);
  console.log(`   - Promise-related errors: ${promiseErrors}\n`);
  
  console.log('💡 Recommendations:');
  if (anyTypeUsage > 0 || implicitAny > 0) {
    console.log('   - Replace \'any\' types with proper interface definitions');
    console.log('   - Use type assertion (as Type) when needed');
  }
  if (missingTypes > 0) {
    console.log('   - Create complete interface definitions for your objects');
  }
  if (promiseErrors > 0) {
    console.log('   - Properly type async functions and their return values');
    console.log('   - Use correct Promise typing with generics: Promise<YourType>');
  }
}

// Get ESLint errors
console.log('\n📝 Running ESLint check...');
try {
  const eslintOutput = execSync('npx eslint --ext .ts,.tsx,.js,.jsx .', { stdio: 'pipe' }).toString();
  console.log('✅ No ESLint errors found!');
} catch (error) {
  const eslintErrors = error.stdout.toString();
  console.log('\n❌ ESLint errors found:');
  
  // Extract and analyze common patterns
  const unusedVars = (eslintErrors.match(/'.*' is defined but never used/g) || []).length;
  const consoleStatements = (eslintErrors.match(/Unexpected console statement/g) || []).length;
  const missingReturns = (eslintErrors.match(/missing return type/g) || []).length;
  
  console.log(`   - Unused variables: ${unusedVars}`);
  console.log(`   - Console statements: ${consoleStatements}`);
  console.log(`   - Missing return types: ${missingReturns}\n`);
  
  console.log('💡 Recommendations:');
  if (unusedVars > 0) {
    console.log('   - Remove unused variables or prefix with underscore (_unusedVar)');
  }
  if (consoleStatements > 0) {
    console.log('   - Replace console.log with proper logging mechanism');
    console.log('   - Remove debugging console statements before committing');
  }
  if (missingReturns > 0) {
    console.log('   - Add explicit return types to functions: function example(): ReturnType');
  }
}

// Try to automatically fix what we can
console.log('\n🔧 Attempting to fix some issues automatically...');
try {
  execSync('npm run fix-code-quality', { stdio: 'inherit' });
  console.log('✅ Automatic fixes applied! Re-run this script to check remaining issues.');
} catch (error) {
  console.log('❌ Error during automatic fixes:', error.message);
}

console.log('\n📊 Next steps:');
console.log('1. Fix the remaining errors manually');
console.log('2. Run tests to ensure functionality is intact');
console.log('3. Commit your changes with descriptive messages\n'); 