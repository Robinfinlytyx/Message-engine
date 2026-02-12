require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Loaded (hidden for security)' : '❌ NOT FOUND');
console.log('REDIS_HOST:', process.env.REDIS_HOST || '❌ NOT FOUND');
console.log('REDIS_PORT:', process.env.REDIS_PORT || '❌ NOT FOUND');
console.log('TELINFY_API_KEY:', process.env.TELINFY_API_KEY ? '✅ Loaded (hidden for security)' : '❌ NOT FOUND');
console.log('PORT:', process.env.PORT || '❌ NOT FOUND (will default to 3000)');

if (!process.env.DATABASE_URL) {
    console.log('\n⚠️  DATABASE_URL is not loaded!');
    console.log('Make sure .env file exists in the project root');
    console.log('Current directory:', __dirname);
}
