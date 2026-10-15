const test = require('node:test');
const assert = require('node:assert/strict');

test('Prisma uses bounded interactive transaction defaults for the Supabase pooler', () => {
  const prismaPath = require.resolve('../src/config/prisma');
  const clientPath = require.resolve('@prisma/client');
  const previousPrismaModule = require.cache[prismaPath];
  const previousClientModule = require.cache[clientPath];
  const previousNodeEnv = process.env.NODE_ENV;
  let constructorOptions;

  process.env.NODE_ENV = 'development';
  require.cache[clientPath] = {
    id: clientPath,
    filename: clientPath,
    loaded: true,
    exports: { PrismaClient: class { constructor(options) { constructorOptions = options; } } },
  };
  delete require.cache[prismaPath];

  try {
    require('../src/config/prisma');
    assert.equal(constructorOptions?.transactionOptions?.maxWait, 10_000);
    assert.equal(constructorOptions?.transactionOptions?.timeout, 15_000);
  } finally {
    if (previousPrismaModule) require.cache[prismaPath] = previousPrismaModule;
    else delete require.cache[prismaPath];
    if (previousClientModule) require.cache[clientPath] = previousClientModule;
    else delete require.cache[clientPath];
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
