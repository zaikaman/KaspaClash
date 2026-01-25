-- Add energy and guard meter columns to rounds table
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS player1_energy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS player2_energy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS player1_guard_meter INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS player2_guard_meter INTEGER DEFAULT 0;

-- Comments for clarity
COMMENT ON COLUMN rounds.player1_energy IS 'Energy level of player 1 after the round';
COMMENT ON COLUMN rounds.player2_energy IS 'Energy level of player 2 after the round';
COMMENT ON COLUMN rounds.player1_guard_meter IS 'Guard meter of player 1 after the round';
COMMENT ON COLUMN rounds.player2_guard_meter IS 'Guard meter of player 2 after the round';
