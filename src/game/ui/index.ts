/**
 * Game UI Components
 * Exports all Phaser UI components for the game engine
 */

// Fight scene UI
export { MoveButton, type MoveButtonConfig } from "./MoveButton";
export { RoundTimer, type RoundTimerConfig } from "./RoundTimer";
export { HealthBar, type HealthBarConfig } from "./HealthBar";
export { RoundScore, type RoundScoreConfig } from "./RoundScore";
export { StickerPicker, type StickerPickerConfig, STICKER_LIST } from "./StickerPicker";

// Character selection UI
export { CharacterCard, type CharacterCardConfig } from "./CharacterCard";
export { SelectionTimer, type SelectionTimerConfig } from "./SelectionTimer";
export { OpponentStatus, type OpponentStatusConfig } from "./OpponentStatus";
export * from "./StatsOverlay";

