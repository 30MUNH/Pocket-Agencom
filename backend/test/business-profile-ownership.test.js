const test = require('node:test');
const assert = require('node:assert/strict');

test('business context rejects a foreign profile before any caller side effect', async () => {
  const { requireOwnedBusinessProfile } = require('../src/services/businessProfileAccess');
  let reads = 0;
  const prismaClient = {
    businessProfile: {
      async findFirst({ where }) {
        reads += 1;
        assert.deepEqual(where, { id: 22, userId: 4 });
        return null;
      },
    },
  };
  await assert.rejects(requireOwnedBusinessProfile(4, 22, prismaClient), { statusCode: 404 });
  assert.equal(reads, 1);
});

test('business context accepts the same user and rejects malformed identifiers', async () => {
  const { requireOwnedBusinessProfile } = require('../src/services/businessProfileAccess');
  const profile = { id: 22, userId: 4, brandVoice: 'Warm' };
  const prismaClient = { businessProfile: { async findFirst({ where }) {
    assert.deepEqual(where, { id: 22, userId: 4 });
    return profile;
  } } };
  assert.equal(await requireOwnedBusinessProfile(4, '22', prismaClient), profile);
  await assert.rejects(requireOwnedBusinessProfile(4, '22oops', prismaClient), { statusCode: 400 });
});
