/**
 * Audio Asset Keys
 * Centralized keys for audio assets to avoid typos
 */

export const AudioKeys = {
    BGM: {
        MENU: "bgm_menu",
        FIGHT: "bgm_fight",
        PRACTICE: "bgm_practice",
    },
    SFX: {
        UI: {
            HOVER: "sfx_hover",
            CLICK: "sfx_click",
            COUNTDOWN: "sfx_countdown", // 3, 2, 1
            FIGHT: "sfx_fight_shout", // FIGHT!
            VICTORY: "sfx_victory",
            DEFEAT: "sfx_defeat",
        },
        MOVES: {
            PUNCH: "sfx_punch",
            KICK: "sfx_kick",
            BLOCK: "sfx_block",
            SPECIAL: "sfx_special",
        }
    }
};

/**
 * Helper to get character specific audio key
 */
export const getCharacterAudioKey = (characterId: string, move: string) => {
    return `sfx_${characterId}_${move}`;
};
