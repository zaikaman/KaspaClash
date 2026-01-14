from PIL import Image
import os

chars_dir = 'public/characters'
chars = sorted([d for d in os.listdir(chars_dir) if os.path.isdir(os.path.join(chars_dir, d))])
anims = ['idle', 'run', 'punch', 'kick', 'block', 'special', 'dead']

# Generate TypeScript config
lines = []
lines.append('const CHAR_SPRITE_CONFIG: Record<string, Record<string, { frameWidth: number; frameHeight: number }>> = {')
for char in chars:
    char_lines = []
    char_lines.append(f'  "{char}": {{')
    for anim in anims:
        path = f'{chars_dir}/{char}/{anim}.webp'
        if os.path.exists(path):
            img = Image.open(path)
            w, h = img.size
            # 36 frames in 6x6 grid
            fw = w // 6
            fh = h // 6
            char_lines.append(f'    "{anim}": {{ frameWidth: {fw}, frameHeight: {fh} }},')
    char_lines.append('  },')
    lines.extend(char_lines)
lines.append('};')

# Write to file
with open('scripts/sprite_config_output.ts', 'w') as f:
    f.write('\n'.join(lines))

print(f"Generated config for {len(chars)} characters")
print("Output written to scripts/sprite_config_output.ts")
