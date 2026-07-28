import { Platform } from 'react-native';

const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

export function initializePurchases(userId: string | null) {
  if (Platform.OS === 'web' || !REVENUECAT_ANDROID_KEY) return;
  // Dynamic import keeps react-native-purchases out of the web bundle
  void import('react-native-purchases').then(({ default: Purchases }) => {
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });
    }
    if (userId) void Purchases.logIn(userId);
  });
}

export const ENTITLEMENTS = { premium: 'premium' } as const;

export async function checkPremiumEntitlement(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { default: Purchases } = await import('react-native-purchases');
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENTS.premium] !== undefined;
  } catch {
    return false;
  }
}
