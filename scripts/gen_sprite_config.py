from PIL import Image
import os

chars_dir = 'public/characters'
chars = sorted([d for d in os.listdir(chars_dir) if os.path.isdir(os.path.join(chars_dir, d))])
anims = ['idle', 'run', 'punch', 'kick', 'block', 'special', 'dead']

lines = []
lines.append('/**')
lines.append(' * Sprite Configuration for all characters')
lines.append(' * Frame dimensions calculated from 6x6 grid (36 frames total per animation)')
lines.append(' */')
lines.append('')
lines.append('export const CHAR_SPRITE_CONFIG: Record<string, Record<string, { frameWidth: number; frameHeight: number }>> = {')

for char in chars:
    char_lines = []
    char_lines.append(f'  "{char}": {{')
    for anim in anims:
        path = f'{chars_dir}/{char}/{anim}.webp'
        if os.path.exists(path):
            img = Image.open(path)
            w, h = img.size
            fw = w // 6
            fh = h // 6
            char_lines.append(f'    "{anim}": {{ frameWidth: {fw}, frameHeight: {fh} }},')
    char_lines.append('  },')
    lines.extend(char_lines)

lines.append('};')
lines.append('')
lines.append('/** Tank characters that get 20% larger scale */')
lines.append('export const TANK_CHARACTERS = ["block-bruiser", "heavy-loader", "gene-smasher", "bastion-hulk", "scrap-goliath"];')
lines.append('')
lines.append('/**')
lines.append(' * Get character scale based on type')
lines.append(' */')
lines.append('export function getCharacterScale(charId: string): number {')
lines.append('  const isTank = TANK_CHARACTERS.includes(charId);')
lines.append('  const baseScale = 0.65; // Scale to ~280px display height')
lines.append('  return isTank ? baseScale * 1.2 : baseScale;')
lines.append('}')

with open('src/game/config/sprite-config.ts', 'w') as f:
    f.write('\n'.join(lines))

print(f"Generated config for {len(chars)} characters")
