from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
FONT = Path('C:/Windows/Fonts')
def font(size, bold=False):
    return ImageFont.truetype(str(FONT / ('trebucbd.ttf' if bold else 'trebuc.ttf')), size)

# Compose store artwork from the existing brand asset; keep the original intact.
mascot = Image.open(ROOT / 'frontend/public/picklah-emoji.png').convert('RGBA')
icon = Image.new('RGBA', (512,512), '#fff1cf')
mark = mascot.resize((416,416), Image.Resampling.LANCZOS)
icon.alpha_composite(mark, (48,48))
icon.save(OUT / 'app-icon.png')

feature = Image.new('RGB', (1024,500), '#fff1cf')
draw = ImageDraw.Draw(feature)
draw.text((82,112), 'PickLah', font=font(68,True), fill='#202124')
draw.text((84,212), 'Cannot decide?', font=font(36,True), fill='#202124')
draw.text((84,264), 'Give it a spin.', font=font(36), fill='#a51e2b')
draw.text((84,341), 'Food. Plans. Who goes first.', font=font(22), fill='#595447')
wheel = mascot.resize((328,328),Image.Resampling.LANCZOS)
feature.paste(wheel,(620,86),wheel)
feature.save(OUT / 'feature-graphic.png')

for source in sorted((OUT / 'raw').glob('*.jpg')):
    screen = Image.open(source).convert('RGB')
    # Browser capture has minor pixel rounding; fit without distorting the UI.
    ImageOps.fit(screen,(1080,1920),method=Image.Resampling.LANCZOS).save(OUT / (source.stem+'.png'))

for path in sorted(OUT.glob('*.png')):
    img = Image.open(path)
    print(f'{path.name}: {img.size}, {img.mode}, {path.stat().st_size:,} bytes')
