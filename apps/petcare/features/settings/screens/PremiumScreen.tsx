import { useTheme } from '@microapps/theme';
import { Button, Screen, Stack } from '@microapps/ui';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

export function PremiumScreen() {
  const { colors, typography, spacing } = useTheme();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [offerings, info] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo(),
        ]);
        setPackages(offerings.current?.availablePackages ?? []);
        setIsPremium(info.entitlements.active['premium'] !== undefined);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load offerings');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handlePurchase(pkg: PurchasesPackage) {
    try {
      setError(null);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setIsPremium(customerInfo.entitlements.active['premium'] !== undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Purchase failed');
    }
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
            {packages.map((pkg) => (
              <Button
                key={pkg.identifier}
                label={`${pkg.product.title} — ${pkg.product.priceString}`}
                onPress={() => handlePurchase(pkg)}
              />
            ))}
          </>
        )}
      </Stack>
    </Screen>
  );
}
