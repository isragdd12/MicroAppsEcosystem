import { useTheme } from '@microapps/theme';
import { Button, Screen, Stack } from '@microapps/ui';
import React, { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';

export function PremiumScreen() {
  const { colors, typography, spacing } = useTheme();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const { default: Purchases } = await import('react-native-purchases');
        const info = await Purchases.getCustomerInfo();
        setIsPremium(info.entitlements.active['premium'] !== undefined);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePurchase() {
    if (Platform.OS === 'web') return;
    try {
      setError(null);
      const { default: Purchases } = await import('react-native-purchases');
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];
      if (!pkg) {
        setError('No packages available');
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setIsPremium(customerInfo.entitlements.active['premium'] !== undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Purchase failed');
    }
  }

  if (Platform.OS === 'web') {
    return (
      <Screen>
        <Stack gap={4} style={{ padding: spacing(4) }}>
          <Text
            style={{
              fontSize: typography.size.xl,
              fontWeight: 'bold',
              color: colors.text,
            }}
          >
            Pet Care Premium
          </Text>
          <Text
            style={{ fontSize: typography.size.md, color: colors.textMuted }}
          >
            In-app purchases are available on Android only.
          </Text>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack gap={4} style={{ padding: spacing(4) }}>
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          Pet Care Premium
        </Text>
        {isPremium ? (
          <Text style={{ fontSize: typography.size.md, color: colors.success }}>
            ✓ You have Premium. Thank you!
          </Text>
        ) : (
          <>
            <Text
              style={{ fontSize: typography.size.md, color: colors.textMuted }}
            >
              Unlock AI feeding insights, unlimited pets, and photo sync.
            </Text>
            {loading && (
              <Text style={{ color: colors.textMuted }}>Loading…</Text>
            )}
            {error && <Text style={{ color: colors.danger }}>{error}</Text>}
            <Button label="Upgrade to Premium" onPress={handlePurchase} />
          </>
        )}
      </Stack>
    </Screen>
  );
}
