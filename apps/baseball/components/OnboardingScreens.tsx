import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useCreateProfile } from '../lib/player';
import { cardShadow } from '../lib/styles';

const BG = '#FBF5E6';
const GOLD = '#D4A017';
const NAVY = '#1B3A6B';
const TEXT = '#2C1810';
const MUTED = '#7A6652';
const SURFACE = '#FFFFFF';

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={{ width: s === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: s === step ? GOLD : '#DDD0BB' }} />
      ))}
    </View>
  );
}

function OptionCard({ icon, label, selected, onPress }: { icon: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: selected ? '#FFF8E1' : SURFACE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: selected ? GOLD : '#DDD0BB',
        opacity: pressed ? 0.85 : 1,
        ...cardShadow,
      })}
    >
      <Text style={{ fontSize: 28, marginRight: 14 }}>{icon}</Text>
      <Text style={{ fontSize: 16, fontWeight: '600', color: selected ? TEXT : MUTED, flex: 1 }}>{label}</Text>
      {selected && <Text style={{ fontSize: 18, color: GOLD }}>✓</Text>}
    </Pressable>
  );
}

function NextButton({ onPress, label = 'Continue', disabled = false }: { onPress: () => void; label?: string; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: disabled ? '#DDD0BB' : GOLD,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        opacity: pressed ? 0.8 : 1,
        ...cardShadow,
      })}
    >
      <Text style={{ fontSize: 17, fontWeight: '800', color: disabled ? '#7A6652' : TEXT }}>{label}</Text>
    </Pressable>
  );
}

// Shared state across steps via module-level refs (simple approach for linear onboarding)
const draft = {
  username: '',
  position: '',
  ageGroup: '',
  goals: [] as string[],
  scheduleDays: [] as string[],
  equipmentLevel: '',
};

export function OnboardingStep1() {
  const router = useRouter();
  const [username, setUsername] = useState(draft.username);
  const [position, setPosition] = useState(draft.position);

  const positions = [
    { icon: '🎯', label: 'Pitcher', value: 'pitcher' },
    { icon: '🛡️', label: 'Catcher', value: 'catcher' },
    { icon: '🧤', label: 'Infielder', value: 'infielder' },
    { icon: '🏃', label: 'Outfielder', value: 'outfielder' },
    { icon: '🏏', label: 'Designated Hitter', value: 'designated_hitter' },
  ];

  function next() {
    if (!username.trim() || !position) return;
    draft.username = username.trim();
    draft.position = position;
    router.push('/onboarding/step2');
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>⚾</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: TEXT }}>Player Profile</Text>
          <Text style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>Step 1 of 4</Text>
        </View>

        <ProgressDots step={1} />

        <Text style={{ fontSize: 13, fontWeight: '700', color: MUTED, marginBottom: 8 }}>Your name</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="e.g. Alex Rodriguez"
          style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, fontSize: 16, color: TEXT, marginBottom: 24, borderWidth: 1.5, borderColor: '#DDD0BB' }}
          placeholderTextColor="#B8A080"
        />

        <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 16 }}>What's your position?</Text>
        {positions.map((p) => (
          <OptionCard key={p.value} icon={p.icon} label={p.label} selected={position === p.value} onPress={() => setPosition(p.value)} />
        ))}

        <NextButton onPress={next} disabled={!username.trim() || !position} />
      </ScrollView>
    </View>
  );
}

const AGE_STOPS = [
  { label: 'Under 8',  value: 'under_8' },
  { label: '8',        value: '8' },
  { label: '9',        value: '9' },
  { label: '10',       value: '10' },
  { label: '11',       value: '11' },
  { label: '12',       value: '12' },
  { label: '13',       value: '13' },
  { label: '14',       value: '14' },
  { label: '15',       value: '15' },
  { label: '16',       value: '16' },
  { label: '17+',      value: '17_plus' },
];

export function OnboardingStep2() {
  const router = useRouter();
  const defaultIdx = draft.ageGroup
    ? Math.max(0, AGE_STOPS.findIndex((s) => s.value === draft.ageGroup))
    : 5;
  const [ageIdx, setAgeIdx] = useState(defaultIdx);
  const [equipmentLevel, setEquipmentLevel] = useState(draft.equipmentLevel);

  const equipment = [
    { icon: '🔰', label: 'Beginner – just the basics', value: 'beginner' },
    { icon: '⚡', label: 'Intermediate – full gear', value: 'intermediate' },
    { icon: '🏆', label: 'Advanced – pro equipment', value: 'advanced' },
  ];

  function next() {
    if (!equipmentLevel) return;
    draft.ageGroup = AGE_STOPS[ageIdx]!.value;
    draft.equipmentLevel = equipmentLevel;
    router.push('/onboarding/step3');
  }

  const currentStop = AGE_STOPS[ageIdx]!;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>🧤</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: TEXT }}>Equipment & Age</Text>
          <Text style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>Step 2 of 4</Text>
        </View>

        <ProgressDots step={2} />

        {/* Age slider */}
        <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 8 }}>How old are you?</Text>
        <View style={{ backgroundColor: SURFACE, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1.5, borderColor: '#DDD0BB' }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 40, fontWeight: '900', color: GOLD }}>{currentStop.label}</Text>
            <Text style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>years old</Text>
          </View>
          {/* Tick marks */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            {AGE_STOPS.map((_, i) => (
              <View key={i} style={{ width: 2, height: i === ageIdx ? 14 : 6, backgroundColor: i === ageIdx ? GOLD : '#DDD0BB', borderRadius: 1 }} />
            ))}
          </View>
          {/* Slider track with pressable segments */}
          <View style={{ flexDirection: 'row', height: 8, backgroundColor: '#F5E6C8', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ flex: ageIdx + 1, backgroundColor: GOLD, borderRadius: 4 }} />
            <View style={{ flex: AGE_STOPS.length - ageIdx - 1 }} />
          </View>
          {/* Step buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Pressable
              onPress={() => setAgeIdx((i) => Math.max(0, i - 1))}
              style={({ pressed }) => ({ backgroundColor: pressed ? '#DDD0BB' : '#F5E6C8', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' })}
            >
              <Text style={{ fontSize: 20, color: TEXT, fontWeight: '800' }}>−</Text>
            </Pressable>
            {/* Direct tick taps */}
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {AGE_STOPS.map((stop, i) => (
                <Pressable key={i} onPress={() => setAgeIdx(i)} style={{ padding: 4 }}>
                  <View style={{ width: i === ageIdx ? 10 : 6, height: i === ageIdx ? 10 : 6, borderRadius: 5, backgroundColor: i === ageIdx ? GOLD : '#DDD0BB' }} />
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setAgeIdx((i) => Math.min(AGE_STOPS.length - 1, i + 1))}
              style={({ pressed }) => ({ backgroundColor: pressed ? '#DDD0BB' : '#F5E6C8', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' })}
            >
              <Text style={{ fontSize: 20, color: TEXT, fontWeight: '800' }}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 16 }}>Equipment level</Text>
        {equipment.map((e) => (
          <OptionCard key={e.value} icon={e.icon} label={e.label} selected={equipmentLevel === e.value} onPress={() => setEquipmentLevel(e.value)} />
        ))}

        <NextButton onPress={next} disabled={!equipmentLevel} />
      </ScrollView>
    </View>
  );
}

export function OnboardingStep3() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(draft.scheduleDays);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function toggle(day: string) {
    setSelected((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  function next() {
    if (selected.length === 0) return;
    draft.scheduleDays = selected;
    router.push('/onboarding/step4');
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>📅</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: TEXT }}>Training Schedule</Text>
          <Text style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>Step 3 of 4</Text>
        </View>

        <ProgressDots step={3} />

        <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 20 }}>Which days do you train?</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {days.map((d) => {
            const active = selected.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggle(d)}
                style={({ pressed }) => ({
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: active ? GOLD : SURFACE,
                  borderWidth: 2,
                  borderColor: active ? GOLD : '#DDD0BB',
                  opacity: pressed ? 0.8 : 1,
                  ...cardShadow,
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: active ? TEXT : MUTED }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 16 }}>
          {selected.length === 0 ? 'Select at least one day' : `${selected.length} day${selected.length > 1 ? 's' : ''} selected`}
        </Text>

        <NextButton onPress={next} disabled={selected.length === 0} />
      </ScrollView>
    </View>
  );
}

const GOALS = [
  { icon: '⚡', label: 'Improve speed & agility', value: 'speed' },
  { icon: '💪', label: 'Build strength', value: 'strength' },
  { icon: '🎯', label: 'Better mechanics', value: 'mechanics' },
  { icon: '🧠', label: 'Mental toughness', value: 'mental' },
  { icon: '🤝', label: 'Team leadership', value: 'leadership' },
  { icon: '🏆', label: 'Make varsity / go pro', value: 'varsity' },
];

export function OnboardingStep4() {
  const router = useRouter();
  const [goals, setGoals] = useState<string[]>(draft.goals);
  const { mutateAsync: createProfile } = useCreateProfile();
  const [loading, setLoading] = useState(false);

  function toggle(v: string) {
    setGoals((prev) => prev.includes(v) ? prev.filter((g) => g !== v) : [...prev, v]);
  }

  async function finish() {
    if (goals.length === 0) return;
    setLoading(true);
    try {
      draft.goals = goals;
      await createProfile({
        username: draft.username,
        position: draft.position,
        ageGroup: draft.ageGroup,
        goals: draft.goals,
        scheduleDays: draft.scheduleDays,
        equipmentLevel: draft.equipmentLevel,
      });
      router.replace('/(tabs)');
    } catch (e: unknown) {
      console.error('[Onboarding] Profile creation failed:', e);
      Alert.alert('Error', 'Could not create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>🏆</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: TEXT }}>Your Goals</Text>
          <Text style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>Step 4 of 4</Text>
        </View>

        <ProgressDots step={4} />

        <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 16 }}>What do you want to achieve? (pick all that apply)</Text>

        {GOALS.map((g) => (
          <OptionCard key={g.value} icon={g.icon} label={g.label} selected={goals.includes(g.value)} onPress={() => toggle(g.value)} />
        ))}

        <NextButton
          onPress={finish}
          label={loading ? 'Setting up...' : "Let's Play Ball!"}
          disabled={goals.length === 0 || loading}
        />
      </ScrollView>
    </View>
  );
}
