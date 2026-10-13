function parsePostgresTarget(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Configured database URL must be a PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('Configured database URL must be a PostgreSQL URL.');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  const schema = parsed.searchParams.get('schema') || 'public';
  if (!parsed.hostname || !database) {
    throw new Error('Configured database URL must include a host and database name.');
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error('Configured database schema name is invalid.');
  }

  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database,
    schema,
  };
}

function resolveRealDbE2eTarget({ optedIn, env = process.env, appEnv = {} } = {}) {
  if (optedIn !== true) {
    throw new Error('Real database tests are disabled. Set PA_REAL_DB_E2E=true explicitly.');
  }

  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    if (env[key] && appEnv[key] && env[key] !== appEnv[key]) {
      throw new Error(`${key} must match backend .env for real database tests.`);
    }
  }

  const configuredUrl = appEnv.DIRECT_URL || appEnv.DATABASE_URL;
  if (!configuredUrl) {
    throw new Error('backend .env must configure DATABASE_URL or DIRECT_URL.');
  }

  return parsePostgresTarget(configuredUrl);
}

module.exports = { resolveRealDbE2eTarget };
