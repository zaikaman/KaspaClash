-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.characters (
  id text NOT NULL,
  name text NOT NULL,
  theme text NOT NULL,
  portrait_url text NOT NULL,
  sprite_config jsonb NOT NULL,
  CONSTRAINT characters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_code text UNIQUE CHECK (room_code IS NULL OR room_code ~ '^[A-Z0-9]{6}$'::text),
  player1_address text NOT NULL,
  player2_address text,
  player1_character_id text,
  player2_character_id text,
  format text NOT NULL DEFAULT 'best_of_3'::text CHECK (format = ANY (ARRAY['best_of_3'::text, 'best_of_5'::text])),
  status text NOT NULL DEFAULT 'waiting'::text CHECK (status = ANY (ARRAY['waiting'::text, 'character_select'::text, 'in_progress'::text, 'completed'::text])),
  winner_address text,
  player1_rounds_won integer NOT NULL DEFAULT 0,
  player2_rounds_won integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  selection_deadline_at timestamp with time zone,
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
CREATE TABLE public.players (
  address text NOT NULL,
  display_name text CHECK (display_name IS NULL OR length(display_name) <= 32 AND display_name ~ '^[a-zA-Z0-9_]+$'::text),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses integer NOT NULL DEFAULT 0 CHECK (losses >= 0),
  rating integer NOT NULL DEFAULT 1000 CHECK (rating >= 100 AND rating <= 3000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT players_pkey PRIMARY KEY (address)
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
  CONSTRAINT rounds_pkey PRIMARY KEY (id),
  CONSTRAINT rounds_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id),
  CONSTRAINT rounds_winner_address_fkey FOREIGN KEY (winner_address) REFERENCES public.players(address)
);