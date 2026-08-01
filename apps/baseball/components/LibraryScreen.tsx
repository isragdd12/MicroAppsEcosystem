import { useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useDrills, useLingo, useWorkouts } from '../lib/library';
import { cardShadow } from '../lib/styles';
import type { LibraryDrill, LibraryLingo, LibraryWorkout } from '../lib/types';

const TABS = ['Workouts', 'Drills', 'Lingo'] as const;

export function LibraryScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const [tab, setTab] = useState<'Workouts' | 'Drills' | 'Lingo'>('Workouts');
  const [search, setSearch] = useState('');
  const { data: workouts, isLoading: wLoading } = useWorkouts();
  const { data: drills, isLoading: dLoading } = useDrills();
  const { data: lingo, isLoading: lLoading } = useLingo();

  const isLoading = wLoading || dLoading || lLoading;
  const q = search.toLowerCase().trim();

  const filteredWorkouts = (workouts ?? []).filter((w) => !q || w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
  const filteredDrills = (drills ?? []).filter((d) => !q || d.title.toLowerCase().includes(q) || d.skill.toLowerCase().includes(q));
  const filteredLingo = (lingo ?? []).filter((l) => !q || l.term.toLowerCase().includes(q) || l.definition.toLowerCase().includes(q));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(8) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(3) }}>
          <Text style={{ fontSize: typography.size.xxl, fontWeight: '900', color: colors.text, marginBottom: spacing(3) }}>Library 📚</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            style={{ backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing(3), fontSize: 15, color: colors.text, borderWidth: 1.5, borderColor: colors.border }}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing(4), gap: spacing(2), marginBottom: spacing(4) }}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: spacing(2), borderRadius: radii.md, backgroundColor: tab === t ? colors.secondary : colors.surface, alignItems: 'center', ...cardShadow }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? '#FFFFFF' : colors.textMuted }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing(4) }}>
          {isLoading ? (
            <Spinner />
          ) : tab === 'Workouts' ? (
            filteredWorkouts.length === 0 ? (
              <EmptySearch colors={colors} radii={radii} spacing={spacing} />
            ) : (
              filteredWorkouts.map((w) => <WorkoutCard key={w.id} workout={w} colors={colors} typography={typography} spacing={spacing} radii={radii} />)
            )
          ) : tab === 'Drills' ? (
            filteredDrills.length === 0 ? (
              <EmptySearch colors={colors} radii={radii} spacing={spacing} />
            ) : (
              filteredDrills.map((d) => <DrillCard key={d.id} drill={d} colors={colors} typography={typography} spacing={spacing} radii={radii} />)
            )
          ) : (
            filteredLingo.length === 0 ? (
              <EmptySearch colors={colors} radii={radii} spacing={spacing} />
            ) : (
              filteredLingo.map((l) => <LingoCard key={l.id} lingo={l} colors={colors} typography={typography} spacing={spacing} radii={radii} />)
            )
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function EmptySearch({ colors, radii, spacing }: { colors: ReturnType<typeof useTheme>['colors']; radii: ReturnType<typeof useTheme>['radii']; spacing: ReturnType<typeof useTheme>['spacing'] }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(6), alignItems: 'center', ...cardShadow }}>
      <Text style={{ fontSize: 32, marginBottom: spacing(2) }}>🔍</Text>
      <Text style={{ fontSize: 15, color: colors.textMuted }}>No results found</Text>
    </View>
  );
}

const DIFFICULTY_COLORS: Record<string, string> = { easy: '#2E7D32', medium: '#E65100', hard: '#C62828' };
const SKILL_ICONS: Record<string, string> = { hitting: '🏏', pitching: '⚾', fielding: '🧤', catching: '🛡️', baserunning: '🏃' };

function WorkoutCard({ workout, colors, typography, spacing, radii }: { workout: LibraryWorkout; colors: ReturnType<typeof useTheme>['colors']; typography: ReturnType<typeof useTheme>['typography']; spacing: ReturnType<typeof useTheme>['spacing']; radii: ReturnType<typeof useTheme>['radii'] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), opacity: pressed ? 0.9 : 1, ...cardShadow })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
          <Text style={{ fontSize: 22 }}>{workout.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.size.md, fontWeight: '800', color: colors.text }}>{workout.title}</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: 2 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>⏱ {workout.durationMinutes} min</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: DIFFICULTY_COLORS[workout.difficulty] ?? colors.textMuted }}>{workout.difficulty}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 18, color: colors.textMuted }}>{expanded ? '↑' : '↓'}</Text>
      </View>
      {expanded && (
        <View style={{ marginTop: spacing(3) }}>
          <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginBottom: spacing(2) }}>{workout.description}</Text>
          {workout.exercises.map((ex, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: spacing(1), borderBottomWidth: i < workout.exercises.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
              <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.text }}>{ex.name}</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: '700', color: colors.primary }}>{ex.reps ?? ex.duration ?? ''}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function DrillCard({ drill, colors, typography, spacing, radii }: { drill: LibraryDrill; colors: ReturnType<typeof useTheme>['colors']; typography: ReturnType<typeof useTheme>['typography']; spacing: ReturnType<typeof useTheme>['spacing']; radii: ReturnType<typeof useTheme>['radii'] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(3), opacity: pressed ? 0.9 : 1, ...cardShadow })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
          <Text style={{ fontSize: 22 }}>{drill.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.size.md, fontWeight: '800', color: colors.text }}>{drill.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={{ fontSize: 13 }}>{SKILL_ICONS[drill.skill] ?? '⚾'}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' }}>{drill.skill}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 18, color: colors.textMuted }}>{expanded ? '↑' : '↓'}</Text>
      </View>
      {expanded && (
        <View style={{ marginTop: spacing(3) }}>
          <Text style={{ fontSize: typography.size.sm, color: colors.textMuted, marginBottom: spacing(2) }}>{drill.description}</Text>
          {drill.equipmentNeeded.length > 0 && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: spacing(2) }}>Required: {drill.equipmentNeeded.join(', ')}</Text>
          )}
          {drill.steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: spacing(1) }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, marginRight: 8 }}>{i + 1}.</Text>
              <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.text }}>{step}</Text>
            </View>
          ))}
          {drill.tips.length > 0 && (
            <View style={{ marginTop: spacing(2), backgroundColor: colors.surfaceAlt, borderRadius: radii.md, padding: spacing(3) }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4 }}>Tips</Text>
              {drill.tips.map((tip, i) => (
                <Text key={i} style={{ fontSize: 12, color: colors.textMuted }}>• {tip}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const LINGO_COLORS: Record<string, string> = {
  general: '#1B3A6B',
  pitching: '#C62828',
  hitting: '#E65100',
  fielding: '#2E7D32',
  strategy: '#7B1FA2',
};

function LingoCard({ lingo, colors, typography, spacing, radii }: { lingo: LibraryLingo; colors: ReturnType<typeof useTheme>['colors']; typography: ReturnType<typeof useTheme>['typography']; spacing: ReturnType<typeof useTheme>['spacing']; radii: ReturnType<typeof useTheme>['radii'] }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = LINGO_COLORS[lingo.category] ?? '#1B3A6B';
  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), marginBottom: spacing(2), opacity: pressed ? 0.9 : 1, ...cardShadow, borderLeftWidth: 3, borderLeftColor: catColor })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: typography.size.md, fontWeight: '800', color: colors.text }}>{lingo.term}</Text>
        <View style={{ backgroundColor: `${catColor}22`, borderRadius: radii.sm, paddingHorizontal: spacing(2), paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: catColor, textTransform: 'capitalize' }}>{lingo.category}</Text>
        </View>
      </View>
      {expanded && (
        <View style={{ marginTop: spacing(2) }}>
          <Text style={{ fontSize: typography.size.sm, color: colors.text }}>{lingo.definition}</Text>
          {lingo.example && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: spacing(1), fontStyle: 'italic' }}>"{lingo.example}"</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
