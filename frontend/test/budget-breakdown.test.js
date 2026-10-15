import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBudgetChannels } from '../src/utils/budgetBreakdown.js';

test('rich and older budget channels render with finite percentages and line items', () => {
  const channels = normalizeBudgetChannels([
    { channelName: 'Facebook', percentOfTotal: 60, items: [{ name: 'Ads', percent: 100 }] },
    { channel: 'TikTok', percentage: 40, estimatedVnd: 2000000 },
  ]);
  assert.deepEqual(channels.map((channel) => channel.channelName), ['Facebook', 'TikTok']);
  assert.deepEqual(channels.map((channel) => channel.percentOfTotal), [60, 40]);
  assert.equal(channels[1].items[0].percent, 100);
});

test('invalid saved budget entries cannot produce NaN in the budget card', () => {
  assert.deepEqual(normalizeBudgetChannels([{ channelName: 'Broken', percentOfTotal: '60' }, null]), []);
});
