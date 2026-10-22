const path = require('node:path');
const net = require('node:net');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { isDatabaseUnavailable } = require('../src/utils/databaseError');

function checkTcp(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result) => { socket.destroy(); resolve(result); };
    socket.setTimeout(5000);
    socket.once('connect', () => finish({ reachable: true }));
    socket.once('timeout', () => finish({ reachable: false, reason: 'TCP timeout' }));
    socket.once('error', (error) => finish({ reachable: false, reason: error.code }));
  });
}

async function check(key) {
  let url;
  try {
    url = new URL(process.env[key]);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid protocol');
  } catch {
    console.error(`${key}: missing or invalid PostgreSQL URL.`);
    return false;
  }
  const port = Number(url.port || 5432);
  console.log(`${key}: ${url.hostname}:${port}`);
  const tcp = await checkTcp(url.hostname, port);
  if (!tcp.reachable) {
    console.error(`  Not reachable: ${tcp.reason}. No database credentials were sent.`);
    return false;
  }
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('  Connected successfully (read-only SELECT 1).');
    return true;
  } catch (error) {
    // Never print the full Prisma error, URL, password or key in diagnostics.
    const code = error.code || error.errorCode || error.name;
    console.error(`  ${isDatabaseUnavailable(error) ? 'Database connection unavailable' : 'Database connection failed'} (${code}).`);
    return false;
  } finally {
    await db.$disconnect();
  }
}

async function main() {
  const results = await Promise.all(['DATABASE_URL', 'DIRECT_URL'].map(check));
  if (results.some((ok) => !ok)) {
    console.error('Verify the host/port in Supabase > Connect. Check Network Restrictions/IP bans and whether your network allows PostgreSQL ports.');
    console.error('HTTPS Auth/Storage responding does not prove PostgreSQL is reachable.');
    process.exitCode = 1;
  }
}

main().catch(() => { console.error('Database diagnostic failed.'); process.exitCode = 1; });
