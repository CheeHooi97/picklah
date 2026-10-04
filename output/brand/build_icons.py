"""Export PickLah's existing mascot for web, Android, and Google Play."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'frontend/public'
RES = ROOT / 'frontend/android/app/src/main/res'
mascot = Image.open(PUBLIC / 'picklah-emoji.png').convert('RGBA')

def square(size, ratio=0.8125, transparent=False):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0) if transparent else '#fff1cf')
    edge = round(size * ratio)
    mark = mascot.resize((edge, edge), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size-edge)//2, (size-edge)//2))
    return canvas

square(512).save(PUBLIC / 'favicon.png')
square(180).save(PUBLIC / 'apple-touch-icon.png')
square(192).save(PUBLIC / 'icon-192.png')
square(512).save(PUBLIC / 'icon-512.png')
square(512, ratio=0.65).save(PUBLIC / 'icon-maskable-512.png')
square(64).save(PUBLIC / 'favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64)])
store = ROOT / 'output/play-store'
store.mkdir(parents=True, exist_ok=True)
square(512).save(store / 'app-icon.png')

for density, size, foreground in [('mdpi',48,108),('hdpi',72,162),('xhdpi',96,216),('xxhdpi',144,324),('xxxhdpi',192,432)]:
    folder = RES / f'mipmap-{density}'
    square(size).save(folder / 'ic_launcher.png')
    round_icon = square(size)
    from PIL import ImageDraw
    mask = Image.new('L',(size,size),0)
    ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
    round_icon.putalpha(mask)
    round_icon.save(folder / 'ic_launcher_round.png')
    # Adaptive foreground: artwork stays inside Android's central safe circle.
    square(foreground,ratio=0.60,transparent=True).save(folder / 'ic_launcher_foreground.png')

print('Exported web favicons, PWA icons, five Android densities, and Play Store icon.')
