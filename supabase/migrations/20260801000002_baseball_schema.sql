-- Baseball Quest Arena schema

CREATE SCHEMA IF NOT EXISTS baseball;

-- ─── Player Profiles ─────────────────────────────────────────────────────────

CREATE TABLE baseball.player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'outfielder',
  age_group TEXT NOT NULL DEFAULT 'adult',
  avatar TEXT NOT NULL DEFAULT 'batter',
  hearts INTEGER NOT NULL DEFAULT 5,
  max_hearts INTEGER NOT NULL DEFAULT 5,
  rupees INTEGER NOT NULL DEFAULT 100,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  goals TEXT[] DEFAULT '{}',
  schedule_days TEXT[] DEFAULT '{}',
  equipment_level TEXT NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_profiles_owner" ON baseball.player_profiles
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
GRANT ALL ON baseball.player_profiles TO authenticated;

-- ─── Quest Patterns (seeded templates) ───────────────────────────────────────

CREATE TABLE baseball.quest_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL DEFAULT 'main',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  rupee_reward INTEGER NOT NULL DEFAULT 10,
  heart_cost INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  sections JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.quest_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest_patterns_read" ON baseball.quest_patterns FOR SELECT USING (true);
GRANT SELECT ON baseball.quest_patterns TO authenticated;

-- ─── Player Quests ────────────────────────────────────────────────────────────

CREATE TABLE baseball.player_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES baseball.quest_patterns(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL DEFAULT 'main',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  rupee_reward INTEGER NOT NULL DEFAULT 10,
  heart_cost INTEGER NOT NULL DEFAULT 1,
  sections JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.player_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_quests_owner" ON baseball.player_quests
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
GRANT ALL ON baseball.player_quests TO authenticated;

-- ─── Shop Items ───────────────────────────────────────────────────────────────

CREATE TABLE baseball.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'equipment',
  icon TEXT NOT NULL DEFAULT '⚾',
  price_rupees INTEGER NOT NULL DEFAULT 50,
  is_daily_deal BOOLEAN NOT NULL DEFAULT false,
  rarity TEXT NOT NULL DEFAULT 'common',
  effect JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_items_read" ON baseball.shop_items FOR SELECT USING (true);
GRANT SELECT ON baseball.shop_items TO authenticated;

-- ─── Player Inventory ─────────────────────────────────────────────────────────

CREATE TABLE baseball.player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES baseball.shop_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.player_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_inventory_owner" ON baseball.player_inventory
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
GRANT ALL ON baseball.player_inventory TO authenticated;

-- ─── Badge Definitions ────────────────────────────────────────────────────────

CREATE TABLE baseball.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'conditioning',
  tier TEXT NOT NULL DEFAULT 'bronze',
  icon TEXT NOT NULL DEFAULT '🏅',
  requirement_type TEXT NOT NULL DEFAULT 'quest_count',
  requirement_value INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_definitions_read" ON baseball.badge_definitions FOR SELECT USING (true);
GRANT SELECT ON baseball.badge_definitions TO authenticated;

-- ─── Player Badges ────────────────────────────────────────────────────────────

CREATE TABLE baseball.player_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES baseball.badge_definitions(id),
  earned_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_badges_owner" ON baseball.player_badges
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
GRANT ALL ON baseball.player_badges TO authenticated;

-- ─── Calendar Tasks ───────────────────────────────────────────────────────────

CREATE TABLE baseball.calendar_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'workout',
  scheduled_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  quest_id UUID REFERENCES baseball.player_quests(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.calendar_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_tasks_owner" ON baseball.calendar_tasks
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
GRANT ALL ON baseball.calendar_tasks TO authenticated;

-- ─── Library: Workouts ────────────────────────────────────────────────────────

CREATE TABLE baseball.library_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'strength',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  exercises JSONB NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  position_tags TEXT[] DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT '💪',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.library_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_workouts_read" ON baseball.library_workouts FOR SELECT USING (true);
GRANT SELECT ON baseball.library_workouts TO authenticated;

-- ─── Library: Drills ──────────────────────────────────────────────────────────

CREATE TABLE baseball.library_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill TEXT NOT NULL DEFAULT 'fielding',
  equipment_needed TEXT[] DEFAULT '{}',
  steps TEXT[] NOT NULL DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT '⚾',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.library_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_drills_read" ON baseball.library_drills FOR SELECT USING (true);
GRANT SELECT ON baseball.library_drills TO authenticated;

-- ─── Library: Lingo ───────────────────────────────────────────────────────────

CREATE TABLE baseball.library_lingo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE baseball.library_lingo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_lingo_read" ON baseball.library_lingo FOR SELECT USING (true);
GRANT SELECT ON baseball.library_lingo TO authenticated;

-- ─── Expose baseball schema via PostgREST ─────────────────────────────────────

-- (Supabase exposes schemas listed in the API settings; this is a reminder to add 'baseball' there)

-- ─── Seed: Shop Items ─────────────────────────────────────────────────────────

INSERT INTO baseball.shop_items (name, description, category, icon, price_rupees, is_daily_deal, rarity, effect) VALUES
  ('Heart Potion', 'Restore 1 heart instantly', 'power_up', '❤️', 30, true, 'common', '{"type":"heart_restore","value":1}'),
  ('Double XP Boost', 'Earn 2x XP on your next completed quest', 'booster', '⭐', 75, true, 'rare', '{"type":"xp_multiplier","value":2}'),
  ('Pro Batting Gloves', 'Legendary gloves for elite hitters', 'equipment', '🧤', 150, false, 'epic', '{}'),
  ('Radar Gun', 'Track your pitch speed', 'equipment', '📡', 200, false, 'rare', '{}'),
  ('Rosin Bag', 'Classic pitcher grip aid', 'equipment', '⚾', 20, false, 'common', '{}'),
  ('Batting Helmet', 'Full face protection', 'equipment', '⛑️', 120, false, 'common', '{}'),
  ('Heart Feast', 'Restore 3 hearts at once', 'power_up', '💖', 80, false, 'rare', '{"type":"heart_restore","value":3}'),
  ('Diamond XP Surge', 'Triple XP on next quest — legend tier', 'booster', '💎', 250, false, 'legendary', '{"type":"xp_multiplier","value":3}'),
  ('Pitching Machine Token', '1-hour access to a pitching machine session', 'equipment', '🤖', 60, false, 'common', '{}'),
  ('Team Jersey', 'Custom team jersey cosmetic', 'cosmetic', '👕', 100, false, 'rare', '{}'),
  ('Golden Bat', 'Legendary cosmetic bat skin', 'cosmetic', '🏏', 500, false, 'legendary', '{}'),
  ('Streak Shield', 'Protect your streak for 1 day', 'power_up', '🛡️', 50, false, 'common', '{"type":"streak_protect","value":1}');

-- ─── Seed: Badge Definitions ─────────────────────────────────────────────────

INSERT INTO baseball.badge_definitions (name, description, category, tier, icon, requirement_type, requirement_value) VALUES
  -- Hitting
  ('First Hit', 'Complete your first hitting quest', 'hitting', 'bronze', '🏏', 'quest_count', 1),
  ('Clean Contact', 'Complete 10 hitting quests', 'hitting', 'silver', '⚾', 'quest_count', 10),
  ('Power Hitter', 'Complete 25 hitting quests', 'hitting', 'gold', '💥', 'quest_count', 25),
  ('Homerun King', 'Complete 50 hitting quests', 'hitting', 'diamond', '👑', 'quest_count', 50),
  -- Pitching
  ('First Pitch', 'Complete your first pitching quest', 'pitching', 'bronze', '⚾', 'quest_count', 1),
  ('Southpaw', 'Complete 10 pitching quests', 'pitching', 'silver', '🎯', 'quest_count', 10),
  ('Ace', 'Complete 25 pitching quests', 'pitching', 'gold', '🔥', 'quest_count', 25),
  ('Cy Young', 'Complete 50 pitching quests', 'pitching', 'diamond', '🏆', 'quest_count', 50),
  -- Fielding
  ('Glove Up', 'Complete your first fielding quest', 'fielding', 'bronze', '🧤', 'quest_count', 1),
  ('Vacuum', 'Complete 10 fielding quests', 'fielding', 'silver', '✨', 'quest_count', 10),
  ('Gold Glover', 'Complete 25 fielding quests', 'fielding', 'gold', '🥇', 'quest_count', 25),
  ('The Wall', 'Complete 50 fielding quests', 'fielding', 'diamond', '🛡️', 'quest_count', 50),
  -- Conditioning
  ('First Rep', 'Reach 100 total XP', 'conditioning', 'bronze', '💪', 'xp_total', 100),
  ('Iron Body', 'Reach 500 total XP', 'conditioning', 'silver', '⚡', 'xp_total', 500),
  ('Machine', 'Reach 1000 total XP', 'conditioning', 'gold', '🤖', 'xp_total', 1000),
  ('Legend', 'Reach 5000 total XP', 'conditioning', 'diamond', '💎', 'xp_total', 5000),
  -- Mental
  ('Day 1', 'Start a 3-day streak', 'mental', 'bronze', '🔥', 'streak', 3),
  ('Committed', 'Reach a 7-day streak', 'mental', 'silver', '📅', 'streak', 7),
  ('Elite Mindset', 'Reach a 30-day streak', 'mental', 'gold', '🧠', 'streak', 30),
  ('Unstoppable', 'Reach a 100-day streak', 'mental', 'diamond', '♾️', 'streak', 100),
  -- Team
  ('Rookie', 'Reach Level 5', 'team', 'bronze', '🌱', 'level', 5),
  ('Varsity', 'Reach Level 15', 'team', 'silver', '🎓', 'level', 15),
  ('All-Star', 'Reach Level 30', 'team', 'gold', '⭐', 'level', 30),
  ('Hall of Fame', 'Reach Level 50', 'team', 'diamond', '🏛️', 'level', 50);

-- ─── Seed: Library Workouts ──────────────────────────────────────────────────

INSERT INTO baseball.library_workouts (title, description, category, duration_minutes, exercises, difficulty, position_tags, icon) VALUES
  ('Full Body Power', 'Build explosive power for all positions', 'strength', 45,
    '[{"name":"Squat","reps":"4x8"},{"name":"Romanian Deadlift","reps":"3x10"},{"name":"Bench Press","reps":"4x8"},{"name":"Pull-ups","reps":"3x max"},{"name":"Plank","duration":"3x60s"}]',
    'medium', '{"pitcher","catcher","infielder","outfielder"}', '💪'),
  ('Rotational Power', 'Hip rotation for hitters and pitchers', 'strength', 30,
    '[{"name":"Medicine Ball Rotational Throw","reps":"4x8 each"},{"name":"Cable Wood Chop","reps":"3x12 each"},{"name":"Hip Circle Drill","reps":"3x20"},{"name":"Standing Oblique Crunch","reps":"3x15"}]',
    'medium', '{"pitcher","designated_hitter"}', '🔄'),
  ('Speed & Agility Ladder', 'First step quickness and footwork', 'speed', 25,
    '[{"name":"Ladder In-Out","reps":"6x"},{"name":"Lateral High Knees","reps":"6x"},{"name":"Shuffle Steps","reps":"8x"},{"name":"Crossover Run","reps":"6x"},{"name":"Sprint 30m","reps":"8x"}]',
    'hard', '{"outfielder","infielder","catcher"}', '⚡'),
  ('Arm Care Routine', 'Shoulder health and recovery', 'flexibility', 20,
    '[{"name":"Arm Circles","duration":"2x30s"},{"name":"Crossbody Shoulder Stretch","duration":"3x30s each"},{"name":"Sleeper Stretch","duration":"2x30s each"},{"name":"Theraband External Rotation","reps":"3x15"},{"name":"Wrist Flexor Stretch","duration":"2x30s"}]',
    'easy', '{"pitcher","catcher"}', '💆'),
  ('Endurance Builder', 'Improve stamina for long games', 'endurance', 60,
    '[{"name":"Warm-up Jog","duration":"5 min"},{"name":"Interval Sprints (40m)","reps":"10x"},{"name":"Lateral Shuffle","reps":"6x40m"},{"name":"Cool-down Walk","duration":"5 min"}]',
    'hard', '{"outfielder","pitcher"}', '🏃'),
  ('Hip Mobility Flow', 'Open hips for better rotation and range', 'flexibility', 20,
    '[{"name":"90/90 Hip Stretch","duration":"3x30s each"},{"name":"Pigeon Pose","duration":"3x40s each"},{"name":"Hip Flexor Lunge Stretch","duration":"2x30s each"},{"name":"Lateral Band Walk","reps":"3x15 each"}]',
    'easy', '{"pitcher","catcher","infielder","outfielder","designated_hitter"}', '🧘'),
  ('Core & Stability', 'Core strength for better mechanics', 'strength', 30,
    '[{"name":"Dead Bug","reps":"3x10 each"},{"name":"Pallof Press","reps":"3x12 each"},{"name":"Side Plank","duration":"3x45s each"},{"name":"Bird Dog","reps":"3x10 each"},{"name":"V-up","reps":"3x15"}]',
    'medium', '{"pitcher","catcher","infielder","outfielder"}', '🎯');

-- ─── Seed: Library Drills ────────────────────────────────────────────────────

INSERT INTO baseball.library_drills (title, description, skill, equipment_needed, steps, tips, icon) VALUES
  ('Tee Drill — Contact Point', 'Master your ideal contact point with a batting tee', 'hitting',
    '{"batting tee","baseball","bat"}',
    '{"Set tee at belt height in front of lead knee","Take your normal stance","Focus on keeping hands inside the ball","Drive through contact finishing high","Repeat 20 reps at each tee position"}',
    '{"Keep your back elbow up in the swing","Don''t lunge — let the ball come to you","Rotate hips before hands"}',
    '🏏'),
  ('Soft Toss — Inside/Outside', 'Track and hit pitches at different locations', 'hitting',
    '{"soft toss net","baseballs","bat","partner"}',
    '{"Partner kneels at 45-degree angle","Call inside or outside before each toss","Adjust foot position and swing plane","Hit 15 inside, 15 outside, 15 middle"}',
    '{"Stay balanced — don''t overswing","Outside pitch: hit to the opposite field","Inside pitch: pull with hip rotation"}',
    '⚾'),
  ('Four-Seam Grip Drill', 'Perfect your four-seam fastball grip and release', 'pitching',
    '{"baseball"}',
    '{"Hold ball with index and middle finger across the top seam","Thumb underneath for support","Practice grip 50x without throwing","Throw 20 into a net focusing on backspin","Video your release point"}',
    '{"Don''t squeeze too hard — 60% grip pressure","Snap your wrist on release for tight spin","Lead with your elbow on the follow-through"}',
    '🎯'),
  ('Long Toss Program', 'Build arm strength progressively', 'pitching',
    '{"baseballs","partner or wall","measuring tape"}',
    '{"Start at 30 feet — 10 throws","Move to 60 feet — 10 throws","Increase 15 feet per set to max distance","Work back in at same intervals","Finish with 10 flat-ground pitches"}',
    '{"Never throw through pain","Keep a loose arc on the way out","Pull down and through on the way in"}',
    '💪'),
  ('Footwork Triangle', 'Improve infield footwork for clean exchanges', 'fielding',
    '{"glove","baseballs","cones"}',
    '{"Set 3 cones in a triangle 10 feet apart","Ground ball to left cone: field and step through","Ground ball to right cone: backhand pivot","Slow roller to front: charge and glove flip","Repeat 20 times per position"}',
    '{"Get low on ground balls — bend at the knees","Field with two hands whenever possible","Keep the ball in front on slow rollers"}',
    '🧤'),
  ('Backhand Drill', 'Master the backhand catch for infielders', 'fielding',
    '{"glove","baseballs","partner"}',
    '{"Position at shortstop or 3rd base depth","Partner rolls backhand balls","Plant outside foot and reach across body","Secure, pivot, and throw to first","25 reps each side"}',
    '{"Turn your glove thumb-down on backhand","Keep eye on ball all the way into glove","Short arm slot throw on the run"}',
    '🔄'),
  ('Pop-time Drill', 'Catchers — improve your throw to 2nd base', 'catching',
    '{"full catcher gear","baseball","stopwatch","partner at 2nd"}',
    '{"Take stance in catching position","Partner signals pitch type (fastball)","Receive ball cleanly — no drift","Transfer and throw on same motion","Record pop time (target: under 2.0s)"}',
    '{"Feet must move during pitch to set up throw","High hands on receive = faster transfer","Use a 4-seam grip immediately"}',
    '🛡️'),
  ('First-to-Third Read', 'Baserunning decision making drill', 'baserunning',
    '{"bases","partner as coach","baseballs"}',
    '{"Runner at first, ground ball hit to right side","Coach gives or takes the signal at 3rd","Runner reads the ball off the bat","Round 2nd at full speed — commit or stop","Repeat 15 times from first and second base"}',
    '{"Round bases aggressively on balls to right field","Watch the coach at 3rd — don''t run through the stop","Tag up on all caught fly balls"}',
    '🏃');

-- ─── Seed: Library Lingo ─────────────────────────────────────────────────────

INSERT INTO baseball.library_lingo (term, definition, category, example) VALUES
  ('Chin music', 'A fastball thrown high and inside, near the batter''s chin', 'pitching', 'He threw some chin music to back the batter off the plate.'),
  ('Backdoor slider', 'A slider that appears to be a ball outside but breaks back over the corner of the plate', 'pitching', 'The backdoor slider froze the lefty for strike three.'),
  ('Eephus pitch', 'An extremely slow, high-arcing off-speed pitch meant to disrupt the batter''s timing', 'pitching', 'The pitcher surprised everyone with an eephus pitch at 45 mph.'),
  ('Tunneling', 'Making two different pitches look identical out of the hand until the last moment', 'strategy', 'His four-seam and changeup had great tunneling — batters couldn''t tell them apart.'),
  ('BABIP', 'Batting Average on Balls In Play — measures luck on contact', 'general', 'His high BABIP suggests some good luck this season.'),
  ('Launch angle', 'The vertical angle at which the ball leaves the bat after contact', 'hitting', 'A 25-degree launch angle is ideal for fly balls.'),
  ('Exit velocity', 'The speed of the ball off the bat, measured in mph', 'hitting', 'He had a 105 mph exit velocity on that line drive.'),
  ('Sweet spot', 'The optimal contact point on the barrel of the bat for maximum power', 'hitting', 'He made contact right on the sweet spot for a no-doubter.'),
  ('Shift', 'A defensive alignment where three infielders play on one side of second base', 'strategy', 'The shift took away two sure singles from the pull hitter.'),
  ('Hit and run', 'A play where the runner starts moving on the pitch and the batter tries to hit behind the runner', 'strategy', 'The hit and run moved the runner from first to third on a single.'),
  ('Sacrifice bunt', 'A batter intentionally bunts to be thrown out, advancing a baserunner', 'general', 'The manager called for a sacrifice bunt to move the runner to scoring position.'),
  ('Fielder''s choice', 'A play where the fielder chooses to throw out a baserunner rather than the batter', 'general', 'He reached on a fielder''s choice when the shortstop got the lead runner.'),
  ('Pickoff', 'A throw by the pitcher to a base to catch a runner leaning or stealing', 'pitching', 'The pitcher made a quick pickoff move and caught the runner off second.'),
  ('Stolen base', 'When a runner advances to the next base during a pitch without a hit', 'baserunning', 'He has 40 stolen bases this season with an 85% success rate.'),
  ('Balk', 'An illegal motion by the pitcher that allows baserunners to advance one base', 'pitching', 'The umpire called a balk because the pitcher didn''t come set.'),
  ('ERA', 'Earned Run Average — the average number of earned runs per 9 innings pitched', 'pitching', 'His 2.35 ERA leads the league among starters.'),
  ('OPS', 'On-base Plus Slugging — a combined offensive metric', 'hitting', 'An OPS over .900 is considered elite-level hitting.'),
  ('WAR', 'Wins Above Replacement — measures a player''s total value compared to a replacement-level player', 'general', 'He had 7.2 WAR last season, making him an MVP candidate.'),
  ('Cutoff man', 'The infielder who intercepts throws from the outfield to relay to the target base', 'fielding', 'The shortstop serves as the cutoff man on hits to left and center field.'),
  ('Can of corn', 'A routine, easy fly ball for an outfielder to catch', 'fielding', 'The center fielder drifted under the can of corn for the final out.');
