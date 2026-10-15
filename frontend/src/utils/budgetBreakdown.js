export function normalizeBudgetChannels(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((channel) => {
    if (!channel || typeof channel !== 'object') return [];
    const channelName = channel.channelName ?? channel.channel;
    const percentOfTotal = channel.percentOfTotal ?? channel.percentage;
    if (typeof channelName !== 'string' || !channelName.trim()
      || typeof percentOfTotal !== 'number' || !Number.isFinite(percentOfTotal)
      || percentOfTotal < 0 || percentOfTotal > 100) return [];
    const items = Array.isArray(channel.items)
      ? channel.items.filter((item) => typeof item?.name === 'string' && item.name.trim()
        && typeof item.percent === 'number' && Number.isFinite(item.percent)
        && item.percent >= 0 && item.percent <= 100)
      : [];
    return [{ ...channel, channelName, percentOfTotal,
      items: items.length ? items : [{ name: 'Ngân sách kênh', percent: 100 }] }];
  });
}
