import { readFile, writeFile } from 'node:fs/promises';

const path = 'FontaTicket_Catalogo_CORREGIDO/productos.json';
const products = JSON.parse(await readFile(path, 'utf8'));

// Ordered for a typical installation workflow: pipe systems and fittings first,
// then valves, fixing supplies and sanitary equipment.
const familyOrders = [
  ['Multicapa', [
    'multicapa-tubo-barra-4m',
    'multicapa-manguito-laton', 'multicapa-manguito-ppsu',
    'multicapa-manguito-reducido-laton', 'multicapa-manguito-reducido-ppsu',
    'multicapa-codo-90-laton', 'multicapa-codo-90-ppsu',
    'multicapa-codo-roscado', 'multicapa-codo-soporte',
    'multicapa-te-laton', 'multicapa-te-ppsu',
    'multicapa-te-reducida-laton', 'multicapa-te-reducida-ppsu', 'multicapa-te-roscada',
    'multicapa-entronque-rosca', 'multicapa-racor-loco', 'multicapa-tapon-press',
  ]],
  ['Cobre', [
    'cobre-tuberia-barra-25m', 'cobre-manguito', 'cobre-manguito-reducido',
    'cobre-codo-45', 'cobre-codo-90', 'cobre-curva-90', 'cobre-codo-laton', 'cobre-codo-placa-laton',
    'cobre-te', 'cobre-te-laton', 'cobre-entronque-laton', 'cobre-racor-loco-recto', 'cobre-racor-loco-curvo',
    'cobre-salto', 'cobre-tapon',
  ]],
  ['Latón roscado', [
    '0a634dd6-60ca-433b-baf2-007ff9cba64c', '67fd810e-d55b-497a-a0ff-1c4af3c84ffb',
    '17691a8a-e59f-416b-a68e-594ad304f684', '3376a74a-1193-4830-a973-e7e9ab0ca009',
    '7d62f37e-2be7-4f4e-aa52-77cc28ab7ef5', '6aa3fe6a-6f18-4874-94e2-dac174fbfca3',
    '4ebde761-9b8b-4573-bba4-6c3ea5156d1f', 'f1cbb383-caee-4484-8deb-5a6a8e378e5d',
    'obramat-excentrica-10509961', 'obramat-excentrica-grande-10219321',
  ]],
  ['SAMBRA', [
    'sambra-codo-roscado', 'sambra-entronque-roscado', 'sambra-te-roscada',
    'sambra-manguito', 'sambra-codo-90', 'sambra-te',
  ]],
  ['FITTING PUSH-FIT PLASSON', [
    'plasson-pushfit-codo', 'plasson-pushfit-codo-grifo', 'plasson-pushfit-manguito', 'plasson-pushfit-t',
    'plasson-pushfit-codo-roscado', 'plasson-pushfit-enlace-roscado', 'plasson-pushfit-t-roscada',
  ]],
  ['PVC presion', [
    'product-pvc-presion-tubo',
    'variant-91691-91791-92391-91632-91732-92332-91640-91740-92340',
    'variant-90691-90091-90191-90632-90032-90132-90640-90040-90140',
    'variant-90991-90932-90940', 'variant-91591-90991-91091-91532-90932-91032-91540-90940-91040',
    'variant-93141', 'variant-93141-95291-93591-95391-95232-93532-95332-95532-95240-93540-95340-95540',
  ]],
  ['PVC evacuacion', [
    'product-pvc-tubo', 'product-pvc-hidrotubo',
    'variant-52137-52132-52133-52837-52832-52833',
    'variant-52025-52005-52113-52035-52219-52015-52008-52020-52209-52000-52030-52206-52010-52021-52210-52001-52031-52207-52011-52855-52815-52820-52800-52821-52801-51209-51020-51010-51206-51030-51001-51210-51011',
    'variant-52073-52070-52071-51070',
    'variant-52055-52073-52045-52216-52236-52065-52250-52050-52228-52070-52440-52243-52060-52051-52204-52229-52071-52041-52257-52241-52061-52845-52865-52850-52880-52851-52881-51050-52510-52710-52595-51070-51060',
    'variant-50622-52115', 'variant-52156-52278-52357-52356-52354-52151-52152-50622-52115',
    'product-pvc-evacuacion-tapones-reducidos',
  ]],
  ['Llaves de paso, de escuadra y grifos de jardín', [
    'obramat-valvula-esfera-nile-palanca-mh', 'obramat-llave-escuadra-corta-25055968',
    'obramat-llave-lavadora-25055969', 'obramat-grifo-jardin-arco',
    'obramat-grifo-antihielo-25084058', 'obramat-grifo-jardin-doble-25127565',
  ]],
  ['Abrazaderas', ['abra-isofonica', 'abra-pvc-blanca', 'abra-sin-fin-w2-9']],
  ['Latiguillos', ['ferrocano-latiguillo-standard', 'ferrocano-latiguillo-giant']],
  ['Sifones y válvulas', [
    'tecnoagua-50315', 'tecnoagua-50343', 'tecnoagua-50345', 'tecnoagua-50331', 'tecnoagua-50532', 'tecnoagua-50534',
    'tecnoagua-50041', 'tecnoagua-50056', 'tecnoagua-50059', 'tecnoagua-50253', 'tecnoagua-50475',
    'tecnoagua-50506', 'tecnoagua-50510', 'tecnoagua-50512', 'tecnoagua-50063', 'tecnoagua-50205',
    'tecnoagua-50862', 'tecnoagua-50803', 'tecnoagua-50849', 'tecnoagua-50804',
    'tecnoagua-50805', 'tecnoagua-50830', 'tecnoagua-50810', 'tecnoagua-50855',
  ]],
  ['Accesorios WC', [
    '5d136f0e-3ae8-4a91-84c8-631674851c16', 'db047bcf-1c03-4de3-bb75-1c0588c655dc',
    'e7a3d9aa-73df-4612-9eba-faec74b8ea67', 'ff27eaf4-106d-427f-b916-0af5a6d6e484',
    'c6099399-a5a3-4168-bc6f-7c4da038812f', '28665d56-b3fa-4993-940b-a06abfff0d93',
    '4f7455de-c7f9-493d-8ad4-4b04e2393eef', '8a454312-4a6e-43a5-9558-de8d2455b716',
    '21946043-91ae-41ff-a5d8-98891ecd06b3', 'bef76a00-a36c-4a89-bc23-3e02012f74b8',
    'variant-50744-50724', '346a0290-adc1-49ea-a4a1-3d90886e47c2', '23d7cf69-8928-4906-aa7a-050f7a156279',
    'e4041e40-9f74-451c-ab5f-fb0599a85f57', 'ce6b565e-5b27-4c96-9c1d-2edf7d341dd4',
    '5dac73fb-621d-4ef8-86f5-359cd3baf704', 'variant-50610-50613', 'variant-50615-50611',
    'd2368358-ce5c-47b8-8adc-13d79c0fff93', '3d7c7a68-b1a1-4228-834d-23a8298406b1',
  ]],
  ['Grifería', [
    'f2297ca0-0514-4de9-9b34-bdb70c87476a', '504f5e62-467a-47eb-b339-326994bd3218',
    '08bdaeb4-a5c3-4d08-b100-0548118a8745', 'a0a199c9-f69e-4e71-b751-524b60745ebd',
    'ef0a7f1b-ca1e-4a60-aa20-e3d10ddbc29c',
  ]],
  ['Sanitarios', ['bb7bb9fd-781f-4591-a51f-3010c4cbaec5', '004cedc3-4ef4-4586-903b-a02dfefe6ae2']],
  ['Termos eléctricos', ['35226e82-decb-4505-b257-e19112236646', '0b7496f3-ad2f-4776-a071-19d506a99590', '0cfcdcf9-8e4a-4133-9c0d-5605e085480b']],
  ['Calentadores de gas', [
    '96880f35-23d2-4fbb-bd1c-50b31b2583f3', '84664d99-e625-4990-a6cf-58d63ba35e41',
    '5e6b9f51-ef28-4194-968d-3f5b1932ca20', 'fe695b41-b125-4e23-b377-7008e2dde240',
    'a432394a-59cb-4817-b552-ba9802a7c631', '26bf4e7e-a54c-43dd-882f-0c49c8b057d8',
  ]],
];

const familyOrder = new Map(familyOrders.map(([family], index) => [family, index + 1]));
const productOrder = new Map(familyOrders.flatMap(([, ids]) => ids.map((id, index) => [id, index + 1])));
const allIds = new Set(products.map((p) => p.id));
const orderedIds = [...productOrder.keys()];
const missingIds = [...allIds].filter((id) => !productOrder.has(id));
const extraIds = orderedIds.filter((id) => !allIds.has(id));
if (missingIds.length || extraIds.length || orderedIds.length !== new Set(orderedIds).size) {
  throw new Error(`Orden incompleto o duplicado. Faltan: ${missingIds.join(', ')}. Desconocidos: ${extraIds.join(', ')}`);
}

function normalizedName(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[\s_-]+/g, '');
}
function parseNumbers(value) {
  const tokens = String(value ?? '').match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?/g) ?? [];
  return tokens.map((token) => {
    if (token.includes('/')) {
      const [whole, fraction] = token.trim().split(/\s+/);
      const [numerator, denominator] = (fraction ?? whole).split('/').map(Number);
      return (fraction ? Number(whole) : 0) + numerator / denominator;
    }
    return Number(token.replace(',', '.'));
  });
}
function compareValues(a, b) {
  const left = parseNumbers(a), right = parseNumbers(b);
  for (let i = 0; i < Math.min(left.length, right.length); i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  if (left.length !== right.length) return left.length - right.length;
  return String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' });
}
function attributeRank(key) {
  const name = normalizedName(key);
  const ranks = {
    medida: 0, diametro: 0, pulgadas: 1, longitud: 2, angulo: 3,
    configuracion: 4, conexion: 4, tipo: 5, presentacion: 6, modelo: 7,
  };
  return ranks[name] ?? 8;
}
function compareVariants(a, b) {
  const keys = [...new Set([...Object.keys(a.attributes ?? {}), ...Object.keys(b.attributes ?? {})])]
    .filter((key) => a.attributes?.[key] != null || b.attributes?.[key] != null)
    .sort((x, y) => attributeRank(x) - attributeRank(y) || normalizedName(x).localeCompare(normalizedName(y)));
  for (const key of keys) {
    const left = a.attributes?.[key], right = b.attributes?.[key];
    if (left == null || right == null) return left == null ? -1 : 1;
    const diff = compareValues(left, right);
    if (diff) return diff;
  }
  return String(a.reference ?? '').localeCompare(String(b.reference ?? ''), 'es', { numeric: true });
}

for (const product of products) {
  const family = product.family?.trim() || product.category?.trim() || 'Sin familia';
  const order = familyOrder.get(family);
  if (!order) throw new Error(`Familia sin orden: ${family}`);
  product.catalogFamilyOrder = order;
  product.catalogProductOrder = productOrder.get(product.id);
  if (product.variants?.length) product.variants.sort(compareVariants);
}
products.sort((a, b) => a.catalogFamilyOrder - b.catalogFamilyOrder || a.catalogProductOrder - b.catalogProductOrder);
await writeFile(path, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Orden guardado: ${products.length} productos, ${familyOrders.length} familias y variantes por tamaño.`);
