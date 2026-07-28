import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

export function initializePurchases(userId: string | null) {
  if (!REVENUECAT_ANDROID_KEY) return;

  if (Platform.OS === 'android') {
    Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });
  }

  if (userId) {
    void Purchases.logIn(userId);
  }
}

export const ENTITLEMENTS = {
  premium: 'premium',
} as const;

export async function checkPremiumEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENTS.premium] !== undefined;
  } catch {
    return false;
  }
}
