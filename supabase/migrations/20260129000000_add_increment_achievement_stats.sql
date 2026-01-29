-- 20260129000000_add_increment_achievement_stats.sql
-- Add RPC function to safely increment achievement statistics

CREATE OR REPLACE FUNCTION public.increment_achievement_stats(
  p_player_id text,
  p_category text,
  p_xp integer,
  p_currency integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.achievement_statistics (
    player_id,
    unlocked_achievements,
    total_xp_earned,
    total_currency_earned,
    combat_unlocked,
    progression_unlocked,
    social_unlocked,
    collection_unlocked,
    mastery_unlocked,
    updated_at
  )
  VALUES (
    p_player_id,
    1,
    p_xp,
    p_currency,
    CASE WHEN p_category = 'combat' THEN 1 ELSE 0 END,
    CASE WHEN p_category = 'progression' THEN 1 ELSE 0 END,
    CASE WHEN p_category = 'social' THEN 1 ELSE 0 END,
    CASE WHEN p_category = 'collection' THEN 1 ELSE 0 END,
    CASE WHEN p_category = 'mastery' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (player_id)
  DO UPDATE SET
    unlocked_achievements = achievement_statistics.unlocked_achievements + 1,
    total_xp_earned = achievement_statistics.total_xp_earned + p_xp,
    total_currency_earned = achievement_statistics.total_currency_earned + p_currency,
    combat_unlocked = achievement_statistics.combat_unlocked + CASE WHEN p_category = 'combat' THEN 1 ELSE 0 END,
    progression_unlocked = achievement_statistics.progression_unlocked + CASE WHEN p_category = 'progression' THEN 1 ELSE 0 END,
    social_unlocked = achievement_statistics.social_unlocked + CASE WHEN p_category = 'social' THEN 1 ELSE 0 END,
    collection_unlocked = achievement_statistics.collection_unlocked + CASE WHEN p_category = 'collection' THEN 1 ELSE 0 END,
    mastery_unlocked = achievement_statistics.mastery_unlocked + CASE WHEN p_category = 'mastery' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;
