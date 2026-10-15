export function toggleNotificationPreference(current, key) {
  return { ...current, [key]: !current[key] };
}
