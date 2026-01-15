-- 007_seed_achievements.sql
-- Seed the achievements table with all achievement definitions
-- These IDs match the TypeScript achievement definitions

-- Combat Achievements (Bronze)
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('c01', 'First Blood', 'Win your first match', 'combat', 'bronze', '/assets/achievements/first_blood.png', 250, 25, '{"type": "counter", "targetValue": 1, "trackingKey": "total_wins"}', false, 1),
('c02', 'Combo Starter', 'Execute 10 combo sequences', 'combat', 'bronze', '/assets/achievements/combo_starter.png', 250, 25, '{"type": "counter", "targetValue": 10, "trackingKey": "total_combos"}', false, 2),
('c03', 'Damage Dealer', 'Deal 1,000 total damage', 'combat', 'bronze', '/assets/achievements/damage_dealer.png', 250, 25, '{"type": "counter", "targetValue": 1000, "trackingKey": "total_damage_dealt"}', false, 3),
('c04', 'Block Master', 'Block 25 attacks', 'combat', 'bronze', '/assets/achievements/block_master.png', 250, 25, '{"type": "counter", "targetValue": 25, "trackingKey": "total_blocks"}', false, 4);

-- Combat Achievements (Silver)
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('c05', 'Warrior', 'Win 10 matches', 'combat', 'silver', '/assets/achievements/warrior.png', 500, 50, '{"type": "counter", "targetValue": 10, "trackingKey": "total_wins"}', false, 5),
('c06', 'Combo Artist', 'Execute 50 combo sequences', 'combat', 'silver', '/assets/achievements/combo_artist.png', 500, 50, '{"type": "counter", "targetValue": 50, "trackingKey": "total_combos"}', false, 6),
('c07', 'Destruction', 'Deal 10,000 total damage', 'combat', 'silver', '/assets/achievements/destruction.png', 500, 50, '{"type": "counter", "targetValue": 10000, "trackingKey": "total_damage_dealt"}', false, 7),
('c08', 'Perfect Round', 'Win a round without taking damage', 'combat', 'silver', '/assets/achievements/perfect_round.png', 500, 50, '{"type": "counter", "targetValue": 1, "trackingKey": "perfect_rounds"}', false, 8);

-- Combat Achievements (Gold)
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('c09', 'Champion', 'Win 50 matches', 'combat', 'gold', '/assets/achievements/champion.png', 1000, 100, '{"type": "counter", "targetValue": 50, "trackingKey": "total_wins"}', false, 9),
('c10', 'Combo Master', 'Execute 200 combo sequences', 'combat', 'gold', '/assets/achievements/combo_master.png', 1000, 100, '{"type": "counter", "targetValue": 200, "trackingKey": "total_combos"}', false, 10),
('c11', 'Win Streak', 'Achieve a 5 win streak', 'combat', 'gold', '/assets/achievements/win_streak.png', 1000, 100, '{"type": "milestone", "targetValue": 5, "trackingKey": "win_streak"}', false, 11),
('c12', 'Flawless Victory', 'Win 3 perfect rounds in a single match', 'combat', 'gold', '/assets/achievements/flawless_victory.png', 1000, 100, '{"type": "milestone", "targetValue": 3, "trackingKey": "perfect_rounds_in_match"}', false, 12);

-- Combat Achievements (Platinum)
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('c13', 'Legend', 'Win 100 matches', 'combat', 'platinum', '/assets/achievements/legend.png', 2000, 250, '{"type": "counter", "targetValue": 100, "trackingKey": "total_wins"}', false, 13),
('c14', 'Unstoppable', 'Achieve a 10 win streak', 'combat', 'platinum', '/assets/achievements/unstoppable.png', 2000, 250, '{"type": "milestone", "targetValue": 10, "trackingKey": "win_streak"}', false, 14),
('c15', 'Annihilation', 'Deal 100,000 total damage', 'combat', 'platinum', '/assets/achievements/annihilation.png', 2000, 250, '{"type": "counter", "targetValue": 100000, "trackingKey": "total_damage_dealt"}', false, 15);

-- Combat Achievements (Diamond)
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('c16', 'Immortal', 'Win 500 matches', 'combat', 'diamond', '/assets/achievements/immortal.png', 5000, 500, '{"type": "counter", "targetValue": 500, "trackingKey": "total_wins"}', false, 16),
('c17', 'Perfection', 'Win 10 perfect matches', 'combat', 'diamond', '/assets/achievements/perfection.png', 5000, 500, '{"type": "counter", "targetValue": 10, "trackingKey": "perfect_matches"}', false, 17);

-- Progression Achievements
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('p01', 'Rising Star', 'Reach tier 5', 'progression', 'bronze', '/assets/achievements/rising_star.png', 250, 25, '{"type": "milestone", "targetValue": 5, "trackingKey": "current_tier"}', false, 1),
('p02', 'XP Grinder', 'Earn 5,000 total XP', 'progression', 'bronze', '/assets/achievements/xp_grinder.png', 250, 25, '{"type": "counter", "targetValue": 5000, "trackingKey": "total_xp"}', false, 2),
('p03', 'Quest Starter', 'Complete 3 daily quests', 'progression', 'bronze', '/assets/achievements/quest_starter.png', 250, 25, '{"type": "counter", "targetValue": 3, "trackingKey": "quests_completed"}', false, 3),
('p04', 'Climbing Ranks', 'Reach tier 15', 'progression', 'silver', '/assets/achievements/climbing_ranks.png', 500, 50, '{"type": "milestone", "targetValue": 15, "trackingKey": "current_tier"}', false, 4),
('p05', 'XP Hunter', 'Earn 25,000 total XP', 'progression', 'silver', '/assets/achievements/xp_hunter.png', 500, 50, '{"type": "counter", "targetValue": 25000, "trackingKey": "total_xp"}', false, 5),
('p06', 'Quest Warrior', 'Complete 15 daily quests', 'progression', 'silver', '/assets/achievements/quest_warrior.png', 500, 50, '{"type": "counter", "targetValue": 15, "trackingKey": "quests_completed"}', false, 6),
('p07', 'Dedicated', 'Complete quests 3 days in a row', 'progression', 'silver', '/assets/achievements/dedicated.png', 500, 50, '{"type": "milestone", "targetValue": 3, "trackingKey": "quest_streak"}', false, 7),
('p08', 'Elite Tier', 'Reach tier 25', 'progression', 'gold', '/assets/achievements/elite_tier.png', 1000, 100, '{"type": "milestone", "targetValue": 25, "trackingKey": "current_tier"}', false, 8),
('p09', 'XP Master', 'Earn 100,000 total XP', 'progression', 'gold', '/assets/achievements/xp_master.png', 1000, 100, '{"type": "counter", "targetValue": 100000, "trackingKey": "total_xp"}', false, 9),
('p10', 'Quest Master', 'Complete 50 daily quests', 'progression', 'gold', '/assets/achievements/quest_master.png', 1000, 100, '{"type": "counter", "targetValue": 50, "trackingKey": "quests_completed"}', false, 10),
('p11', 'Top Tier', 'Reach tier 40', 'progression', 'platinum', '/assets/achievements/top_tier.png', 2000, 250, '{"type": "milestone", "targetValue": 40, "trackingKey": "current_tier"}', false, 11),
('p12', 'Quest Legend', 'Complete 100 daily quests', 'progression', 'platinum', '/assets/achievements/quest_legend.png', 2000, 250, '{"type": "counter", "targetValue": 100, "trackingKey": "quests_completed"}', false, 12),
('p13', 'Persistent', 'Complete quests 7 days in a row', 'progression', 'platinum', '/assets/achievements/persistent.png', 2000, 250, '{"type": "milestone", "targetValue": 7, "trackingKey": "quest_streak"}', false, 13),
('p14', 'Max Tier', 'Reach tier 50', 'progression', 'diamond', '/assets/achievements/max_tier.png', 5000, 500, '{"type": "milestone", "targetValue": 50, "trackingKey": "current_tier"}', false, 14),
('p15', 'Prestige', 'Reach prestige level 1', 'progression', 'diamond', '/assets/achievements/prestige.png', 5000, 500, '{"type": "milestone", "targetValue": 1, "trackingKey": "prestige_level"}', false, 15),
('p16', 'Prestige Master', 'Reach prestige level 5', 'progression', 'diamond', '/assets/achievements/prestige_master.png', 5000, 500, '{"type": "milestone", "targetValue": 5, "trackingKey": "prestige_level"}', false, 16);

-- Social Achievements
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('s01', 'First Match', 'Play your first match', 'social', 'bronze', '/assets/achievements/first_match.png', 250, 25, '{"type": "counter", "targetValue": 1, "trackingKey": "matches_played"}', false, 1),
('s02', 'Meet the Competition', 'Play against 5 unique opponents', 'social', 'bronze', '/assets/achievements/meet_competition.png', 250, 25, '{"type": "counter", "targetValue": 5, "trackingKey": "unique_opponents"}', false, 2),
('s03', 'Regular Player', 'Play 25 matches', 'social', 'silver', '/assets/achievements/regular_player.png', 500, 50, '{"type": "counter", "targetValue": 25, "trackingKey": "matches_played"}', false, 3),
('s04', 'Social Butterfly', 'Play against 20 unique opponents', 'social', 'silver', '/assets/achievements/social_butterfly.png', 500, 50, '{"type": "counter", "targetValue": 20, "trackingKey": "unique_opponents"}', false, 4),
('s05', 'Veteran', 'Play 100 matches', 'social', 'gold', '/assets/achievements/veteran.png', 1000, 100, '{"type": "counter", "targetValue": 100, "trackingKey": "matches_played"}', false, 5),
('s06', 'Community Champion', 'Play against 50 unique opponents', 'social', 'gold', '/assets/achievements/community_champion.png', 1000, 100, '{"type": "counter", "targetValue": 50, "trackingKey": "unique_opponents"}', false, 6),
('s07', 'Dedicated Fighter', 'Play 500 matches', 'social', 'platinum', '/assets/achievements/dedicated_fighter.png', 2000, 250, '{"type": "counter", "targetValue": 500, "trackingKey": "matches_played"}', false, 7),
('s08', 'Everyone Knows You', 'Play against 100 unique opponents', 'social', 'platinum', '/assets/achievements/everyone_knows_you.png', 2000, 250, '{"type": "counter", "targetValue": 100, "trackingKey": "unique_opponents"}', false, 8),
('s09', 'The Grind Never Stops', 'Play 1,000 matches', 'social', 'diamond', '/assets/achievements/grind_never_stops.png', 5000, 500, '{"type": "counter", "targetValue": 1000, "trackingKey": "matches_played"}', false, 9);

-- Collection Achievements
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('co01', 'First Purchase', 'Make your first shop purchase', 'collection', 'bronze', '/assets/achievements/first_purchase.png', 250, 25, '{"type": "counter", "targetValue": 1, "trackingKey": "shop_purchases"}', false, 1),
('co02', 'Collector', 'Own 3 cosmetic items', 'collection', 'bronze', '/assets/achievements/collector.png', 250, 25, '{"type": "counter", "targetValue": 3, "trackingKey": "cosmetics_owned"}', false, 2),
('co03', 'Shard Farmer', 'Earn 500 total Clash Shards', 'collection', 'bronze', '/assets/achievements/shard_farmer.png', 250, 25, '{"type": "counter", "targetValue": 500, "trackingKey": "total_shards_earned"}', false, 3),
('co04', 'Shopaholic', 'Make 5 shop purchases', 'collection', 'silver', '/assets/achievements/shopaholic.png', 500, 50, '{"type": "counter", "targetValue": 5, "trackingKey": "shop_purchases"}', false, 4),
('co05', 'Style Master', 'Own 10 cosmetic items', 'collection', 'silver', '/assets/achievements/style_master.png', 500, 50, '{"type": "counter", "targetValue": 10, "trackingKey": "cosmetics_owned"}', false, 5),
('co06', 'Shard Hoarder', 'Earn 2,500 total Clash Shards', 'collection', 'silver', '/assets/achievements/shard_hoarder.png', 500, 50, '{"type": "counter", "targetValue": 2500, "trackingKey": "total_shards_earned"}', false, 6),
('co07', 'Big Spender', 'Make 15 shop purchases', 'collection', 'gold', '/assets/achievements/big_spender.png', 1000, 100, '{"type": "counter", "targetValue": 15, "trackingKey": "shop_purchases"}', false, 7),
('co08', 'Fashion Icon', 'Own 25 cosmetic items', 'collection', 'gold', '/assets/achievements/fashion_icon.png', 1000, 100, '{"type": "counter", "targetValue": 25, "trackingKey": "cosmetics_owned"}', false, 8),
('co09', 'Rare Find', 'Own an Epic or Legendary item', 'collection', 'gold', '/assets/achievements/rare_find.png', 1000, 100, '{"type": "milestone", "targetValue": 1, "trackingKey": "epic_or_legendary_owned"}', false, 9),
('co10', 'Premium Collector', 'Make 50 shop purchases', 'collection', 'platinum', '/assets/achievements/premium_collector.png', 2000, 250, '{"type": "counter", "targetValue": 50, "trackingKey": "shop_purchases"}', false, 10),
('co11', 'Shard Tycoon', 'Earn 10,000 total Clash Shards', 'collection', 'platinum', '/assets/achievements/shard_tycoon.png', 2000, 250, '{"type": "counter", "targetValue": 10000, "trackingKey": "total_shards_earned"}', false, 11),
('co12', 'Complete Wardrobe', 'Own 50 cosmetic items', 'collection', 'diamond', '/assets/achievements/complete_wardrobe.png', 5000, 500, '{"type": "counter", "targetValue": 50, "trackingKey": "cosmetics_owned"}', false, 12),
('co13', 'Legendary Collector', 'Own 3 Legendary items', 'collection', 'diamond', '/assets/achievements/legendary_collector.png', 5000, 500, '{"type": "counter", "targetValue": 3, "trackingKey": "legendary_owned"}', false, 13);

-- Mastery Achievements
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('m01', 'Survival Initiate', 'Complete 5 waves in Survival Mode', 'mastery', 'bronze', '/assets/achievements/survival_initiate.png', 250, 25, '{"type": "milestone", "targetValue": 5, "trackingKey": "max_survival_waves"}', false, 1),
('m02', 'Achievement Hunter', 'Unlock 5 achievements', 'mastery', 'bronze', '/assets/achievements/achievement_hunter.png', 250, 25, '{"type": "counter", "targetValue": 5, "trackingKey": "achievements_unlocked"}', false, 2),
('m03', 'Survival Veteran', 'Complete 10 waves in Survival Mode', 'mastery', 'silver', '/assets/achievements/survival_veteran.png', 500, 50, '{"type": "milestone", "targetValue": 10, "trackingKey": "max_survival_waves"}', false, 3),
('m04', 'Achievement Addict', 'Unlock 20 achievements', 'mastery', 'silver', '/assets/achievements/achievement_addict.png', 500, 50, '{"type": "counter", "targetValue": 20, "trackingKey": "achievements_unlocked"}', false, 4),
('m05', 'Survival Expert', 'Complete 15 waves in Survival Mode', 'mastery', 'gold', '/assets/achievements/survival_expert.png', 1000, 100, '{"type": "milestone", "targetValue": 15, "trackingKey": "max_survival_waves"}', false, 5),
('m06', 'Combat Initiate', 'Unlock all Bronze Combat achievements', 'mastery', 'gold', '/assets/achievements/combat_initiate.png', 1000, 100, '{"type": "collection", "targetValue": 4, "trackingKey": "combat_bronze_unlocked"}', false, 6),
('m07', 'Achievement Completionist', 'Unlock 40 achievements', 'mastery', 'gold', '/assets/achievements/achievement_completionist.png', 1000, 100, '{"type": "counter", "targetValue": 40, "trackingKey": "achievements_unlocked"}', false, 7),
('m08', 'Survival Master', 'Complete all 20 waves in Survival Mode', 'mastery', 'platinum', '/assets/achievements/survival_master.png', 2000, 250, '{"type": "milestone", "targetValue": 20, "trackingKey": "max_survival_waves"}', false, 8),
('m09', 'Category Master', 'Complete all achievements in 1 category', 'mastery', 'platinum', '/assets/achievements/category_master.png', 2000, 250, '{"type": "milestone", "targetValue": 1, "trackingKey": "categories_completed"}', false, 9),
('m10', 'Achievement Overlord', 'Unlock 60 achievements', 'mastery', 'platinum', '/assets/achievements/achievement_overlord.png', 2000, 250, '{"type": "counter", "targetValue": 60, "trackingKey": "achievements_unlocked"}', false, 10),
('m11', 'True Master', 'Complete all achievements in all 5 categories', 'mastery', 'diamond', '/assets/achievements/true_master.png', 5000, 500, '{"type": "milestone", "targetValue": 5, "trackingKey": "categories_completed"}', false, 11);
