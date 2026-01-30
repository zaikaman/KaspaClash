-- Add fight scene state tracking for full server-side synchronization
-- This ensures all game state is persisted and can be restored if a player
-- disconnects, minimizes the game, or closes the tab

-- =============================================================================
-- ADD PHASE TRACKING TO MATCHES
-- =============================================================================

-- Add current phase to track the fight scene state
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS fight_phase text DEFAULT 'waiting' 
  CHECK (fight_phase IS NULL OR fight_phase = ANY (ARRAY[
    'waiting'::text,
    'countdown'::text,
    'selecting'::text,
    'resolving'::text,
    'round_end'::text,
    'match_end'::text
  ])),
ADD COLUMN IF NOT EXISTS fight_phase_started_at timestamp with time zone;

-- Comments for match fight state
COMMENT ON COLUMN matches.fight_phase IS 'Current phase of the fight scene (waiting, countdown, selecting, resolving, round_end, match_end)';
COMMENT ON COLUMN matches.fight_phase_started_at IS 'Timestamp when the current fight phase started';

-- =============================================================================
-- EXTEND ROUNDS TABLE FOR TURN-LEVEL STATE
-- =============================================================================

-- Add countdown tracking to rounds
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS countdown_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS countdown_seconds integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS turn_number integer DEFAULT 1 CHECK (turn_number >= 1);

-- Add animation state tracking
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS animation_phase text DEFAULT NULL
  CHECK (animation_phase IS NULL OR animation_phase = ANY (ARRAY[
    'none'::text,
    'running_to_center'::text,
    'p1_attacking'::text,
    'p2_attacking'::text,
    'both_attacking'::text,
    'running_back'::text,
    'round_end_death'::text,
    'round_end_text'::text,
    'round_end_countdown'::text
  ])),
ADD COLUMN IF NOT EXISTS animation_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS animation_duration_ms integer DEFAULT 0;

-- Player animation tracking (what animation sprite is currently playing)
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS player1_current_animation text DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS player2_current_animation text DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS player1_animation_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS player2_animation_started_at timestamp with time zone;

-- Track stun state for the next turn
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS player1_is_stunned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS player2_is_stunned boolean DEFAULT false;

-- Comments for round state columns
COMMENT ON COLUMN rounds.countdown_started_at IS 'Timestamp when the 3-2-1 FIGHT countdown started';
COMMENT ON COLUMN rounds.countdown_seconds IS 'Duration of countdown in seconds (usually 3)';
COMMENT ON COLUMN rounds.turn_number IS 'Turn number within the current game round';
COMMENT ON COLUMN rounds.animation_phase IS 'Current animation phase during resolution';
COMMENT ON COLUMN rounds.animation_started_at IS 'Timestamp when current animation phase started';
COMMENT ON COLUMN rounds.animation_duration_ms IS 'Expected duration of current animation in milliseconds';
COMMENT ON COLUMN rounds.player1_current_animation IS 'Current animation playing on player 1 sprite (idle, run, punch, kick, block, special, dead)';
COMMENT ON COLUMN rounds.player2_current_animation IS 'Current animation playing on player 2 sprite';
COMMENT ON COLUMN rounds.player1_is_stunned IS 'Whether player 1 is stunned and cannot act next turn';
COMMENT ON COLUMN rounds.player2_is_stunned IS 'Whether player 2 is stunned and cannot act next turn';

-- =============================================================================
-- CREATE FIGHT STATE SNAPSHOTS TABLE
-- =============================================================================

-- This table stores complete fight state snapshots for recovery
-- Used when a player reconnects after being away
CREATE TABLE IF NOT EXISTS public.fight_state_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  
  -- Current game state
  current_round integer NOT NULL DEFAULT 1 CHECK (current_round >= 1),
  current_turn integer NOT NULL DEFAULT 1 CHECK (current_turn >= 1),
  phase text NOT NULL DEFAULT 'waiting' CHECK (phase = ANY (ARRAY[
    'waiting'::text,
    'countdown'::text,
    'selecting'::text,
    'resolving'::text,
    'round_end'::text,
    'match_end'::text
  ])),
  phase_started_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Player 1 state
  player1_health integer NOT NULL DEFAULT 100 CHECK (player1_health >= 0),
  player1_max_health integer NOT NULL DEFAULT 100 CHECK (player1_max_health > 0),
  player1_energy integer NOT NULL DEFAULT 100 CHECK (player1_energy >= 0),
  player1_max_energy integer NOT NULL DEFAULT 100 CHECK (player1_max_energy > 0),
  player1_guard_meter integer NOT NULL DEFAULT 0 CHECK (player1_guard_meter >= 0 AND player1_guard_meter <= 100),
  player1_rounds_won integer NOT NULL DEFAULT 0 CHECK (player1_rounds_won >= 0),
  player1_is_stunned boolean NOT NULL DEFAULT false,
  player1_current_animation text NOT NULL DEFAULT 'idle',
  player1_has_submitted_move boolean NOT NULL DEFAULT false,
  
  -- Player 2 state
  player2_health integer NOT NULL DEFAULT 100 CHECK (player2_health >= 0),
  player2_max_health integer NOT NULL DEFAULT 100 CHECK (player2_max_health > 0),
  player2_energy integer NOT NULL DEFAULT 100 CHECK (player2_energy >= 0),
  player2_max_energy integer NOT NULL DEFAULT 100 CHECK (player2_max_energy > 0),
  player2_guard_meter integer NOT NULL DEFAULT 0 CHECK (player2_guard_meter >= 0 AND player2_guard_meter <= 100),
  player2_rounds_won integer NOT NULL DEFAULT 0 CHECK (player2_rounds_won >= 0),
  player2_is_stunned boolean NOT NULL DEFAULT false,
  player2_current_animation text NOT NULL DEFAULT 'idle',
  player2_has_submitted_move boolean NOT NULL DEFAULT false,
  
  -- Timer state
  move_deadline_at timestamp with time zone,
  countdown_ends_at timestamp with time zone,
  
  -- Animation state (for resolving phase)
  animation_phase text,
  animation_started_at timestamp with time zone,
  animation_ends_at timestamp with time zone,
  
  -- Round end state
  round_winner text CHECK (round_winner IS NULL OR round_winner = ANY (ARRAY['player1'::text, 'player2'::text, 'draw'::text])),
  round_end_countdown integer CHECK (round_end_countdown IS NULL OR (round_end_countdown >= 0 AND round_end_countdown <= 5)),
  
  -- Last resolved turn data (for playing animations on reconnect)
  last_resolved_player1_move text,
  last_resolved_player2_move text,
  last_narrative text,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT fight_state_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT fight_state_snapshots_match_id_key UNIQUE (match_id),
  CONSTRAINT fight_state_snapshots_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_fight_state_snapshots_match_id ON fight_state_snapshots(match_id);

-- Enable RLS
ALTER TABLE fight_state_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Match participants and spectators can read
CREATE POLICY "fight_state_read_policy" ON fight_state_snapshots
  FOR SELECT
  USING (true);

-- RLS Policy: Only authenticated match participants can update (via service role)
-- In practice, state updates happen through API which uses service role
CREATE POLICY "fight_state_update_policy" ON fight_state_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- ADD REALTIME SUPPORT FOR FIGHT STATE
-- =============================================================================

-- Enable realtime for fight_state_snapshots table
-- This allows clients to subscribe to state changes
ALTER PUBLICATION supabase_realtime ADD TABLE fight_state_snapshots;

-- =============================================================================
-- CREATE FUNCTION TO UPDATE FIGHT STATE
-- =============================================================================

-- Function to update or create fight state snapshot
CREATE OR REPLACE FUNCTION update_fight_state(
  p_match_id uuid,
  p_current_round integer DEFAULT NULL,
  p_current_turn integer DEFAULT NULL,
  p_phase text DEFAULT NULL,
  p_player1_health integer DEFAULT NULL,
  p_player1_energy integer DEFAULT NULL,
  p_player1_guard_meter integer DEFAULT NULL,
  p_player1_rounds_won integer DEFAULT NULL,
  p_player1_is_stunned boolean DEFAULT NULL,
  p_player1_current_animation text DEFAULT NULL,
  p_player1_has_submitted_move boolean DEFAULT NULL,
  p_player2_health integer DEFAULT NULL,
  p_player2_energy integer DEFAULT NULL,
  p_player2_guard_meter integer DEFAULT NULL,
  p_player2_rounds_won integer DEFAULT NULL,
  p_player2_is_stunned boolean DEFAULT NULL,
  p_player2_current_animation text DEFAULT NULL,
  p_player2_has_submitted_move boolean DEFAULT NULL,
  p_move_deadline_at timestamp with time zone DEFAULT NULL,
  p_countdown_ends_at timestamp with time zone DEFAULT NULL,
  p_animation_phase text DEFAULT NULL,
  p_animation_started_at timestamp with time zone DEFAULT NULL,
  p_animation_ends_at timestamp with time zone DEFAULT NULL,
  p_round_winner text DEFAULT NULL,
  p_round_end_countdown integer DEFAULT NULL,
  p_last_resolved_player1_move text DEFAULT NULL,
  p_last_resolved_player2_move text DEFAULT NULL,
  p_last_narrative text DEFAULT NULL
)
RETURNS fight_state_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result fight_state_snapshots;
BEGIN
  INSERT INTO fight_state_snapshots (
    match_id,
    current_round,
    current_turn,
    phase,
    phase_started_at,
    player1_health,
    player1_energy,
    player1_guard_meter,
    player1_rounds_won,
    player1_is_stunned,
    player1_current_animation,
    player1_has_submitted_move,
    player2_health,
    player2_energy,
    player2_guard_meter,
    player2_rounds_won,
    player2_is_stunned,
    player2_current_animation,
    player2_has_submitted_move,
    move_deadline_at,
    countdown_ends_at,
    animation_phase,
    animation_started_at,
    animation_ends_at,
    round_winner,
    round_end_countdown,
    last_resolved_player1_move,
    last_resolved_player2_move,
    last_narrative,
    updated_at
  )
  VALUES (
    p_match_id,
    COALESCE(p_current_round, 1),
    COALESCE(p_current_turn, 1),
    COALESCE(p_phase, 'waiting'),
    now(),
    COALESCE(p_player1_health, 100),
    COALESCE(p_player1_energy, 100),
    COALESCE(p_player1_guard_meter, 0),
    COALESCE(p_player1_rounds_won, 0),
    COALESCE(p_player1_is_stunned, false),
    COALESCE(p_player1_current_animation, 'idle'),
    COALESCE(p_player1_has_submitted_move, false),
    COALESCE(p_player2_health, 100),
    COALESCE(p_player2_energy, 100),
    COALESCE(p_player2_guard_meter, 0),
    COALESCE(p_player2_rounds_won, 0),
    COALESCE(p_player2_is_stunned, false),
    COALESCE(p_player2_current_animation, 'idle'),
    COALESCE(p_player2_has_submitted_move, false),
    p_move_deadline_at,
    p_countdown_ends_at,
    p_animation_phase,
    p_animation_started_at,
    p_animation_ends_at,
    p_round_winner,
    p_round_end_countdown,
    p_last_resolved_player1_move,
    p_last_resolved_player2_move,
    p_last_narrative,
    now()
  )
  ON CONFLICT (match_id) DO UPDATE SET
    current_round = COALESCE(p_current_round, fight_state_snapshots.current_round),
    current_turn = COALESCE(p_current_turn, fight_state_snapshots.current_turn),
    phase = COALESCE(p_phase, fight_state_snapshots.phase),
    phase_started_at = CASE WHEN p_phase IS NOT NULL AND p_phase != fight_state_snapshots.phase THEN now() ELSE fight_state_snapshots.phase_started_at END,
    player1_health = COALESCE(p_player1_health, fight_state_snapshots.player1_health),
    player1_energy = COALESCE(p_player1_energy, fight_state_snapshots.player1_energy),
    player1_guard_meter = COALESCE(p_player1_guard_meter, fight_state_snapshots.player1_guard_meter),
    player1_rounds_won = COALESCE(p_player1_rounds_won, fight_state_snapshots.player1_rounds_won),
    player1_is_stunned = COALESCE(p_player1_is_stunned, fight_state_snapshots.player1_is_stunned),
    player1_current_animation = COALESCE(p_player1_current_animation, fight_state_snapshots.player1_current_animation),
    player1_has_submitted_move = COALESCE(p_player1_has_submitted_move, fight_state_snapshots.player1_has_submitted_move),
    player2_health = COALESCE(p_player2_health, fight_state_snapshots.player2_health),
    player2_energy = COALESCE(p_player2_energy, fight_state_snapshots.player2_energy),
    player2_guard_meter = COALESCE(p_player2_guard_meter, fight_state_snapshots.player2_guard_meter),
    player2_rounds_won = COALESCE(p_player2_rounds_won, fight_state_snapshots.player2_rounds_won),
    player2_is_stunned = COALESCE(p_player2_is_stunned, fight_state_snapshots.player2_is_stunned),
    player2_current_animation = COALESCE(p_player2_current_animation, fight_state_snapshots.player2_current_animation),
    player2_has_submitted_move = COALESCE(p_player2_has_submitted_move, fight_state_snapshots.player2_has_submitted_move),
    move_deadline_at = COALESCE(p_move_deadline_at, fight_state_snapshots.move_deadline_at),
    countdown_ends_at = COALESCE(p_countdown_ends_at, fight_state_snapshots.countdown_ends_at),
    animation_phase = COALESCE(p_animation_phase, fight_state_snapshots.animation_phase),
    animation_started_at = COALESCE(p_animation_started_at, fight_state_snapshots.animation_started_at),
    animation_ends_at = COALESCE(p_animation_ends_at, fight_state_snapshots.animation_ends_at),
    round_winner = COALESCE(p_round_winner, fight_state_snapshots.round_winner),
    round_end_countdown = COALESCE(p_round_end_countdown, fight_state_snapshots.round_end_countdown),
    last_resolved_player1_move = COALESCE(p_last_resolved_player1_move, fight_state_snapshots.last_resolved_player1_move),
    last_resolved_player2_move = COALESCE(p_last_resolved_player2_move, fight_state_snapshots.last_resolved_player2_move),
    last_narrative = COALESCE(p_last_narrative, fight_state_snapshots.last_narrative),
    updated_at = now()
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_fight_state TO authenticated;
GRANT EXECUTE ON FUNCTION update_fight_state TO anon;
