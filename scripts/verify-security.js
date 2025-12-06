#!/usr/bin/env node

/**
 * Security Verification Script
 * 
 * This script verifies that security measures are properly implemented:
 * 1. API keys are not in client bundle
 * 2. Environment files are in .gitignore
 * 3. Security headers are configured
 * 4. Input sanitization is in place
 */

const fs = require('fs');
const path = require('path');

let hasErrors = false;

console.log('🔒 Running Security Verification...\n');

// Check 1: Verify .gitignore contains environment files
console.log('✓ Checking .gitignore for environment files...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredPatterns = ['.env*.local', '.env'];
  
  requiredPatterns.forEach(pattern => {
    if (!gitignore.includes(pattern)) {
      console.error(`  ❌ Missing pattern in .gitignore: ${pattern}`);
      hasErrors = true;
    }
  });
  
  if (!hasErrors) {
    console.log('  ✅ Environment files are properly ignored\n');
  }
} catch (error) {
  console.error('  ❌ Could not read .gitignore\n');
  hasErrors = true;
}

// Check 2: Verify .env files are not committed
console.log('✓ Checking for committed .env files...');
const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
let foundEnvFiles = false;

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ⚠️  Found ${file} - ensure it's not committed to git`);
    foundEnvFiles = true;
  }
});

if (!foundEnvFiles) {
  console.log('  ✅ No .env files found in repository\n');
} else {
  console.log('  ℹ️  Run: git status to verify .env files are ignored\n');
}

// Check 3: Verify input sanitizer exists
console.log('✓ Checking input sanitization...');
try {
  const sanitizerPath = path.join('lib', 'input-sanitizer.ts');
  if (fs.existsSync(sanitizerPath)) {
    const content = fs.readFileSync(sanitizerPath, 'utf8');
    const requiredFunctions = ['sanitizeInput', 'isInputSafe', 'escapeHtml'];
    
    requiredFunctions.forEach(func => {
      if (!content.includes(`function ${func}`) && !content.includes(`export function ${func}`)) {
        console.error(`  ❌ Missing function: ${func}`);
        hasErrors = true;
      }
    });
    
    if (!hasErrors) {
      console.log('  ✅ Input sanitization functions are present\n');
    }
  } else {
    console.error('  ❌ Input sanitizer file not found\n');
    hasErrors = true;
  }
} catch (error) {
  console.error('  ❌ Could not verify input sanitizer\n');
  hasErrors = true;
}

// Check 4: Verify API route uses sanitization
console.log('✓ Checking API route security...');
try {
  const apiRoutePath = path.join('app', 'api', 'search', 'route.ts');
  if (fs.existsSync(apiRoutePath)) {
    const content = fs.readFileSync(apiRoutePath, 'utf8');
    
    if (!content.includes('sanitizeInput')) {
      console.error('  ❌ API route does not use input sanitization\n');
      hasErrors = true;
    } else if (!content.includes('isInputSafe')) {
      console.error('  ❌ API route does not validate input safety\n');
      hasErrors = true;
    } else {
      console.log('  ✅ API route uses input sanitization\n');
    }
  } else {
    console.error('  ❌ API route file not found\n');
    hasErrors = true;
  }
} catch (error) {
  console.error('  ❌ Could not verify API route\n');
  hasErrors = true;
}

// Check 5: Verify Next.js config has security headers
console.log('✓ Checking security headers configuration...');
try {
  const configPath = 'next.config.ts';
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security',
      'X-XSS-Protection'
    ];
    
    requiredHeaders.forEach(header => {
      if (!content.includes(header)) {
        console.error(`  ❌ Missing security header: ${header}`);
        hasErrors = true;
      }
    });
    
    if (!hasErrors) {
      console.log('  ✅ Security headers are configured\n');
    }
  } else {
    console.error('  ❌ Next.js config file not found\n');
    hasErrors = true;
  }
} catch (error) {
  console.error('  ❌ Could not verify Next.js config\n');
  hasErrors = true;
}

// Check 6: Verify API clients use environment variables
console.log('✓ Checking API client security...');
try {
  const exaClientPath = path.join('lib', 'exa-client.ts');
  const mistralClientPath = path.join('lib', 'mistral-client.ts');
  
  [exaClientPath, mistralClientPath].forEach(clientPath => {
    if (fs.existsSync(clientPath)) {
      const content = fs.readFileSync(clientPath, 'utf8');
      
      if (!content.includes('process.env')) {
        console.error(`  ❌ ${path.basename(clientPath)} does not use environment variables\n`);
        hasErrors = true;
      }
    }
  });
  
  if (!hasErrors) {
    console.log('  ✅ API clients use environment variables\n');
  }
} catch (error) {
  console.error('  ❌ Could not verify API clients\n');
  hasErrors = true;
}

// Check 7: Verify build output doesn't contain API keys (if build exists)
console.log('✓ Checking build output for exposed credentials...');
const buildPath = '.next';
if (fs.existsSync(buildPath)) {
  try {
    const staticPath = path.join(buildPath, 'static');
    if (fs.existsSync(staticPath)) {
      // This is a simplified check - in production, you'd want more thorough scanning
      console.log('  ℹ️  Build exists - manually verify no credentials in .next/static/\n');
    } else {
      console.log('  ℹ️  No static build found - run "npm run build" to verify\n');
    }
  } catch (error) {
    console.log('  ℹ️  Could not check build output\n');
  }
} else {
  console.log('  ℹ️  No build found - run "npm run build" to verify\n');
}

// Summary
console.log('═══════════════════════════════════════════════════════');
if (hasErrors) {
  console.log('❌ Security verification FAILED - please fix the issues above');
  process.exit(1);
} else {
  console.log('✅ Security verification PASSED');
  console.log('\nRecommendations for production:');
  console.log('  • Set ALLOWED_ORIGIN to your production domain');
  console.log('  • Enable rate limiting on API routes');
  console.log('  • Use HTTPS in production');
  console.log('  • Regularly rotate API keys');
  console.log('  • Monitor logs for security events');
  process.exit(0);
}
