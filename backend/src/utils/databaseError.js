// Prisma initialization errors sometimes omit errorCode, including failed pooler connections.
function isDatabaseUnavailable(error) {
  if (['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(error?.code || error?.errorCode)) {
    return true;
  }
  return error?.name === 'PrismaClientInitializationError' &&
    /can't reach database server|connection (?:timed out|timeout|refused)/i.test(error.message || '');
}

module.exports = { isDatabaseUnavailable };
