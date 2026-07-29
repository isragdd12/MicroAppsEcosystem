import { Platform, type ViewStyle } from 'react-native';

export const cardShadow: ViewStyle = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 4 },
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
}) ?? {};

export const subtleShadow: ViewStyle = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  android: { elevation: 2 },
  default: {},
}) ?? {};

export function speciesEmoji(species: string): string {
  const s = species.toLowerCase();
  if (s.includes('dog') || s.includes('puppy') || s.includes('canine')) return '🐕';
  if (s.includes('cat') || s.includes('kitten') || s.includes('feline')) return '🐈';
  if (s.includes('rabbit') || s.includes('bunny')) return '🐇';
  if (s.includes('fish')) return '🐠';
  if (s.includes('bird') || s.includes('parrot') || s.includes('budgie')) return '🦜';
  if (s.includes('hamster')) return '🐹';
  if (s.includes('turtle') || s.includes('tortoise')) return '🐢';
  if (s.includes('snake')) return '🐍';
  if (s.includes('guinea') || s.includes('pig')) return '🐾';
  return '🐾';
}

export function recordTypeEmoji(type: string): string {
  switch (type) {
    case 'vet_visit': return '🏥';
    case 'vaccination': return '💉';
    case 'medication': return '💊';
    default: return '📝';
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}
