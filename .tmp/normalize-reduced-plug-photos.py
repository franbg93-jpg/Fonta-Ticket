from pathlib import Path
from PIL import Image, ImageChops
root=Path.cwd(); work=root/'.tmp'; images=root/'FontaTicket_Catalogo_CORREGIDO'/'imagenes'
# Coordinates correspond to the 210 dpi renders; scale to high-resolution renders.
scale=400/210
specs=[
 (129,(170,950,390,1190),'tapones-reducidos-triple.png'),
 (129,(170,1260,390,1510),'tapones-reducidos-doble.png'),
 (130,(170,230,420,520),'tapones-reducidos-simple.png'),
]
def normalize(im, size=1000, max_product=820):
 im=im.convert('RGB')
 diff=ImageChops.difference(im,Image.new('RGB',im.size,'white')).convert('L')
 mask=diff.point(lambda p:255 if p>18 else 0)
 box=mask.getbbox()
 if not box: raise ValueError('No se detectó la pieza')
 l,t,r,b=box; pad=max(8,round(max(r-l,b-t)*.025)); l=max(0,l-pad);t=max(0,t-pad);r=min(im.width,r+pad);b=min(im.height,b+pad)
 im=im.crop((l,t,r,b)); factor=max_product/max(im.size); dims=(max(1,round(im.width*factor)),max(1,round(im.height*factor)))
 im=im.resize(dims,Image.Resampling.LANCZOS)
 out=Image.new('RGB',(size,size),'white');out.paste(im,((size-im.width)//2,(size-im.height)//2));return out
for page,box,name in specs:
 src=Image.open(work/f'tapones-hires-{page}.png').convert('RGB')
 scaled=tuple(round(v*scale) for v in box)
 result=normalize(src.crop(scaled))
 result.save(images/name,'PNG',optimize=True)
 print(name,'page',src.size,'box',scaled)
