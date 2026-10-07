import { readFile, writeFile } from 'node:fs/promises';

const path = 'FontaTicket_Catalogo_CORREGIDO/productos.json';
const products = JSON.parse(await readFile(path, 'utf8'));
const family = 'Llaves de paso, de escuadra y grifos de jardín';
const date = '2026-10-07';
const base = (id, nombre, foto, type, sourceUrl, brand = 'Obramat') => ({
  id, reference: null, nombre, precio: null, foto: `imagenes/${foto}`,
  category: family, supplier: 'Obramat', family, type,
  size: null, connection: null, variant: null, length: null,
  manufacturerReference: null, sourceUrl, priceDate: date,
  priceSource: sourceUrl, sourcePrice: null, priceUnit: 'unidad por variante',
  priceIncludesVat: true, brand, model: null, supplierReference: null,
  priceStatus: 'VARIANTES', priceMethod: 'Obramat x1.30', variants: []
});
const variant = (reference, name, inches, sourcePrice, url, extras = {}) => ({
  reference, price: Math.round(sourcePrice * 130) / 100,
  description: name, photo: null,
  attributes: { Pulgadas: inches, ...extras },
  sourcePrice, priceDate: date, priceSource: url, sourceUrl: url,
  priceUnit: 'unidad', priceIncludesVat: true, priceMethod: 'Obramat x1.30',
  supplierReference: reference
});
const single = (id, reference, nombre, foto, type, sourcePrice, sourceUrl, priceUnit = 'unidad', brand = 'Obramat') => ({
  id, reference, nombre, precio: Math.round(sourcePrice * 130) / 100,
  foto: `imagenes/${foto}`, category: family, supplier: 'Obramat', family,
  type, size: null, connection: null, variant: null, length: null,
  manufacturerReference: reference, sourceUrl, priceDate: date,
  priceSource: sourceUrl, sourcePrice, priceUnit, priceIncludesVat: true,
  brand, model: null, supplierReference: reference,
  priceStatus: 'PRECIO_CALCULADO', priceMethod: 'Obramat x1.30'
});

const records = [
  single('obramat-grifo-antihielo-25084058', '25084058', 'GRIFO JARDÍN ANTIHIELO 1/2"X3/4"', 'obramat-grifo-antihielo-25084058.webp', 'Grifo jardín antihielo', 4.85, 'https://www.obramat.es/productos/grifo-jardin-antihielo-1-2-x3-4-25084058.html'),
  (() => {
    const p = base('obramat-grifo-jardin-arco', 'Grifo jardín ARCO', 'obramat-grifo-jardin.webp', 'Grifo de jardín sencillo', 'https://www.obramat.es/productos/grifo-jardin-1-2-x3-4-25127568.html', 'ARCO');
    p.variants = [
      variant('25127568', 'GRIFO JARDIN 1/2"X3/4"', '1/2 × 3/4', 4.10, 'https://www.obramat.es/productos/grifo-jardin-1-2-x3-4-25127568.html'),
      variant('25127567', 'GRIFO JARDÍN 3/4"-1"', '3/4 × 1', 5.00, 'https://www.obramat.es/productos/grifo-jardin-3-4-1-25127567.html'),
      variant('25127569', 'GRIFO JARDÍN 1"-1 1/4"', '1 × 1 1/4', 7.05, 'https://www.obramat.es/productos/grifo-jardin-1-1-1-4-25127569.html')
    ];
    return p;
  })(),
  single('obramat-grifo-jardin-doble-25127565', '25127565', 'GRIFO JARDÍN DOBLE 1/2"-3/4"', 'obramat-grifo-jardin-doble-25127565.webp', 'Grifo de jardín doble salida', 9.35, 'https://www.obramat.es/productos/grifo-jardin-doble-1-2-3-4-25127565.html', 'unidad', 'ARCO'),
  single('obramat-llave-escuadra-corta-25055968', '25055968', 'LLAVE DE CORTE ESCUADRA CORTA 1/2"- 3/8" 2 UDS', 'obramat-llave-escuadra-corta-25055968.webp', 'Llave de corte de escuadra corta', 3.15, 'https://www.obramat.es/productos/llave-de-corte-escuadra-corta-1-2-3-8-2-uds-25055968.html', 'unidad comercial (2 llaves)'),
  single('obramat-llave-lavadora-25055969', '25055969', 'LLAVE LAVADORA 1/2"X3/4"', 'obramat-llave-lavadora-25055969.webp', 'Llave de lavadora', 3.30, 'https://www.obramat.es/productos/llave-lavadora-1-2-x3-4-25055969.html'),
  (() => {
    const p = base('obramat-valvula-esfera-nile-palanca-mh', 'VÁLVULA ESFERA PN-25 PALANCA NILE M-H', 'obramat-valvula-esfera-nile-mh.webp', 'Válvula de esfera PN-25 de palanca roscada macho-hembra', 'https://www.obramat.es/productos/valvula-esfera-pn-25-palanca-nile-3-8-m-h-25098669.html', 'ARCO');
    p.variants = [
      variant('25098669', 'VÁLVULA ESFERA PN-25 PALANCA NILE 3/8" M-H', '3/8', 2.45, 'https://www.obramat.es/productos/valvula-esfera-pn-25-palanca-nile-3-8-m-h-25098669.html', { Conexión: 'Macho-Hembra' }),
      variant('25101062', 'VÁLVULA ESFERA PN-25 PALANCA NILE 1/2" M-H', '1/2', 3.35, 'https://www.obramat.es/productos/valvula-esfera-pn-25-palanca-nile-1-2-m-h-25101062.html', { Conexión: 'Macho-Hembra' }),
      variant('25104283', 'VÁLVULA ESFERA PN-25 PALANCA NILE 3/4" M-H', '3/4', 4.90, 'https://www.obramat.es/productos/valvula-esfera-pn-25-palanca-nile-3-4-m-h-25104283.html', { Conexión: 'Macho-Hembra' }),
      variant('25104284', 'VÁLVULA ESFERA PN-25 PALANCA NILE 1" M-H', '1', 7.45, 'https://www.obramat.es/productos/valvula-esfera-pn-25-palanca-nile-1-m-h-25104284.html', { Conexión: 'Macho-Hembra' })
    ];
    return p;
  })()
];

const refs = new Set(products.flatMap(p => [p.reference, ...(p.variants ?? []).map(v => v.reference)].filter(Boolean)));
for (const p of records) {
  for (const reference of [p.reference, ...(p.variants ?? []).map(v => v.reference)].filter(Boolean)) {
    if (refs.has(reference)) throw new Error(`Referencia ya existente: ${reference}`);
    refs.add(reference);
  }
}
products.push(...records);
await writeFile(path, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Añadidos ${records.length} productos padre y ${records.reduce((n, p) => n + (p.variants?.length ?? 0), 0)} variantes.`);
