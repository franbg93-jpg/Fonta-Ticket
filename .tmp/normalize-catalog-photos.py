from pathlib import Path
from PIL import Image, ImageChops

root = Path.cwd()
work = root / '.tmp'
images = root / 'FontaTicket_Catalogo_CORREGIDO' / 'imagenes'

sambra = {
    '4405254': 'sambra-entronque.jpg',
    '4398475': 'sambra-te.jpg',
    '4421292': 'sambra-te-roscada.jpg',
    '4406154': 'sambra-codo-roscado.jpg',
    '4396504': 'sambra-codo.jpg',
    '4406465': 'sambra-manguito.jpg',
}

def trim_white(im, threshold=18):
    white = Image.new('RGB', im.size, 'white')
    diff = ImageChops.difference(im, white).convert('L')
    mask = diff.point(lambda p: 255 if p > threshold else 0)
    box = mask.getbbox()
    if not box:
        raise ValueError('No product pixels detected')
    l,t,r,b = box
    pad = max(8, round(max(r-l,b-t)*0.025))
    l=max(0,l-pad); t=max(0,t-pad); r=min(im.width,r+pad); b=min(im.height,b+pad)
    return im.crop((l,t,r,b))

def normalize(im, size=1000, product=820):
    im = trim_white(im.convert('RGB'))
    im.thumbnail((product,product), Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(size,size),'white')
    canvas.paste(im,((size-im.width)//2,(size-im.height)//2))
    return canvas

for media_id, filename in sambra.items():
    src=Image.open(work / f'sambra-{media_id}.jpg')
    normalized=normalize(src)
    normalized.save(images / filename, 'JPEG', quality=92, optimize=True)
    print(filename, src.size, '->', normalized.size)

# Extract each matching model photo from the 2026 Tecnoagua catalog pages.
# Physical page 129: reduced plugs with 3 and 2 outlets. Physical page 130: 1 outlet.
specs = [
    (129, (170, 950, 390, 1190), 'tapones-reducidos-triple.png'),
    (129, (170, 1260, 390, 1510), 'tapones-reducidos-doble.png'),
    (130, (170, 230, 420, 520), 'tapones-reducidos-simple.png'),
]
for page, box, filename in specs:
    page_image=Image.open(work / f'tapones-detail-{page}.png').convert('RGB')
    crop=page_image.crop(box)
    result=normalize(crop)
    result.save(images / filename, 'PNG', optimize=True)
    print(filename, 'crop', box, 'from', page_image.size)
