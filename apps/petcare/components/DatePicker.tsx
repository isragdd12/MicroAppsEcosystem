import { useTheme } from '@microapps/core';
import React, { useRef } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { cardShadow, formatDate } from '../lib/styles';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export function DatePicker({ label, value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const { colors, typography, spacing, radii } = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const displayValue = value ? formatDate(value) : placeholder;
  const hasValue = !!value;

  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={{ fontSize: typography.size.xs, fontWeight: '600', color: colors.textMuted, marginBottom: spacing(1) }}>
          {label}
        </Text>
        <View
          style={{
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            overflow: 'hidden',
            height: 48,
            justifyContent: 'center',
            ...cardShadow,
          }}
        >
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: typography.size.md,
              color: hasValue ? colors.text : colors.textMuted,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ fontSize: typography.size.xs, fontWeight: '600', color: colors.textMuted, marginBottom: spacing(1) }}>
        {label}
      </Text>
      <NativeDateInput
        value={value}
        onChange={onChange}
        displayValue={displayValue}
        hasValue={hasValue}
        colors={colors}
        typography={typography}
        spacing={spacing}
        radii={radii}
      />
    </View>
  );
}

function NativeDateInput({
  value,
  onChange,
  displayValue,
  hasValue,
  colors,
  typography,
  spacing,
  radii,
}: {
  value: string;
  onChange: (v: string) => void;
  displayValue: string;
  hasValue: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  const [showPicker, setShowPicker] = React.useState(false);
  const today = new Date();
  const [year, setYear] = React.useState(value ? parseInt(value.slice(0, 4)) : today.getFullYear());
  const [month, setMonth] = React.useState(value ? parseInt(value.slice(5, 7)) : today.getMonth() + 1);
  const [day, setDay] = React.useState(value ? parseInt(value.slice(8, 10)) : today.getDate());

  function confirm() {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${year}-${m}-${d}`);
    setShowPicker(false);
  }

  function adjustValue(part: 'year' | 'month' | 'day', delta: number) {
    if (part === 'year') setYear((y) => Math.max(1990, Math.min(today.getFullYear() + 5, y + delta)));
    if (part === 'month') setMonth((m) => m + delta < 1 ? 12 : m + delta > 12 ? 1 : m + delta);
    if (part === 'day') {
      const maxDay = new Date(year, month, 0).getDate();
      setDay((d) => d + delta < 1 ? maxDay : d + delta > maxDay ? 1 : d + delta);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => ({
          height: 48,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing(3),
          opacity: pressed ? 0.7 : 1,
          ...cardShadow,
        })}
      >
        <Text style={{ fontSize: 16, marginRight: spacing(2) }}>📅</Text>
        <Text style={{ fontSize: typography.size.md, color: hasValue ? colors.text : colors.textMuted, flex: 1 }}>
          {displayValue}
        </Text>
        <Text style={{ fontSize: typography.size.xs, color: colors.textMuted }}>›</Text>
      </Pressable>

      {showPicker && (
        <View
          style={{
            marginTop: spacing(2),
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            padding: spacing(4),
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing(3) }}>
            <SpinnerCol label="Year" value={year} onUp={() => adjustValue('year', 1)} onDown={() => adjustValue('year', -1)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
            <SpinnerCol label="Month" value={month} onUp={() => adjustValue('month', 1)} onDown={() => adjustValue('month', -1)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
            <SpinnerCol label="Day" value={day} onUp={() => adjustValue('day', 1)} onDown={() => adjustValue('day', -1)} colors={colors} typography={typography} spacing={spacing} radii={radii} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing(2) }}>
            <Pressable
              onPress={() => setShowPicker(false)}
              style={{ flex: 1, padding: spacing(3), borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
            >
              <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              style={{ flex: 1, padding: spacing(3), borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' }}
            >
              <Text style={{ color: colors.primaryText, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}

function SpinnerCol({
  label, value, onUp, onDown, colors, typography, spacing, radii,
}: {
  label: string;
  value: number;
  onUp: () => void;
  onDown: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radii: ReturnType<typeof useTheme>['radii'];
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', marginHorizontal: spacing(1) }}>
      <Text style={{ fontSize: typography.size.xs, color: colors.textMuted, marginBottom: spacing(1) }}>{label}</Text>
      <Pressable onPress={onUp} style={{ padding: spacing(2) }}>
        <Text style={{ fontSize: 20, color: colors.primary }}>▲</Text>
      </Pressable>
      <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radii.md, paddingVertical: spacing(2), paddingHorizontal: spacing(3), minWidth: 60, alignItems: 'center' }}>
        <Text style={{ fontSize: typography.size.lg, fontWeight: '700', color: colors.text }}>{String(value).padStart(2, '0')}</Text>
      </View>
      <Pressable onPress={onDown} style={{ padding: spacing(2) }}>
        <Text style={{ fontSize: 20, color: colors.primary }}>▼</Text>
      </Pressable>
    </View>
  );
}
