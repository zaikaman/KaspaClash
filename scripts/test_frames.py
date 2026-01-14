from PIL import Image
import os

chars_dir = 'public/characters'
anims = ['idle', 'run', 'punch', 'kick', 'block', 'special', 'dead']

# Test specific characters
test_chars = ['void-reaper', 'aeon-guard', 'cyber-ninja', 'block-bruiser']

for char in test_chars:
    print(f"\n{char}:")
    for anim in anims:
        path = f'{chars_dir}/{char}/{anim}.webp'
        if os.path.exists(path):
            img = Image.open(path)
            w, h = img.size
            print(f"  {anim}: raw={w}x{h}, frame={w//6}x{h//6}")
