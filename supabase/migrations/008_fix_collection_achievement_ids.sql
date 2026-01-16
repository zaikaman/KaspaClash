-- 008_fix_collection_achievement_ids.sql
-- Fix collection achievement IDs to match TypeScript definitions
-- The seed file used 'co01', 'co02', etc. but TypeScript uses 'col01', 'col02', etc.

-- First, delete any player_achievements that reference the old IDs
DELETE FROM public.player_achievements WHERE achievement_id LIKE 'co%' AND achievement_id NOT LIKE 'col%';

-- Delete the old collection achievements
DELETE FROM public.achievements WHERE id LIKE 'co%' AND id NOT LIKE 'col%';

-- Insert the corrected collection achievements with 'col' prefix (matching TypeScript definitions)
INSERT INTO public.achievements (id, name, description, category, tier, icon_url, xp_reward, currency_reward, requirement, is_secret, display_order) VALUES
('col01', 'First Purchase', 'Buy your first item from the shop', 'collection', 'bronze', '/assets/achievements/first_purchase.png', 250, 25, '{"type": "counter", "targetValue": 1, "trackingKey": "shop_purchases"}', false, 1),
('col02', 'Fashionista', 'Own 3 cosmetic items', 'collection', 'bronze', '/assets/achievements/fashionista.png', 250, 25, '{"type": "counter", "targetValue": 3, "trackingKey": "cosmetics_owned"}', false, 2),
('col03', 'Shard Saver', 'Earn 500 Clash Shards', 'collection', 'bronze', '/assets/achievements/shard_saver.png', 250, 25, '{"type": "counter", "targetValue": 500, "trackingKey": "total_shards_earned"}', false, 3),
('col04', 'Shop Regular', 'Make 5 shop purchases', 'collection', 'silver', '/assets/achievements/shop_regular.png', 500, 50, '{"type": "counter", "targetValue": 5, "trackingKey": "shop_purchases"}', false, 4),
('col05', 'Style Icon', 'Own 10 cosmetic items', 'collection', 'silver', '/assets/achievements/style_icon.png', 500, 50, '{"type": "counter", "targetValue": 10, "trackingKey": "cosmetics_owned"}', false, 5),
('col06', 'Shard Collector', 'Earn 2,500 Clash Shards', 'collection', 'silver', '/assets/achievements/shard_collector.png', 500, 50, '{"type": "counter", "targetValue": 2500, "trackingKey": "total_shards_earned"}', false, 6),
('col07', 'Big Spender', 'Make 15 shop purchases', 'collection', 'gold', '/assets/achievements/big_spender.png', 1000, 100, '{"type": "counter", "targetValue": 15, "trackingKey": "shop_purchases"}', false, 7),
('col08', 'Collector', 'Own 25 cosmetic items', 'collection', 'gold', '/assets/achievements/collector.png', 1000, 100, '{"type": "counter", "targetValue": 25, "trackingKey": "cosmetics_owned"}', false, 8),
('col09', 'Rare Find', 'Own an Epic or Legendary cosmetic', 'collection', 'gold', '/assets/achievements/rare_find.png', 1000, 100, '{"type": "milestone", "targetValue": 1, "trackingKey": "epic_or_legendary_owned"}', false, 9),
('col10', 'Whale', 'Make 50 shop purchases', 'collection', 'platinum', '/assets/achievements/whale.png', 2000, 250, '{"type": "counter", "targetValue": 50, "trackingKey": "shop_purchases"}', false, 10),
('col11', 'Shard Hoarder', 'Earn 10,000 Clash Shards', 'collection', 'platinum', '/assets/achievements/shard_hoarder.png', 2000, 250, '{"type": "counter", "targetValue": 10000, "trackingKey": "total_shards_earned"}', false, 11),
('col12', 'Complete Collection', 'Own 50 cosmetic items', 'collection', 'diamond', '/assets/achievements/complete_collection.png', 5000, 500, '{"type": "counter", "targetValue": 50, "trackingKey": "cosmetics_owned"}', false, 12),
('col13', 'Legendary Collector', 'Own 3 Legendary cosmetics', 'collection', 'diamond', '/assets/achievements/legendary_collector.png', 5000, 500, '{"type": "counter", "targetValue": 3, "trackingKey": "legendary_owned"}', true, 13)
ON CONFLICT (id) DO NOTHING;
