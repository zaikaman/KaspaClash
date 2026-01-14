/**
 * Seed Cosmetics Database
 * Populates cosmetic_items table with initial shop inventory
 * 
 * Usage: npx ts-node scripts/seed-cosmetics.ts
 * Or run via: npm run seed:cosmetics
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables or replace with actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Character IDs must match the characters table
// These are the BASE CLASSES that the new characters belong to
const CHARACTERS = ['cyber-ninja', 'block-bruiser', 'dag-warrior', 'hash-hunter'];

// Cosmetic item definitions
const COSMETIC_ITEMS = [
    // ===================
    // CHARACTERS (16 total - 4 per archetype)
    // ===================

    // Archetype: Speed (Base: Cyber-Ninja)
    { name: 'Neon Wraith', description: 'A digital assassin composed of glitching light.', category: 'character', rarity: 'common', character_id: 'cyber-ninja', price: 0, thumbnail_url: '/cosmetics/cyber-ninja/characters/neon_wraith.webp', preview_url: '/cosmetics/cyber-ninja/characters/neon_wraith.webp', tags: ['default', 'glitch', 'neon'] },
    { name: 'Kitsune-09', description: 'Bio-augmented cyborg with nine holographic tails.', category: 'character', rarity: 'rare', character_id: 'cyber-ninja', price: 800, thumbnail_url: '/cosmetics/cyber-ninja/characters/kitsune_09.webp', preview_url: '/cosmetics/cyber-ninja/characters/kitsune_09.webp', tags: ['fox', 'cyborg', 'agile'] },
    { name: 'Viperblade', description: 'A toxic biomech with mantis-style blades.', category: 'character', rarity: 'epic', character_id: 'cyber-ninja', price: 1500, thumbnail_url: '/cosmetics/cyber-ninja/characters/viperblade.webp', preview_url: '/cosmetics/cyber-ninja/characters/viperblade.webp', tags: ['bio', 'toxic', 'blade'] },
    { name: 'Chrono-Drifter', description: 'A time-displaced ronin wielding a frozen blade.', category: 'character', rarity: 'legendary', character_id: 'cyber-ninja', price: 2500, thumbnail_url: '/cosmetics/cyber-ninja/characters/chrono_drifter.webp', preview_url: '/cosmetics/cyber-ninja/characters/chrono_drifter.webp', tags: ['time', 'ronin', 'legendary'] },

    // Archetype: Tank (Base: Block-Bruiser)
    { name: 'Heavy-Loader', description: 'Industrial mech with hydraulic crushing claws.', category: 'character', rarity: 'common', character_id: 'block-bruiser', price: 0, thumbnail_url: '/cosmetics/block-bruiser/characters/heavy_loader.webp', preview_url: '/cosmetics/block-bruiser/characters/heavy_loader.webp', tags: ['default', 'mech', 'industrial'] },
    { name: 'Gene-Smasher', description: 'Experimental super-soldier using raw brute force.', category: 'character', rarity: 'rare', character_id: 'block-bruiser', price: 800, thumbnail_url: '/cosmetics/block-bruiser/characters/gene_smasher.webp', preview_url: '/cosmetics/block-bruiser/characters/gene_smasher.webp', tags: ['mutant', 'strong', 'hulking'] },
    { name: 'Bastion Hulk', description: 'Geometric golem with floating block fists.', category: 'character', rarity: 'epic', character_id: 'block-bruiser', price: 1500, thumbnail_url: '/cosmetics/block-bruiser/characters/bastion_hulk.webp', preview_url: '/cosmetics/block-bruiser/characters/bastion_hulk.webp', tags: ['ai', 'robot', 'golem'] },
    { name: 'Scrap-Goliath', description: 'A massive golem animated from urban debris.', category: 'character', rarity: 'legendary', character_id: 'block-bruiser', price: 2500, thumbnail_url: '/cosmetics/block-bruiser/characters/scrap_goliath.webp', preview_url: '/cosmetics/block-bruiser/characters/scrap_goliath.webp', tags: ['junk', 'golem', 'legendary'] },

    // Archetype: Tech (Base: DAG-Warrior)
    { name: 'Cyber-Paladin', description: 'A futuristic knight wielding a hard-light hammer.', category: 'character', rarity: 'common', character_id: 'dag-warrior', price: 0, thumbnail_url: '/cosmetics/dag-warrior/characters/cyber_paladin.webp', preview_url: '/cosmetics/dag-warrior/characters/cyber_paladin.webp', tags: ['default', 'knight', 'holy'] },
    { name: 'Nano-Brawler', description: 'Street fighter utilizing nanobot-enhanced punches.', category: 'character', rarity: 'rare', character_id: 'dag-warrior', price: 800, thumbnail_url: '/cosmetics/dag-warrior/characters/nano_brawler.webp', preview_url: '/cosmetics/dag-warrior/characters/nano_brawler.webp', tags: ['tech', 'street', 'brawler'] },
    { name: 'Technomancer', description: 'Sorcerer manipulating high-voltage cables as whips.', category: 'character', rarity: 'epic', character_id: 'dag-warrior', price: 1500, thumbnail_url: '/cosmetics/dag-warrior/characters/technomancer.webp', preview_url: '/cosmetics/dag-warrior/characters/technomancer.webp', tags: ['magic', 'cyber', 'cables'] },
    { name: 'Aeon Guard', description: 'Cosmic guardian wielding a gravity-bending staff.', category: 'character', rarity: 'legendary', character_id: 'dag-warrior', price: 2500, thumbnail_url: '/cosmetics/dag-warrior/characters/aeon_guard.webp', preview_url: '/cosmetics/dag-warrior/characters/aeon_guard.webp', tags: ['future', 'cosmic', 'legendary'] },

    // Archetype: Precision (Base: Hash-Hunter)
    { name: 'Razor-Bot 7', description: 'Robot duelist wielding monofilament laser whips.', category: 'character', rarity: 'common', character_id: 'hash-hunter', price: 0, thumbnail_url: '/cosmetics/hash-hunter/characters/razor_bot_7.webp', preview_url: '/cosmetics/hash-hunter/characters/razor_bot_7.webp', tags: ['default', 'robot', 'whip'] },
    { name: 'Sonic-Striker', description: 'Fighter using massive subwoofer-gauntlets.', category: 'character', rarity: 'rare', character_id: 'hash-hunter', price: 800, thumbnail_url: '/cosmetics/hash-hunter/characters/sonic_striker.webp', preview_url: '/cosmetics/hash-hunter/characters/sonic_striker.webp', tags: ['sound', 'gauntlets', 'fighter'] },
    { name: 'Prism-Duelist', description: 'Fencer with a rapier of focused light.', category: 'character', rarity: 'epic', character_id: 'hash-hunter', price: 1500, thumbnail_url: '/cosmetics/hash-hunter/characters/prism_duelist.webp', preview_url: '/cosmetics/hash-hunter/characters/prism_duelist.webp', tags: ['crystal', 'fencer', 'glass'] },
    { name: 'Void-Reaper', description: 'Alien predator wielding dark matter scythes.', category: 'character', rarity: 'legendary', character_id: 'hash-hunter', price: 2500, thumbnail_url: '/cosmetics/hash-hunter/characters/void_reaper.webp', preview_url: '/cosmetics/hash-hunter/characters/void_reaper.webp', tags: ['alien', 'void', 'legendary'] },

    // ===================
    // EMOTES
    // ===================
    { name: 'Glitch Bow', description: 'A stuttering, glitching respectful bow.', category: 'emote', rarity: 'rare', character_id: 'cyber-ninja', price: 300, thumbnail_url: '/cosmetics/cyber-ninja/emotes/shadow_bow.webp', preview_url: '/cosmetics/cyber-ninja/emotes/shadow_bow.webp', tags: ['bow', 'glitch'] },
    { name: 'Ghost Taunt', description: 'Vanish and reappear laughing.', category: 'emote', rarity: 'epic', character_id: 'cyber-ninja', price: 600, thumbnail_url: '/cosmetics/cyber-ninja/emotes/vanish_taunt.webp', preview_url: '/cosmetics/cyber-ninja/emotes/vanish_taunt.webp', tags: ['vanish', 'taunt'] },

    { name: 'Power Flex', description: 'Flexing so hard the metal groans.', category: 'emote', rarity: 'rare', character_id: 'block-bruiser', price: 300, thumbnail_url: '/cosmetics/block-bruiser/emotes/flex_protocol.webp', preview_url: '/cosmetics/block-bruiser/emotes/flex_protocol.webp', tags: ['flex', 'strong'] },
    { name: 'Quake Slam', description: 'Create a localized earthquake.', category: 'emote', rarity: 'epic', character_id: 'block-bruiser', price: 600, thumbnail_url: '/cosmetics/block-bruiser/emotes/ground_pound.webp', preview_url: '/cosmetics/block-bruiser/emotes/ground_pound.webp', tags: ['slam', 'quake'] },

    { name: 'System Reboot', description: 'A momentary shutdown and reboot.', category: 'emote', rarity: 'rare', character_id: 'dag-warrior', price: 300, thumbnail_url: '/cosmetics/dag-warrior/emotes/data_salute.webp', preview_url: '/cosmetics/dag-warrior/emotes/data_salute.webp', tags: ['reboot', 'tech'] },
    { name: 'Hologram High-Five', description: 'High-five your own clone.', category: 'emote', rarity: 'epic', character_id: 'dag-warrior', price: 600, thumbnail_url: '/cosmetics/dag-warrior/emotes/parallel_clap.webp', preview_url: '/cosmetics/dag-warrior/emotes/parallel_clap.webp', tags: ['clone', 'fun'] },

    { name: 'Coin Trick', description: 'Roll a crypto coin across knuckles.', category: 'emote', rarity: 'rare', character_id: 'hash-hunter', price: 300, thumbnail_url: '/cosmetics/hash-hunter/emotes/coin_flip.webp', preview_url: '/cosmetics/hash-hunter/emotes/coin_flip.webp', tags: ['coin', 'luck'] },
    { name: 'Blade Sharpen', description: 'Sparks fly as you hone your edge.', category: 'emote', rarity: 'epic', character_id: 'hash-hunter', price: 600, thumbnail_url: '/cosmetics/hash-hunter/emotes/hash_check.webp', preview_url: '/cosmetics/hash-hunter/emotes/hash_check.webp', tags: ['blade', 'cool'] },

    // ===================
    // VICTORY POSES
    // ===================
    { name: 'Rooftop Watch', description: 'Watching over the city.', category: 'victory_pose', rarity: 'rare', character_id: 'cyber-ninja', price: 400, thumbnail_url: '/cosmetics/cyber-ninja/poses/stealth_complete.webp', preview_url: '/cosmetics/cyber-ninja/poses/stealth_complete.webp', tags: ['watch', 'cool'] },
    { name: 'Light Trail', description: 'Frozen mid-dash.', category: 'victory_pose', rarity: 'epic', character_id: 'cyber-ninja', price: 750, thumbnail_url: '/cosmetics/cyber-ninja/poses/blade_dance.webp', preview_url: '/cosmetics/cyber-ninja/poses/blade_dance.webp', tags: ['speed', 'trail'] },

    { name: 'Unbroken', description: 'Standing tall among debris.', category: 'victory_pose', rarity: 'rare', character_id: 'block-bruiser', price: 400, thumbnail_url: '/cosmetics/block-bruiser/poses/immovable.webp', preview_url: '/cosmetics/block-bruiser/poses/immovable.webp', tags: ['strong', 'debris'] },
    { name: 'Wall of Iron', description: 'Becoming the shield.', category: 'victory_pose', rarity: 'epic', character_id: 'block-bruiser', price: 750, thumbnail_url: '/cosmetics/block-bruiser/poses/fortress_stance.webp', preview_url: '/cosmetics/block-bruiser/poses/fortress_stance.webp', tags: ['shield', 'wall'] },

    { name: 'Mission Success', description: 'All systems green.', category: 'victory_pose', rarity: 'rare', character_id: 'dag-warrior', price: 400, thumbnail_url: '/cosmetics/dag-warrior/poses/protocol_success.webp', preview_url: '/cosmetics/dag-warrior/poses/protocol_success.webp', tags: ['success', 'tech'] },
    { name: 'Ascended', description: 'Floating in a trance state.', category: 'victory_pose', rarity: 'epic', character_id: 'dag-warrior', price: 750, thumbnail_url: '/cosmetics/dag-warrior/poses/network_dominance.webp', preview_url: '/cosmetics/dag-warrior/poses/network_dominance.webp', tags: ['float', 'god'] },

    { name: 'Spoils of War', description: 'Examining a captured trophy.', category: 'victory_pose', rarity: 'rare', character_id: 'hash-hunter', price: 400, thumbnail_url: '/cosmetics/hash-hunter/poses/jackpot.webp', preview_url: '/cosmetics/hash-hunter/poses/jackpot.webp', tags: ['rich', 'throne'] },
    { name: 'Clean Cut', description: 'Sheathing weapon as debris falls.', category: 'victory_pose', rarity: 'epic', character_id: 'hash-hunter', price: 750, thumbnail_url: '/cosmetics/hash-hunter/poses/block_solved.webp', preview_url: '/cosmetics/hash-hunter/poses/block_solved.webp', tags: ['cut', 'cool'] },

    // ===================
    // PROFILE BADGES (8 total)
    // ===================
    { name: 'Kaspa Warrior', description: 'Show your dedication to the Kaspa network.', category: 'profile_badge', rarity: 'common', price: 200, thumbnail_url: '/cosmetics/badges/kaspa_warrior.webp', preview_url: '/cosmetics/badges/kaspa_warrior.webp', tags: ['kaspa', 'beginner', 'warrior'] },
    { name: 'DAG Champion', description: 'For those who master the DAG.', category: 'profile_badge', rarity: 'rare', price: 500, thumbnail_url: '/cosmetics/badges/dag_champion.webp', preview_url: '/cosmetics/badges/dag_champion.webp', tags: ['dag', 'champion', 'master'] },
    { name: 'Block Master', description: 'Perfect block completion achievement.', category: 'profile_badge', rarity: 'epic', price: 1000, thumbnail_url: '/cosmetics/badges/block_master.webp', preview_url: '/cosmetics/badges/block_master.webp', tags: ['block', 'master', 'achievement'] },
    { name: 'Genesis Validator', description: 'For the true blockchain pioneers.', category: 'profile_badge', rarity: 'legendary', price: 2000, thumbnail_url: '/cosmetics/badges/genesis_validator.webp', preview_url: '/cosmetics/badges/genesis_validator.webp', tags: ['genesis', 'legendary', 'pioneer'] },
    { name: 'Speed Demon', description: 'Lightning-fast transaction master.', category: 'profile_badge', rarity: 'rare', price: 500, thumbnail_url: '/cosmetics/badges/speed_demon.webp', preview_url: '/cosmetics/badges/speed_demon.webp', tags: ['speed', 'fast', 'demon'] },
    { name: 'Battle Hardened', description: 'Veteran of countless battles.', category: 'profile_badge', rarity: 'epic', price: 1000, thumbnail_url: '/cosmetics/badges/battle_hardened.webp', preview_url: '/cosmetics/badges/battle_hardened.webp', tags: ['veteran', 'battles', 'hardened'] },
    { name: 'Combo King', description: 'Master of devastating combos.', category: 'profile_badge', rarity: 'rare', price: 500, thumbnail_url: '/cosmetics/badges/combo_king.webp', preview_url: '/cosmetics/badges/combo_king.webp', tags: ['combo', 'king', 'skill'] },
    { name: 'Prestige Elite', description: 'Reserved for prestige players only.', category: 'profile_badge', rarity: 'legendary', price: 0, is_premium: true, unlock_requirement: 'prestige_level_1', thumbnail_url: '/cosmetics/badges/prestige_elite.webp', preview_url: '/cosmetics/badges/prestige_elite.webp', tags: ['prestige', 'elite', 'exclusive'] },

    // ===================
    // PROFILE FRAMES (8 total)
    // ===================
    { name: 'Circuit Frame', description: 'Clean circuit board aesthetic border.', category: 'profile_frame', rarity: 'common', price: 300, thumbnail_url: '/cosmetics/frames/circuit_frame.webp', preview_url: '/cosmetics/frames/circuit_frame.webp', tags: ['circuit', 'tech', 'clean'] },
    { name: 'Blockchain Border', description: 'Connected blocks forming your frame.', category: 'profile_frame', rarity: 'rare', price: 700, thumbnail_url: '/cosmetics/frames/blockchain_border.webp', preview_url: '/cosmetics/frames/blockchain_border.webp', tags: ['blockchain', 'connected', 'network'] },
    { name: 'Energy Surge', description: 'Electric energy arcing around your avatar.', category: 'profile_frame', rarity: 'epic', price: 1200, thumbnail_url: '/cosmetics/frames/energy_surge.webp', preview_url: '/cosmetics/frames/energy_surge.webp', tags: ['energy', 'electric', 'surge'] },
    { name: 'Void Rift', description: 'Reality torn apart at the edges.', category: 'profile_frame', rarity: 'legendary', price: 2000, thumbnail_url: '/cosmetics/frames/void_rift.webp', preview_url: '/cosmetics/frames/void_rift.webp', tags: ['void', 'rift', 'cosmic'] },
    { name: 'Fire & Ice', description: 'Dual elements meeting at the center.', category: 'profile_frame', rarity: 'epic', price: 1200, thumbnail_url: '/cosmetics/frames/fire_ice.webp', preview_url: '/cosmetics/frames/fire_ice.webp', tags: ['fire', 'ice', 'elements'] },
    { name: 'Neon Glow', description: 'Retro synthwave neon tube effect.', category: 'profile_frame', rarity: 'rare', price: 700, thumbnail_url: '/cosmetics/frames/neon_glow.webp', preview_url: '/cosmetics/frames/neon_glow.webp', tags: ['neon', 'retro', 'synthwave'] },
    { name: 'Gold Champion', description: 'Prestigious golden frame with laurels.', category: 'profile_frame', rarity: 'epic', price: 1200, thumbnail_url: '/cosmetics/frames/gold_champion.webp', preview_url: '/cosmetics/frames/gold_champion.webp', tags: ['gold', 'champion', 'prestige'] },
    { name: 'Holographic Elite', description: 'Rainbow holographic shimmer effect.', category: 'profile_frame', rarity: 'legendary', price: 2000, thumbnail_url: '/cosmetics/frames/holographic_elite.webp', preview_url: '/cosmetics/frames/holographic_elite.webp', tags: ['holographic', 'rainbow', 'elite'] },
];

async function seedCosmetics() {
    console.log('🎨 Seeding cosmetic items...');
    console.log(`Found ${COSMETIC_ITEMS.length} items to insert`);

    // Insert items in batches
    const batchSize = 10;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < COSMETIC_ITEMS.length; i += batchSize) {
        const batch = COSMETIC_ITEMS.slice(i, i + batchSize).map(item => ({
            ...item,
            is_premium: item.is_premium || false,
            is_limited: false,
            release_date: new Date().toISOString(),
        }));

        const { data, error } = await supabase
            .from('cosmetic_items')
            .upsert(batch, { onConflict: 'name' })
            .select('id');

        if (error) {
            console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
            errors += batch.length;
        } else {
            inserted += data?.length || 0;
            console.log(`✅ Inserted batch ${i / batchSize + 1} (${data?.length || 0} items)`);
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${COSMETIC_ITEMS.length}`);
}

// Run if called directly
seedCosmetics()
    .then(() => {
        console.log('\n🎉 Seeding complete!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
