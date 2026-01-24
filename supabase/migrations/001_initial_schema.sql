-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievement_statistics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL UNIQUE,
  total_achievements integer NOT NULL DEFAULT 0 CHECK (total_achievements >= 0),
  unlocked_achievements integer NOT NULL DEFAULT 0 CHECK (unlocked_achievements >= 0),
  total_xp_earned integer NOT NULL DEFAULT 0 CHECK (total_xp_earned >= 0),
  total_currency_earned integer NOT NULL DEFAULT 0 CHECK (total_currency_earned >= 0),
  combat_unlocked integer NOT NULL DEFAULT 0 CHECK (combat_unlocked >= 0),
  progression_unlocked integer NOT NULL DEFAULT 0 CHECK (progression_unlocked >= 0),
  social_unlocked integer NOT NULL DEFAULT 0 CHECK (social_unlocked >= 0),
  collection_unlocked integer NOT NULL DEFAULT 0 CHECK (collection_unlocked >= 0),
  mastery_unlocked integer NOT NULL DEFAULT 0 CHECK (mastery_unlocked >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT achievement_statistics_pkey PRIMARY KEY (id),
  CONSTRAINT achievement_statistics_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.achievements (
  id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['combat'::text, 'progression'::text, 'social'::text, 'collection'::text, 'mastery'::text])),
  tier text NOT NULL CHECK (tier = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text, 'diamond'::text])),
  icon_url text,
  xp_reward integer NOT NULL CHECK (xp_reward >= 0),
  currency_reward integer NOT NULL CHECK (currency_reward >= 0),
  badge_reward uuid,
  requirement jsonb NOT NULL,
  is_secret boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_badge_reward_fkey FOREIGN KEY (badge_reward) REFERENCES public.cosmetic_items(id)
);
CREATE TABLE public.battle_pass_seasons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  tier_count integer NOT NULL DEFAULT 50 CHECK (tier_count > 0 AND tier_count <= 100),
  is_active boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT battle_pass_seasons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.battle_pass_tiers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  season_id uuid NOT NULL,
  tier_number integer NOT NULL CHECK (tier_number > 0 AND tier_number <= 100),
  xp_required integer NOT NULL CHECK (xp_required >= 0),
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT battle_pass_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT battle_pass_tiers_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.battle_pass_seasons(id)
);
CREATE TABLE public.bets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pool_id uuid NOT NULL,
  bettor_address text NOT NULL,
  bet_on text NOT NULL CHECK (bet_on = ANY (ARRAY['player1'::text, 'player2'::text])),
  amount bigint NOT NULL CHECK (amount >= 100000000),
  fee_paid bigint NOT NULL DEFAULT 0,
  net_amount bigint NOT NULL DEFAULT 0,
  tx_id text NOT NULL UNIQUE,
  payout_amount bigint,
  payout_tx_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'won'::text, 'lost'::text, 'refunded'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT bets_pkey PRIMARY KEY (id),
  CONSTRAINT bets_pool_fkey FOREIGN KEY (pool_id) REFERENCES public.betting_pools(id),
  CONSTRAINT bets_bettor_fkey FOREIGN KEY (bettor_address) REFERENCES public.players(address)
);
CREATE TABLE public.betting_pools (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL UNIQUE,
  player1_total bigint NOT NULL DEFAULT 0,
  player2_total bigint NOT NULL DEFAULT 0,
  total_pool bigint NOT NULL DEFAULT 0,
  total_fees bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'locked'::text, 'resolved'::text, 'refunded'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_at timestamp with time zone,
  resolved_at timestamp with time zone,
  winner text CHECK (winner IS NULL OR (winner = ANY (ARRAY['player1'::text, 'player2'::text]))),
  CONSTRAINT betting_pools_pkey PRIMARY KEY (id),
  CONSTRAINT betting_pools_match_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);
CREATE TABLE public.blockchain_anchors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  anchor_type text NOT NULL CHECK (anchor_type = ANY (ARRAY['leaderboard_rank'::text, 'prestige_level'::text, 'achievement_unlock'::text, 'season_completion'::text])),
  data_hash text NOT NULL CHECK (data_hash ~ '^[a-f0-9]{64}$'::text),
  data_payload jsonb NOT NULL,
  transaction_id text UNIQUE,
  block_hash text,
  block_height bigint,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'broadcasting'::text, 'confirmed'::text, 'failed'::text])),
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blockchain_anchors_pkey PRIMARY KEY (id),
  CONSTRAINT blockchain_anchors_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.bot_bets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pool_id uuid NOT NULL,
  bettor_address text NOT NULL,
  bet_on text NOT NULL CHECK (bet_on = ANY (ARRAY['bot1'::text, 'bot2'::text])),
  amount bigint NOT NULL CHECK (amount >= 100000000),
  fee_paid bigint NOT NULL DEFAULT 0,
  net_amount bigint NOT NULL DEFAULT 0,
  tx_id text NOT NULL UNIQUE,
  payout_amount bigint,
  payout_tx_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'won'::text, 'lost'::text, 'refunded'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  paid_at timestamp with time zone,
  CONSTRAINT bot_bets_pkey PRIMARY KEY (id),
  CONSTRAINT bot_bets_pool_fkey FOREIGN KEY (pool_id) REFERENCES public.bot_betting_pools(id),
  CONSTRAINT bot_bets_bettor_fkey FOREIGN KEY (bettor_address) REFERENCES public.players(address)
);
CREATE TABLE public.bot_betting_pools (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bot_match_id text NOT NULL UNIQUE,
  bot1_character_id text NOT NULL,
  bot2_character_id text NOT NULL,
  bot1_total bigint NOT NULL DEFAULT 0 CHECK (bot1_total >= 0),
  bot2_total bigint NOT NULL DEFAULT 0 CHECK (bot2_total >= 0),
  total_pool bigint NOT NULL DEFAULT 0 CHECK (total_pool >= 0),
  total_fees bigint NOT NULL DEFAULT 0 CHECK (total_fees >= 0),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'locked'::text, 'resolved'::text, 'refunded'::text])),
  winner text CHECK (winner IS NULL OR (winner = ANY (ARRAY['bot1'::text, 'bot2'::text]))),
  betting_closes_at_turn integer NOT NULL DEFAULT 3 CHECK (betting_closes_at_turn > 0),
  match_created_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bot_betting_pools_pkey PRIMARY KEY (id),
  CONSTRAINT bot_betting_pools_bot_match_fkey FOREIGN KEY (bot_match_id) REFERENCES public.bot_matches(id)
);
CREATE TABLE public.bot_matches (
  id text NOT NULL,
  bot1_character_id text NOT NULL,
  bot2_character_id text NOT NULL,
  bot1_name text NOT NULL,
  bot2_name text NOT NULL,
  seed text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text])),
  turns jsonb NOT NULL,
  total_turns integer NOT NULL CHECK (total_turns > 0),
  match_winner text CHECK (match_winner IS NULL OR (match_winner = ANY (ARRAY['player1'::text, 'player2'::text]))),
  bot1_rounds_won integer NOT NULL DEFAULT 0,
  bot2_rounds_won integer NOT NULL DEFAULT 0,
  turn_duration_ms integer NOT NULL DEFAULT 2500,
  bot1_max_hp integer NOT NULL,
  bot2_max_hp integer NOT NULL,
  bot1_max_energy integer NOT NULL,
  bot2_max_energy integer NOT NULL,
  betting_closes_at_turn integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bot_matches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.characters (
  id text NOT NULL,
  name text NOT NULL,
  theme text NOT NULL,
  portrait_url text NOT NULL,
  sprite_config jsonb NOT NULL,
  CONSTRAINT characters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cosmetic_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category = ANY (ARRAY['character'::text, 'sticker'::text, 'victory_pose'::text, 'profile_badge'::text, 'profile_frame'::text])),
  rarity text NOT NULL CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text, 'prestige'::text])),
  character_id text,
  price integer NOT NULL CHECK (price >= 0),
  is_premium boolean NOT NULL DEFAULT false,
  is_limited boolean NOT NULL DEFAULT false,
  thumbnail_url text,
  preview_url text,
  asset_path text,
  unlock_requirement text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  release_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cosmetic_items_pkey PRIMARY KEY (id),
  CONSTRAINT cosmetic_items_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.currency_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['earn'::text, 'spend'::text])),
  source text NOT NULL,
  balance_before integer NOT NULL CHECK (balance_before >= 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT currency_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT currency_transactions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.daily_quests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  template_id text NOT NULL,
  assigned_date date NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  current_progress integer NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
  target_progress integer NOT NULL CHECK (target_progress > 0),
  is_completed boolean NOT NULL DEFAULT false,
  is_claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_quests_pkey PRIMARY KEY (id),
  CONSTRAINT daily_quests_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.distribution_payouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  distribution_id uuid NOT NULL,
  player_address text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  leaderboard_type text NOT NULL CHECK (leaderboard_type = ANY (ARRAY['elo'::text, 'survival'::text])),
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 10),
  tx_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'confirmed'::text, 'failed'::text])),
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  CONSTRAINT distribution_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT distribution_payouts_distribution_id_fkey FOREIGN KEY (distribution_id) REFERENCES public.treasury_distributions(id),
  CONSTRAINT distribution_payouts_player_address_fkey FOREIGN KEY (player_address) REFERENCES public.players(address)
);
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_code text UNIQUE CHECK (room_code IS NULL OR room_code ~ '^[A-Z0-9]{6}$'::text),
  player1_address text NOT NULL,
  player2_address text,
  player1_character_id text,
  player2_character_id text,
  format text NOT NULL DEFAULT 'best_of_3'::text CHECK (format = ANY (ARRAY['best_of_3'::text, 'best_of_5'::text])),
  status text NOT NULL DEFAULT 'waiting'::text CHECK (status = ANY (ARRAY['waiting'::text, 'character_select'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  winner_address text,
  player1_rounds_won integer NOT NULL DEFAULT 0,
  player2_rounds_won integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  selection_deadline_at timestamp with time zone,
  player1_disconnected_at timestamp with time zone,
  player2_disconnected_at timestamp with time zone,
  disconnect_timeout_seconds integer DEFAULT 30,
  stake_amount bigint CHECK (stake_amount IS NULL OR stake_amount >= 100000000),
  player1_stake_tx_id text,
  player2_stake_tx_id text,
  stakes_confirmed boolean DEFAULT false,
  stake_deadline_at timestamp with time zone,
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_player1_address_fkey FOREIGN KEY (player1_address) REFERENCES public.players(address),
  CONSTRAINT matches_player2_address_fkey FOREIGN KEY (player2_address) REFERENCES public.players(address),
  CONSTRAINT matches_player1_character_id_fkey FOREIGN KEY (player1_character_id) REFERENCES public.characters(id),
  CONSTRAINT matches_player2_character_id_fkey FOREIGN KEY (player2_character_id) REFERENCES public.characters(id),
  CONSTRAINT matches_winner_address_fkey FOREIGN KEY (winner_address) REFERENCES public.players(address)
);
CREATE TABLE public.matchmaking_queue (
  address text NOT NULL,
  rating integer NOT NULL DEFAULT 1000,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'searching'::text CHECK (status = ANY (ARRAY['searching'::text, 'matched'::text])),
  matched_with text,
  CONSTRAINT matchmaking_queue_pkey PRIMARY KEY (address),
  CONSTRAINT matchmaking_queue_address_fkey FOREIGN KEY (address) REFERENCES public.players(address),
  CONSTRAINT matchmaking_queue_matched_with_fkey FOREIGN KEY (matched_with) REFERENCES public.players(address)
);
CREATE TABLE public.moves (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  round_id uuid NOT NULL,
  player_address text NOT NULL,
  move_type text NOT NULL CHECK (move_type = ANY (ARRAY['punch'::text, 'kick'::text, 'block'::text, 'special'::text])),
  tx_id text,
  tx_confirmed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT moves_pkey PRIMARY KEY (id),
  CONSTRAINT moves_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id),
  CONSTRAINT moves_player_address_fkey FOREIGN KEY (player_address) REFERENCES public.players(address)
);
CREATE TABLE public.player_achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  achievement_id text NOT NULL,
  current_progress integer NOT NULL DEFAULT 0 CHECK (current_progress >= 0),
  target_progress integer NOT NULL CHECK (target_progress > 0),
  is_unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT player_achievements_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT player_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.player_currency (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL UNIQUE,
  clash_shards integer NOT NULL DEFAULT 0 CHECK (clash_shards >= 0),
  total_earned integer NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_spent integer NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_currency_pkey PRIMARY KEY (id),
  CONSTRAINT player_currency_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.player_inventory (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  cosmetic_id uuid NOT NULL,
  acquired_date timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source = ANY (ARRAY['battle_pass'::text, 'shop_purchase'::text, 'achievement'::text, 'prestige'::text, 'event'::text])),
  is_equipped boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT player_inventory_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT player_inventory_cosmetic_id_fkey FOREIGN KEY (cosmetic_id) REFERENCES public.cosmetic_items(id)
);
CREATE TABLE public.player_loadouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  character_id text NOT NULL,
  equipped_skin uuid,
  equipped_emote uuid,
  equipped_victory_pose uuid,
  equipped_badge uuid,
  equipped_frame uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_loadouts_pkey PRIMARY KEY (id),
  CONSTRAINT player_loadouts_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT player_loadouts_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT player_loadouts_equipped_skin_fkey FOREIGN KEY (equipped_skin) REFERENCES public.cosmetic_items(id),
  CONSTRAINT player_loadouts_equipped_emote_fkey FOREIGN KEY (equipped_emote) REFERENCES public.cosmetic_items(id),
  CONSTRAINT player_loadouts_equipped_victory_pose_fkey FOREIGN KEY (equipped_victory_pose) REFERENCES public.cosmetic_items(id),
  CONSTRAINT player_loadouts_equipped_badge_fkey FOREIGN KEY (equipped_badge) REFERENCES public.cosmetic_items(id),
  CONSTRAINT player_loadouts_equipped_frame_fkey FOREIGN KEY (equipped_frame) REFERENCES public.cosmetic_items(id)
);
CREATE TABLE public.player_progression (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  season_id uuid NOT NULL,
  current_tier integer NOT NULL DEFAULT 1 CHECK (current_tier > 0),
  current_xp integer NOT NULL DEFAULT 0 CHECK (current_xp >= 0),
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  prestige_level integer NOT NULL DEFAULT 0 CHECK (prestige_level >= 0),
  prestige_xp_multiplier numeric NOT NULL DEFAULT 1.00 CHECK (prestige_xp_multiplier >= 1.00),
  prestige_currency_multiplier numeric NOT NULL DEFAULT 1.00 CHECK (prestige_currency_multiplier >= 1.00),
  last_prestige_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  claimed_tiers ARRAY DEFAULT '{}'::integer[],
  CONSTRAINT player_progression_pkey PRIMARY KEY (id),
  CONSTRAINT player_progression_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT player_progression_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.battle_pass_seasons(id)
);
CREATE TABLE public.players (
  address text NOT NULL,
  display_name text CHECK (display_name IS NULL OR length(display_name) <= 32 AND display_name ~ '^[a-zA-Z0-9_]+$'::text),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses integer NOT NULL DEFAULT 0 CHECK (losses >= 0),
  rating integer NOT NULL DEFAULT 1000 CHECK (rating >= 100 AND rating <= 3000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  avatar_url text,
  CONSTRAINT players_pkey PRIMARY KEY (address)
);
CREATE TABLE public.quest_statistics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL UNIQUE,
  total_quests_completed integer NOT NULL DEFAULT 0 CHECK (total_quests_completed >= 0),
  total_quests_claimed integer NOT NULL DEFAULT 0 CHECK (total_quests_claimed >= 0),
  total_xp_earned integer NOT NULL DEFAULT 0 CHECK (total_xp_earned >= 0),
  total_currency_earned integer NOT NULL DEFAULT 0 CHECK (total_currency_earned >= 0),
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_quest_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quest_statistics_pkey PRIMARY KEY (id),
  CONSTRAINT quest_statistics_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.quest_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  objective_type text NOT NULL CHECK (objective_type = ANY (ARRAY['win_matches'::text, 'play_matches'::text, 'deal_damage'::text, 'defeat_opponents'::text, 'use_character'::text, 'use_ability'::text, 'execute_combo'::text, 'win_streak'::text, 'survival_waves'::text, 'combo_challenge_stars'::text])),
  target_value integer NOT NULL CHECK (target_value > 0),
  difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  xp_reward integer NOT NULL CHECK (xp_reward > 0),
  currency_reward integer NOT NULL CHECK (currency_reward >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quest_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rounds (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL,
  round_number integer NOT NULL CHECK (round_number > 0),
  player1_move text CHECK (player1_move IS NULL OR (player1_move = ANY (ARRAY['punch'::text, 'kick'::text, 'block'::text, 'special'::text]))),
  player2_move text CHECK (player2_move IS NULL OR (player2_move = ANY (ARRAY['punch'::text, 'kick'::text, 'block'::text, 'special'::text]))),
  player1_damage_dealt integer CHECK (player1_damage_dealt IS NULL OR player1_damage_dealt >= 0),
  player2_damage_dealt integer CHECK (player2_damage_dealt IS NULL OR player2_damage_dealt >= 0),
  player1_health_after integer CHECK (player1_health_after IS NULL OR player1_health_after >= 0 AND player1_health_after <= 100),
  player2_health_after integer CHECK (player2_health_after IS NULL OR player2_health_after >= 0 AND player2_health_after <= 100),
  winner_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  player1_rejected boolean DEFAULT false,
  player2_rejected boolean DEFAULT false,
  move_deadline_at timestamp with time zone,
  CONSTRAINT rounds_pkey PRIMARY KEY (id),
  CONSTRAINT rounds_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id),
  CONSTRAINT rounds_winner_address_fkey FOREIGN KEY (winner_address) REFERENCES public.players(address)
);
CREATE TABLE public.shop_purchases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  cosmetic_id uuid NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  currency_type text NOT NULL DEFAULT 'clash_shards'::text,
  purchase_date timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT true,
  error_message text,
  CONSTRAINT shop_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT shop_purchases_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT shop_purchases_cosmetic_id_fkey FOREIGN KEY (cosmetic_id) REFERENCES public.cosmetic_items(id)
);
CREATE TABLE public.shop_rotations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  featured_items ARRAY NOT NULL DEFAULT ARRAY[]::uuid[],
  discounted_items ARRAY NOT NULL DEFAULT ARRAY[]::uuid[],
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shop_rotations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.survival_daily_plays (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  play_date date NOT NULL DEFAULT CURRENT_DATE,
  plays_count integer NOT NULL DEFAULT 0 CHECK (plays_count >= 0 AND plays_count <= 3),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT survival_daily_plays_pkey PRIMARY KEY (id),
  CONSTRAINT survival_daily_plays_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.survival_runs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  character_id text NOT NULL,
  waves_cleared integer NOT NULL DEFAULT 0 CHECK (waves_cleared >= 0 AND waves_cleared <= 20),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  shards_earned integer NOT NULL DEFAULT 0 CHECK (shards_earned >= 0),
  final_health integer CHECK (final_health IS NULL OR final_health >= 0 AND final_health <= 100),
  is_victory boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  CONSTRAINT survival_runs_pkey PRIMARY KEY (id),
  CONSTRAINT survival_runs_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT survival_runs_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.treasury_balance_snapshots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  balance bigint NOT NULL CHECK (balance >= 0),
  network text NOT NULL CHECK (network = ANY (ARRAY['mainnet'::text, 'testnet'::text])),
  snapshot_type text NOT NULL CHECK (snapshot_type = ANY (ARRAY['daily'::text, 'pre_distribution'::text, 'post_distribution'::text, 'manual'::text])),
  distribution_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT treasury_balance_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT treasury_balance_snapshots_distribution_id_fkey FOREIGN KEY (distribution_id) REFERENCES public.treasury_distributions(id)
);
CREATE TABLE public.treasury_deposits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_address text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  tx_id text NOT NULL UNIQUE,
  source text NOT NULL CHECK (source = ANY (ARRAY['betting'::text, 'shop'::text, 'stake'::text, 'other'::text])),
  network text NOT NULL CHECK (network = ANY (ARRAY['mainnet'::text, 'testnet'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text])),
  block_height bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  CONSTRAINT treasury_deposits_pkey PRIMARY KEY (id),
  CONSTRAINT treasury_deposits_player_address_fkey FOREIGN KEY (player_address) REFERENCES public.players(address)
);
CREATE TABLE public.treasury_distributions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  distribution_week date NOT NULL,
  total_amount bigint NOT NULL CHECK (total_amount >= 0),
  elo_pool_amount bigint NOT NULL CHECK (elo_pool_amount >= 0),
  survival_pool_amount bigint NOT NULL CHECK (survival_pool_amount >= 0),
  reserve_amount bigint NOT NULL CHECK (reserve_amount >= 0),
  network text NOT NULL CHECK (network = ANY (ARRAY['mainnet'::text, 'testnet'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  elo_payouts_count integer NOT NULL DEFAULT 0,
  survival_payouts_count integer NOT NULL DEFAULT 0,
  failed_payouts_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT treasury_distributions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verification_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  anchor_id uuid NOT NULL UNIQUE,
  badge_type text NOT NULL CHECK (badge_type = ANY (ARRAY['leaderboard_rank'::text, 'prestige_level'::text, 'achievement_unlock'::text, 'season_completion'::text])),
  transaction_id text NOT NULL,
  block_height bigint NOT NULL CHECK (block_height > 0),
  explorer_url text NOT NULL,
  verified_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT verification_badges_pkey PRIMARY KEY (id),
  CONSTRAINT verification_badges_anchor_id_fkey FOREIGN KEY (anchor_id) REFERENCES public.blockchain_anchors(id),
  CONSTRAINT verification_badges_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address)
);
CREATE TABLE public.xp_awards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  player_id text NOT NULL,
  season_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  source text NOT NULL,
  source_id uuid,
  multiplier numeric NOT NULL DEFAULT 1.00,
  final_amount integer NOT NULL CHECK (final_amount > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_awards_pkey PRIMARY KEY (id),
  CONSTRAINT xp_awards_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(address),
  CONSTRAINT xp_awards_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.battle_pass_seasons(id)
);