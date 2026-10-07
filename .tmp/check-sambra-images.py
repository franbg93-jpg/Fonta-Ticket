from pathlib import Path
from PIL import Image
p=Path('FontaTicket_Catalogo_CORREGIDO/imagenes')
for name in ['sambra-entronque.jpg','sambra-te.jpg','sambra-te-roscada.jpg','sambra-codo-roscado.jpg','sambra-codo.jpg','sambra-manguito.jpg']:
 im=Image.open(p/name)
 assert im.format=='JPEG' and im.size==(1000,1000), (name,im.format,im.size)
 print(name,im.format,im.size)
