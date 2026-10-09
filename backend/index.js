require('dotenv').config();

const prisma = require('./src/config/prisma');
const setupStorage = require('./src/utils/setupStorage');
const { createApp } = require('./src/app');

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);

  // Database connection check
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    const version = result[0]?.version || 'Unknown';
    console.log(`✅ Database connected successfully!`);
    console.log(`   PostgreSQL: ${version}`);

    // Set up Supabase Storage bucket and RLS policies via SQL
    await setupStorage();

    // Quick table count to confirm data is accessible
    const userCount = await prisma.user.count();
    const planCount = await prisma.marketingPlan.count();
    console.log(`📊 Data summary:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Marketing Plans: ${planCount}`);
    console.log('');
  } catch (err) {
    console.error(`❌ Database connection FAILED!`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Hint: Check DATABASE_URL in .env file\n`);
  }
});
