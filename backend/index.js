const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = require('./src/config/prisma');
const setupStorage = require('./src/utils/setupStorage');
const { createApp } = require('./src/app');
const { isDatabaseUnavailable } = require('./src/utils/databaseError');

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
    if (isDatabaseUnavailable(err)) {
      console.error('   PostgreSQL is unreachable; API is listening but database requests cannot succeed.');
      console.error('   Run npm run check:db in backend, then verify Supabase Connect and network restrictions.\n');
    } else {
      console.error(`   Error: ${err.message}`);
      console.error(`   Hint: Check DATABASE_URL in backend/.env\n`);
    }
  }
});
