import { useAuth, useTheme } from '@microapps/core';
import { Screen, Spinner } from '@microapps/ui';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { useCalendarTasks, useToggleCalendarTask, getWeekStart, getWeekDays } from '../lib/calendar';
import { usePlayerProfile, xpProgress } from '../lib/player';
import { useQuests } from '../lib/quests';
import { cardShadow, POSITION_LABELS } from '../lib/styles';

export function HomeScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  useAuth();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = usePlayerProfile();
  const { data: quests, refetch: refetchQuests } = useQuests('active');
  const weekStart = getWeekStart();
  const weekDays = getWeekDays(weekStart);
  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks, refetch: refetchTasks } = useCalendarTasks(weekStart);
  const { mutateAsync: toggleTask } = useToggleCalendarTask();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchQuests(), refetchTasks()]);
    setRefreshing(false);
  }, [refetchProfile, refetchQuests, refetchTasks]);

  if (profileLoading) return <Spinner />;
  if (!profile) return null;

  const progress = xpProgress(profile.xp, profile.level);
  const todayTasks = (tasks ?? []).filter((t) => t.scheduledDate === today);
  const activeQuests = (quests ?? []).slice(0, 3);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(8) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={{ backgroundColor: colors.secondary, paddingHorizontal: spacing(4), paddingTop: spacing(8), paddingBottom: spacing(6) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(4) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing(3) }}>
                <Text style={{ fontSize: 28 }}>⚾</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{profile.username}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  {POSITION_LABELS[profile.position] ?? profile.position} · Lv {profile.level}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing(3) }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 16 }}>{'❤️'.repeat(Math.min(profile.hearts, 5))}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Hearts</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>💎 {profile.rupees}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Rupees</Text>
              </View>
            </View>
          </View>

          {/* XP Bar */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>XP Progress</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{profile.xp} / {profile.level * 100}</Text>
            </View>
            <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: 8, backgroundColor: colors.primary, borderRadius: 4, width: `${Math.round(progress * 100)}%` }} />
            </View>
          </View>

          {/* Streak */}
          {profile.streakDays > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing(3), backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: spacing(2) }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🔥</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{profile.streakDays} day streak!</Text>
            </View>
          )}
        </View>

        {/* Weekly Calendar */}
        <View style={{ paddingHorizontal: spacing(4), paddingTop: spacing(5) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>This Week</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing(4) }}>
            {weekDays.map((day) => {
              const isToday = day.date === today;
              const dayTasks = (tasks ?? []).filter((t) => t.scheduledDate === day.date);
              const completed = dayTasks.every((t) => t.isCompleted) && dayTasks.length > 0;
              return (
                <View key={day.date} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: isToday ? colors.primary : colors.textMuted, fontWeight: isToday ? '800' : '400', marginBottom: 4 }}>
                    {day.short.toUpperCase().slice(0, 1)}
                  </Text>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: isToday ? colors.primary : completed ? colors.success : colors.surfaceAlt,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: isToday ? 2 : 0,
                    borderColor: colors.primary,
                  }}>
                    <Text style={{ fontSize: 14 }}>{completed ? '✓' : dayTasks.length > 0 ? `${dayTasks.length}` : ''}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Today's Tasks */}
        <View style={{ paddingHorizontal: spacing(4), marginBottom: spacing(5) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>Today's Tasks</Text>
          </View>
          {todayTasks.length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(4), alignItems: 'center', ...cardShadow }}>
              <Text style={{ fontSize: 28, marginBottom: spacing(1) }}>🏖️</Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>Rest day — no tasks scheduled</Text>
            </View>
          ) : (
            todayTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => toggleTask({ id: task.id, isCompleted: !task.isCompleted })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing(3),
                  marginBottom: spacing(2),
                  opacity: pressed ? 0.8 : 1,
                  ...cardShadow,
                })}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: task.isCompleted ? colors.success : 'transparent',
                  borderWidth: 2,
                  borderColor: task.isCompleted ? colors.success : colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: spacing(3),
                }}>
                  {task.isCompleted && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <Text style={{ flex: 1, fontSize: typography.size.sm, fontWeight: '600', color: task.isCompleted ? colors.textMuted : colors.text, textDecorationLine: task.isCompleted ? 'line-through' : 'none' }}>
                  {task.title}
                </Text>
                <Text style={{ fontSize: 14, marginLeft: spacing(2) }}>
                  {task.taskType === 'workout' ? '💪' : task.taskType === 'drill' ? '⚾' : task.taskType === 'game' ? '🏟️' : task.taskType === 'yoga' ? '🧘' : '📝'}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Active Quests */}
        <View style={{ paddingHorizontal: spacing(4), marginBottom: spacing(5) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 }}>Active Quests</Text>
            <Pressable onPress={() => router.push('/(tabs)/quests' as never)}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>See all</Text>
            </Pressable>
          </View>

          {activeQuests.length === 0 ? (
            <Pressable
              onPress={() => router.push('/quests/create')}
              style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing(5), alignItems: 'center', opacity: pressed ? 0.8 : 1, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' })}
            >
              <Text style={{ fontSize: 28, marginBottom: spacing(1) }}>📜</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>No active quests</Text>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 4 }}>+ Create Quest</Text>
            </Pressable>
          ) : (
            activeQuests.map((quest) => (
              <Pressable
                key={quest.id}
                onPress={() => router.push(`/quests/${quest.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing(3),
                  marginBottom: spacing(2),
                  opacity: pressed ? 0.8 : 1,
                  ...cardShadow,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.primary,
                })}
              >
                <Text style={{ fontSize: typography.size.sm, fontWeight: '800', color: colors.text }}>{quest.title}</Text>
                <View style={{ flexDirection: 'row', gap: spacing(3), marginTop: spacing(1) }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>⭐ {quest.xpReward} XP</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>💎 {quest.rupeeReward}</Text>
                  <Text style={{ fontSize: 11, color: '#C62828' }}>❤️ -{quest.heartCost}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing(4) }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing(2) }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: spacing(3) }}>
            <Pressable
              onPress={() => router.push('/quests/create')}
              style={({ pressed }) => ({ flex: 1, backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', opacity: pressed ? 0.8 : 1, ...cardShadow })}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📜</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryText, textAlign: 'center' }}>New Quest</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/library' as never)}
              style={({ pressed }) => ({ flex: 1, backgroundColor: colors.secondary, borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', opacity: pressed ? 0.8 : 1, ...cardShadow })}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>📚</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>Library</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/shop' as never)}
              style={({ pressed }) => ({ flex: 1, backgroundColor: '#7B1FA2', borderRadius: radii.lg, padding: spacing(3), alignItems: 'center', opacity: pressed ? 0.8 : 1, ...cardShadow })}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🛒</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>Shop</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
