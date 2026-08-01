export const cardShadow = {
  shadowColor: '#2C1810',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export const POSITION_LABELS: Record<string, string> = {
  pitcher: 'Pitcher',
  catcher: 'Catcher',
  infielder: 'Infielder',
  outfielder: 'Outfielder',
  designated_hitter: 'DH',
};

export const POSITION_ICONS: Record<string, string> = {
  pitcher: '⚾',
  catcher: '🥎',
  infielder: '🧤',
  outfielder: '🏃',
  designated_hitter: '🏏',
};

export const AVATAR_EMOJIS: Record<string, string> = {
  batter: '⚾',
  pitcher: '🎯',
  catcher: '🛡️',
  coach: '📋',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
