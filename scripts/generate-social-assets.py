"""Generate deterministic social artwork from the existing brand, with exact text."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
FONT_DIR = Path('C:/Windows/Fonts')
BG, INK, BLUE, LIME, MUTED = '#f6f7f2', '#19251f', '#173df6', '#dfff8b', '#667063'
SCALE = 2

def font(size, bold=False):
    return ImageFont.truetype(str(FONT_DIR / ('segoeuib.ttf' if bold else 'segoeui.ttf')), round(size * SCALE))

def text(draw, position, value, size, color=INK, bold=False):
    draw.text(tuple(round(v * SCALE) for v in position), value, font=font(size, bold), fill=color, anchor='lt')

def box(draw, bounds, fill, radius=0):
    draw.rounded_rectangle(tuple(round(v * SCALE) for v in bounds), radius=round(radius * SCALE), fill=fill)

def mark(size):
    image = Image.new('RGB', (size * SCALE, size * SCALE), INK)
    draw = ImageDraw.Draw(image)
    text(draw, (size * .1, size * .33), '30', size * .50, LIME, True)
    points = [(size * .65, size * .36), (size * .81, size * .20)]
    draw.line([(int(x * SCALE), int(y * SCALE)) for x, y in points], fill=LIME, width=max(2, round(size * .037 * SCALE)))
    draw.line([(int(size * .68 * SCALE), int(size * .20 * SCALE)), (int(size * .81 * SCALE), int(size * .20 * SCALE)), (int(size * .81 * SCALE), int(size * .33 * SCALE))], fill=LIME, width=max(2, round(size * .037 * SCALE)))
    return image.resize((size, size), Image.Resampling.LANCZOS)

canvas = Image.new('RGB', (1200 * SCALE, 630 * SCALE), BG)
draw = ImageDraw.Draw(canvas)
box(draw, (64, 51, 128, 115), INK, 16)
logo_mask = Image.new('L', (64 * SCALE, 64 * SCALE), 0)
ImageDraw.Draw(logo_mask).rounded_rectangle((0, 0, 64 * SCALE - 1, 64 * SCALE - 1), radius=16 * SCALE, fill=255)
canvas.paste(mark(64 * SCALE), (64 * SCALE, 51 * SCALE), logo_mask)
text(draw, (145, 57), 'hablemos', 34, INK, True)
left = 145 + draw.textlength('hablemos', font=font(34, True)) / SCALE
text(draw, (left, 57), '30min', 34, BLUE, True)
text(draw, (147, 99), 'CON YANKIEL', 12, MUTED, True)

text(draw, (64, 183), 'Tu idea.', 76, INK, True)
text(draw, (64, 271), 'Mi experiencia.', 76, INK, True)
text(draw, (64, 359), 'Un plan claro.', 76, BLUE, True)

box(draw, (833, 183, 1136, 455), LIME, 22)
text(draw, (864, 211), 'UNA CONSULTA', 16, INK, True)
text(draw, (860, 249), '30 min', 56, INK, True)
text(draw, (864, 328), '$49 USD', 36, INK, True)
text(draw, (864, 390), 'Pago único · En español', 17, INK)

draw.line([(64 * SCALE, 509 * SCALE), (1136 * SCALE, 509 * SCALE)], fill='#dce2d5', width=2)
text(draw, (64, 535), 'IA · Sitios web · Aplicaciones · Diseño', 23, MUTED)
text(draw, (833, 539), 'hablemos30min.online', 22, INK, True)
canvas.resize((1200, 630), Image.Resampling.LANCZOS).save(OUT / 'og-hablemos30min.png', optimize=True)

for size, name in [(96, 'favicon-96.png'), (180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    mark(size).save(OUT / name, optimize=True)
mark(64).save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('Social image 1200x630 and brand icons generated')
