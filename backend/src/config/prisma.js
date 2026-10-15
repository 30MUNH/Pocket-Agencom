const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { resolveTestDatabaseUrl } = require('./testDatabaseGuard');

const isTest = process.env.NODE_ENV === 'test';
const applicationEnvPath = path.resolve(__dirname, '../../.env');
const applicationEnv = fs.existsSync(applicationEnvPath)
  ? dotenv.parse(fs.readFileSync(applicationEnvPath))
  : {};
const testDatabaseUrl = isTest
  ? resolveTestDatabaseUrl(process.env, applicationEnv)
  : null;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(
  {
    ...(isTest ? { datasources: { db: { url: testDatabaseUrl } } } : {}),
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  },
);

module.exports = prisma;
