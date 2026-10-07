import { readFile, writeFile } from 'node:fs/promises';

const path = 'FontaTicket_Catalogo_CORREGIDO/productos.json';
const products = JSON.parse(await readFile(path, 'utf8'));
const product = products.find((item) => item.id === 'obramat-valvula-esfera-nile-palanca-mh');
if (!product) throw new Error('No se encontró el producto NILE M-H');
product.nombre = 'Válvula esfera PN-25 de palanca NILE roscada macho-hembra';
for (const variant of product.variants ?? []) variant.description = null;
await writeFile(path, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Nombre actualizado; ${product.variants.length} medidas conservadas.`);
