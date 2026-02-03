-- Seed Cosmetic Items and NEW Characters (Updated Paths & Stickers)
-- Run this in Supabase SQL Editor to populate the shop and characters

-- Optional: Clear existing items (uncomment if needed)
-- DELETE FROM public.cosmetic_items;
-- DELETE FROM public.characters WHERE id NOT IN ('cyber-ninja', 'block-bruiser', 'dag-warrior', 'hash-hunter');

-- FIX CONSTRAINTS BEFORE SEEDING (Run this block first if you get constraint errors)
-- 1. Update allowed categories to include 'sticker'
ALTER TABLE public.cosmetic_items DROP CONSTRAINT IF EXISTS cosmetic_items_category_check;
ALTER TABLE public.cosmetic_items ADD CONSTRAINT cosmetic_items_category_check 
    CHECK (category = ANY (ARRAY['character'::text, 'sticker'::text, 'victory_pose'::text, 'profile_badge'::text, 'profile_frame'::text]));

-- 2. Update character_id requirements (Allow stickers to have character_id)
-- OLD Constraint likely prevented 'sticker' from having character_id
ALTER TABLE public.cosmetic_items DROP CONSTRAINT IF EXISTS character_specific_check;
ALTER TABLE public.cosmetic_items ADD CONSTRAINT character_specific_check 
    CHECK (
        (category = ANY (ARRAY['character'::text, 'sticker'::text, 'victory_pose'::text]) AND character_id IS NOT NULL) 
        OR 
        (category = ANY (ARRAY['profile_badge'::text, 'profile_frame'::text]) AND character_id IS NULL)
    );

-- Create unique index on name to support upsert for items
CREATE UNIQUE INDEX IF NOT EXISTS cosmetic_items_name_idx ON public.cosmetic_items (name);

-- 1. Insert NEW Unique Characters
INSERT INTO public.characters (id, name, theme, portrait_url, sprite_config)
VALUES
    -- SPEED ARCHETYPE (Base: cyber-ninja)
    ('neon-wraith', 'Neon Wraith', 'speed', '/characters/neon-wraith/portrait.webp', '{"texture": "neon-wraith", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('kitsune-09', 'Kitsune-09', 'speed', '/characters/kitsune-09/portrait.webp', '{"texture": "kitsune-09", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('viperblade', 'Viperblade', 'speed', '/characters/viperblade/portrait.webp', '{"texture": "viperblade", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('chrono-drifter', 'Chrono-Drifter', 'speed', '/characters/chrono-drifter/portrait.webp', '{"texture": "chrono-drifter", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),

    -- TANK ARCHETYPE (Base: block-bruiser)
    ('heavy-loader', 'Heavy-Loader', 'tank', '/characters/heavy-loader/portrait.webp', '{"texture": "heavy-loader", "frameWidth": 144, "frameHeight": 144, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('gene-smasher', 'Gene-Smasher', 'tank', '/characters/gene-smasher/portrait.webp', '{"texture": "gene-smasher", "frameWidth": 144, "frameHeight": 144, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('bastion-hulk', 'Bastion Hulk', 'tank', '/characters/bastion-hulk/portrait.webp', '{"texture": "bastion-hulk", "frameWidth": 144, "frameHeight": 144, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('scrap-goliath', 'Scrap-Goliath', 'tank', '/characters/scrap-goliath/portrait.webp', '{"texture": "scrap-goliath", "frameWidth": 144, "frameHeight": 144, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),

    -- TECH ARCHETYPE (Base: dag-warrior)
    ('cyber-paladin', 'Cyber-Paladin', 'tech', '/characters/cyber-paladin/portrait.webp', '{"texture": "cyber-paladin", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('nano-brawler', 'Nano-Brawler', 'tech', '/characters/nano-brawler/portrait.webp', '{"texture": "nano-brawler", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('technomancer', 'Technomancer', 'tech', '/characters/technomancer/portrait.webp', '{"texture": "technomancer", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('aeon-guard', 'Aeon Guard', 'tech', '/characters/aeon-guard/portrait.webp', '{"texture": "aeon-guard", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),

    -- PRECISION ARCHETYPE (Base: hash-hunter)
    ('razor-bot-7', 'Razor-Bot 7', 'precision', '/characters/razor-bot-7/portrait.webp', '{"texture": "razor-bot-7", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('sonic-striker', 'Sonic-Striker', 'precision', '/characters/sonic-striker/portrait.webp', '{"texture": "sonic-striker", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('prism-duelist', 'Prism-Duelist', 'precision', '/characters/prism-duelist/portrait.webp', '{"texture": "prism-duelist", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}'),
    ('void-reaper', 'Void-Reaper', 'precision', '/characters/void-reaper/portrait.webp', '{"texture": "void-reaper", "frameWidth": 128, "frameHeight": 128, "animations": {"idle": [0, 1, 2, 3], "run": [8, 9, 10, 11], "attack": [16, 17, 18, 19]}}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    theme = EXCLUDED.theme,
    portrait_url = EXCLUDED.portrait_url,
    sprite_config = EXCLUDED.sprite_config;

-- 2. Insert Cosmetic Items (Linking to valid character IDs)
INSERT INTO public.cosmetic_items (name, description, category, rarity, character_id, price, is_premium, is_limited, thumbnail_url, preview_url, tags)
VALUES
    -- Characters (Category 'character')
    ('Neon Wraith', 'The stealthy variant of the cyber ninja, focused on speed.', 'character', 'common', 'neon-wraith', 150, false, false, '/characters/neon-wraith/portrait.webp', '/characters/neon-wraith/portrait.webp', ARRAY['speed', 'glitch', 'glass_cannon']),
    ('Kitsune-09', 'Bio-augmented cyborg with nine holographic tails.', 'character', 'rare', 'kitsune-09', 800, false, false, '/characters/kitsune-09/portrait.webp', '/characters/kitsune-09/portrait.webp', ARRAY['speed', 'fox', 'evasive']),
    ('Viperblade', 'A toxic biomech with mantis-style blades.', 'character', 'epic', 'viperblade', 1500, false, false, '/characters/viperblade/portrait.webp', '/characters/viperblade/portrait.webp', ARRAY['speed', 'toxic', 'balanced']),
    ('Chrono-Drifter', 'A time-displaced ronin wielding a frozen blade.', 'character', 'legendary', 'chrono-drifter', 2500, false, false, '/characters/chrono-drifter/portrait.webp', '/characters/chrono-drifter/portrait.webp', ARRAY['speed', 'time', 'tanky']),

    ('Heavy-Loader', 'Industrial mech with hydraulic crushing claws. Massive health pool.', 'character', 'common', 'heavy-loader', 150, false, false, '/characters/heavy-loader/portrait.webp', '/characters/heavy-loader/portrait.webp', ARRAY['tank', 'mech', 'super_tank']),
    ('Gene-Smasher', 'Experimental super-soldier using raw brute force.', 'character', 'rare', 'gene-smasher', 800, false, false, '/characters/gene-smasher/portrait.webp', '/characters/gene-smasher/portrait.webp', ARRAY['tank', 'mutant', 'berzerker']),
    ('Bastion Hulk', 'Geometric golem with floating block fists.', 'character', 'epic', 'bastion-hulk', 1500, false, false, '/characters/bastion-hulk/portrait.webp', '/characters/bastion-hulk/portrait.webp', ARRAY['tank', 'shield', 'energy']),
    ('Scrap-Goliath', 'A massive golem animated from urban debris.', 'character', 'legendary', 'scrap-goliath', 2500, false, false, '/characters/scrap-goliath/portrait.webp', '/characters/scrap-goliath/portrait.webp', ARRAY['tank', 'junk', 'regen']),

    ('Cyber-Paladin', 'An upgraded paladin model with enhanced shielding.', 'character', 'common', 'cyber-paladin', 150, false, false, '/characters/cyber-paladin/portrait.webp', '/characters/cyber-paladin/portrait.webp', ARRAY['tech', 'knight', 'defensive']),
    ('Nano-Brawler', 'Street fighter utilizing nanobot-enhanced punches.', 'character', 'rare', 'nano-brawler', 800, false, false, '/characters/nano-brawler/portrait.webp', '/characters/nano-brawler/portrait.webp', ARRAY['tech', 'street', 'aggressive']),
    ('Technomancer', 'Sorcerer manipulating high-voltage cables as whips.', 'character', 'epic', 'technomancer', 1500, false, false, '/characters/technomancer/portrait.webp', '/characters/technomancer/portrait.webp', ARRAY['tech', 'magic', 'special']),
    ('Aeon Guard', 'Cosmic guardian wielding a gravity-bending staff.', 'character', 'legendary', 'aeon-guard', 2500, false, false, '/characters/aeon-guard/portrait.webp', '/characters/aeon-guard/portrait.webp', ARRAY['tech', 'cosmic', 'elite']),

    ('Razor-Bot 7', 'A newer model of the Hunter series, faster but more fragile.', 'character', 'common', 'razor-bot-7', 150, false, false, '/characters/razor-bot-7/portrait.webp', '/characters/razor-bot-7/portrait.webp', ARRAY['precision', 'whip', 'critical']),
    ('Sonic-Striker', 'Fighter using massive subwoofer-gauntlets.', 'character', 'rare', 'sonic-striker', 800, false, false, '/characters/sonic-striker/portrait.webp', '/characters/sonic-striker/portrait.webp', ARRAY['precision', 'gauntlets', 'heavy']),
    ('Prism-Duelist', 'Fencer with a rapier of focused light.', 'character', 'epic', 'prism-duelist', 1500, false, false, '/characters/prism-duelist/portrait.webp', '/characters/prism-duelist/portrait.webp', ARRAY['precision', 'fencer', 'counter']),
    ('Void-Reaper', 'Alien predator wielding dark matter scythes.', 'character', 'legendary', 'void-reaper', 2500, false, false, '/characters/void-reaper/portrait.webp', '/characters/void-reaper/portrait.webp', ARRAY['precision', 'void', 'glass']),

    -- Stickers (12 Found in public/stickers)
    -- Speed (Neon Wraith)
    ('GG Glitch', 'Good game, well played.', 'sticker', 'common', 'neon-wraith', 300, false, false, '/stickers/gg_glitch.webp', '/stickers/gg_glitch.webp', ARRAY['gg', 'glitch', 'gamer']),
    ('EZ Peazy', 'That was easy.', 'sticker', 'rare', 'neon-wraith', 500, false, false, '/stickers/ez_peazy.webp', '/stickers/ez_peazy.webp', ARRAY['ez', 'cool', 'taunt']),
    ('You Suck', 'A bit toxic, isn''t it?', 'sticker', 'epic', 'neon-wraith', 800, false, false, '/stickers/you-suck.webp', '/stickers/you-suck.webp', ARRAY['toxic', 'text', 'taunt']),

    -- Tank (Heavy-Loader)
    ('Angry', 'Rage mode activated.', 'sticker', 'common', 'heavy-loader', 300, false, false, '/stickers/angry.webp', '/stickers/angry.webp', ARRAY['angry', 'mad', 'rage']),
    ('Mad', 'Seriously displeased.', 'sticker', 'rare', 'heavy-loader', 500, false, false, '/stickers/mad.webp', '/stickers/mad.webp', ARRAY['mad', 'furious', 'face']),
    ('Scared', 'Tactical retreat!', 'sticker', 'epic', 'heavy-loader', 800, false, false, '/stickers/scared.webp', '/stickers/scared.webp', ARRAY['scared', 'fear', 'face']),

    -- Tech (Cyber-Paladin)
    ('Like', 'Thumbs up approved.', 'sticker', 'common', 'cyber-paladin', 300, false, false, '/stickers/like.webp', '/stickers/like.webp', ARRAY['like', 'thumbsup', 'approve']),
    ('Love', 'Show some love.', 'sticker', 'rare', 'cyber-paladin', 500, false, false, '/stickers/love.webp', '/stickers/love.webp', ARRAY['love', 'heart', 'face']),
    ('Question', 'What??', 'sticker', 'epic', 'cyber-paladin', 800, false, false, '/stickers/question.webp', '/stickers/question.webp', ARRAY['question', 'confused', 'query']),

    -- Precision (Razor-Bot 7)
    ('Crying', 'Tears of defeat.', 'sticker', 'common', 'razor-bot-7', 300, false, false, '/stickers/crying.webp', '/stickers/crying.webp', ARRAY['crying', 'sad', 'tears']),
    ('Sad', 'Feeling down.', 'sticker', 'rare', 'razor-bot-7', 500, false, false, '/stickers/sad.webp', '/stickers/sad.webp', ARRAY['sad', 'unhappy', 'face']),
    ('Confused', 'Does not compute.', 'sticker', 'epic', 'razor-bot-7', 800, false, false, '/stickers/question-2.webp', '/stickers/question-2.webp', ARRAY['confused', 'wut', 'face'])

    -- Removed: Victory Poses, Profile Badges, Profile Frames as requested

ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    rarity = EXCLUDED.rarity,
    character_id = EXCLUDED.character_id,
    price = EXCLUDED.price,
    is_premium = EXCLUDED.is_premium,
    is_limited = EXCLUDED.is_limited,
    thumbnail_url = EXCLUDED.thumbnail_url,
    preview_url = EXCLUDED.preview_url,
    tags = EXCLUDED.tags;
