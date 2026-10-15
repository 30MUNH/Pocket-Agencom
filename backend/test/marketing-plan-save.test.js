const test = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('./helpers/installPrismaFixture');
const marketingPlanService = require('../src/services/marketingPlanService');

test('savePlan allows Supabase pooler latency within its interactive transaction', async () => {
  const original = {
    transaction: prisma.$transaction,
    findUnique: prisma.marketingPlan.findUnique,
    update: prisma.marketingPlan.update,
    notification: prisma.notification,
    userFindMany: prisma.user.findMany,
  };
  let transactionOptions;
  prisma.marketingPlan.findUnique = async () => ({ id: 77, userId: 501, goal: 'Diagnostic plan', status: 'draft' });
  prisma.marketingPlan.update = async () => ({
    id: 77,
    userId: 501,
    goal: 'Diagnostic plan',
    status: 'saved',
    businessProfile: null,
    user: { id: 501, name: 'Fixture user', email: 'fixture@example.test' },
  });
  prisma.notification = { create: async () => ({ id: 1 }) };
  prisma.user.findMany = async () => [];
  prisma.$transaction = async (callback, options) => {
    transactionOptions = options;
    return callback(prisma);
  };

  try {
    await marketingPlanService.savePlan(77, 501);
    assert.ok(transactionOptions?.timeout >= 15_000, 'save transaction timeout should exceed the five-second Prisma default');
    assert.ok(transactionOptions?.maxWait >= 5_000, 'save transaction should allow time to acquire a pooler connection');
  } finally {
    prisma.$transaction = original.transaction;
    prisma.marketingPlan.findUnique = original.findUnique;
    prisma.marketingPlan.update = original.update;
    prisma.notification = original.notification;
    prisma.user.findMany = original.userFindMany;
  }
});
