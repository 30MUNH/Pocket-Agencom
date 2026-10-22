const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
const { PrismaClient } = require('@prisma/client');

// Application Prisma stays blocked; all actual connections below target a new loopback DB.
process.env.NODE_ENV = 'test';
process.env.PA_TEST_DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:1/payments_test';
const { createPaymentRouter } = require('../../src/routes/paymentRoutes');
const { createPaymentService } = require('../../src/services/paymentService');
const { createAuthMiddleware } = require('../../src/middleware/authMiddleware');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { signToken } = require('../../src/utils/jwt');

const migration = fs.readFileSync(path.join(__dirname, '../../prisma/migrations/20261022010000_sepay_va_payments/migration.sql'), 'utf8');
const completionMigration = fs.readFileSync(path.join(__dirname, '../../prisma/migrations/20261022020000_payment_checkout_completion/migration.sql'), 'utf8');
const config = {
  bank: 'MBBank', accountNumber: '0911266029', accountName: 'LE HUU DUC DUY',
  virtualAccount: 'VQRQAMZKV7190', authMode: 'apikey', secret: 'isolated-test-secret-32-characters-long',
};

async function createPaymentTestHarness() {
  const database = await PGlite.create();
  await database.exec(`
    CREATE TYPE "UserRole" AS ENUM ('user', 'staff', 'admin');
    CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive', 'banned', 'archived');
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password_hash TEXT,
      phone TEXT, avatar_url TEXT, avatar_media_asset_id INTEGER, role "UserRole", status "AccountStatus",
      created_at TIMESTAMP(3) DEFAULT NOW(), updated_at TIMESTAMP(3) DEFAULT NOW());
    INSERT INTO users (id, name, email, role, status) VALUES
      (100, 'Payment test', 'payment@example.test', 'user', 'active'),
      (101, 'Other user', 'other@example.test', 'user', 'active'),
      (102, 'Staff', 'staff@example.test', 'staff', 'active');
  `);
  await database.exec(migration);
  await database.exec(completionMigration);
  const socket = new PGLiteSocketServer({ db: database, host: '127.0.0.1', port: 0 });
  await socket.start();
  const db = new PrismaClient({ datasources: { db: {
    url: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres?connection_limit=1&sslmode=disable`,
  } } });
  let now = new Date('2025-10-22T07:00:00.000Z');
  const service = createPaymentService(db, () => config, () => new Date(now));
  const app = express();
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); } }));
  app.use('/api/payments', createPaymentRouter({ service, authenticate: createAuthMiddleware(db), configProvider: () => config }));
  app.use(errorHandler);
  return {
    app, db, database, service, config, migration: migration + '\n' + completionMigration,
    token: (userId = 100, extra = {}) => signToken({ userId, role: userId === 102 ? 'staff' : 'user', ...extra }),
    setNow: (value) => { now = new Date(value); },
    reset: async () => {
      now = new Date('2025-10-22T07:00:00.000Z');
      config.authMode = 'apikey';
      await db.$executeRawUnsafe('TRUNCATE subscription_usage, sepay_webhook_events, user_subscriptions, payment_orders');
    },
    close: async () => { await db.$disconnect(); await socket.stop(); await database.close(); },
  };
}

module.exports = { createPaymentTestHarness };
