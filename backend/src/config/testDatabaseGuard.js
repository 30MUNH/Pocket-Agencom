function resolveTestDatabaseUrl(env = process.env, applicationEnv = {}) {
  const testUrl = env.PA_TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('Database access in tests is blocked: PA_TEST_DATABASE_URL is required.');
  }

  const applicationUrls = [env.DATABASE_URL, env.DIRECT_URL, applicationEnv.DATABASE_URL, applicationEnv.DIRECT_URL];
  if (applicationUrls.includes(testUrl)) {
    throw new Error('PA_TEST_DATABASE_URL must not match the application database.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(testUrl);
  } catch {
    throw new Error('PA_TEST_DATABASE_URL must be a PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error('PA_TEST_DATABASE_URL must be a PostgreSQL URL.');
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
  if (!/(?:^|[_-])(test|tests|testing|disposable|ci)(?:[_-]|$)/i.test(databaseName)) {
    throw new Error('PA_TEST_DATABASE_URL database name must identify an isolated test database.');
  }

  return testUrl;
}

module.exports = { resolveTestDatabaseUrl };
