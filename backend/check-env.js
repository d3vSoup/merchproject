#!/usr/bin/env node
// Quick script to check if Supabase key is configured
require('dotenv').config();

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const url = process.env.SUPABASE_URL || '';

console.log('\n📋 Environment Check:\n');
console.log('SUPABASE_URL:', url || '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:');
if (!key) {
  console.log('  ❌ MISSING');
} else if (key === 'your_service_role_key') {
  console.log('  ❌ PLACEHOLDER (needs real key)');
} else {
  console.log('  ✅ Set');
  console.log('  Length:', key.length, 'characters');
  console.log('  Preview:', key.substring(0, 30) + '...');
  if (key.length < 50) {
    console.log('  ⚠️  WARNING: Key seems too short (should be 200+ chars)');
  } else if (!key.startsWith('eyJ')) {
    console.log('  ⚠️  WARNING: Key does not look like a JWT (should start with "eyJ")');
  } else {
    console.log('  ✅ Key format looks correct!');
  }
}

console.log('\n');

