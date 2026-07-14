const express = require('express');
const cors = require('cors');
require('dotenv').config();

const prisma = require('./src/config/prisma');
const apiRoutes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { success } = require('./src/utils/response');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
      : [];
    
    // Allow requests with no origin (like mobile apps or curl) or if FRONTEND_URL is not set
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
  success(res, { status: 'UP', message: 'Pocket Agencom API is healthy!' });
});

app.get('/', (req, res) => {
  success(res, { message: 'Welcome to the Pocket Agencom API!' });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: 'Route not found' },
  });
});

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);

  // Database connection check
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    const version = result[0]?.version || 'Unknown';
    console.log(`✅ Database connected successfully!`);
    console.log(`   PostgreSQL: ${version}`);

    // Quick table count to confirm data is accessible
    const kolCount = await prisma.kolProfile.count();
    const userCount = await prisma.user.count();
    const bookingCount = await prisma.kolBooking.count();
    const planCount = await prisma.marketingPlan.count();
    console.log(`📊 Data summary:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - KOL Profiles: ${kolCount}`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`   - Marketing Plans: ${planCount}`);
    console.log('');
  } catch (err) {
    console.error(`❌ Database connection FAILED!`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Hint: Check DATABASE_URL in .env file\n`);
  }
});
