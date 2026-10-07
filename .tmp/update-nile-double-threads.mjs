import { readFile, writeFile } from 'node:fs/promises';

const path = 'FontaTicket_Catalogo_CORREGIDO/productos.json';
const products = JSON.parse(await readFile(path, 'utf8'));
const product = products.find((item) => item.id === 'obramat-valvula-esfera-nile-palanca-mh');
if (!product) throw new Error('No se encontró la familia NILE macho-hembra');
for (const variant of product.variants ?? []) {
  const size = variant.attributes.Pulgadas;
  if (!size) throw new Error(`Variante sin pulgadas: ${variant.reference}`);
  variant.attributes.Pulgadas = `${size} × ${size}`;
}
await writeFile(path, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log('Se guardó la medida de ambas bocas en las cuatro variantes NILE.');
