// Helper script to generate secrets for environment variables
const crypto = require('crypto');

console.log('\n=== Secret Generation Helper ===\n');

// Generate NextAuth Secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET=');
console.log(nextAuthSecret);
console.log('\n--- Copy the above line to your .env file ---\n');

// Generate example .env content
console.log('Example .env file content:');
console.log('---');
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('NEXTAUTH_URL=http://localhost:3000');
console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
console.log('');
console.log('# Add your Stripe keys from https://dashboard.stripe.com/apikeys');
console.log('STRIPE_SECRET_KEY=sk_test_...');
console.log('STRIPE_WEBHOOK_SECRET=whsec_...');
console.log('STRIPE_PRICE_ID_MONTHLY=price_...');
console.log('STRIPE_PRICE_ID_ANNUAL=price_...');
console.log('');
console.log('# Optional (can add later)');
console.log('BLOB_READ_WRITE_TOKEN=');
console.log('# DATABASE_URL=');
console.log('# EMAIL_API_KEY=');
console.log('---\n');
