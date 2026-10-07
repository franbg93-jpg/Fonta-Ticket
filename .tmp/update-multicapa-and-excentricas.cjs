const fs = require('fs');
const file = 'FontaTicket_Catalogo_CORREGIDO/productos.json';
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const replaceIds = new Set(['variant-10466134','variant-25025768-10269322-10269336','variant-25025723-10285300-10285303']);
const base = rows.filter(p => !replaceIds.has(p.id));
const date = '2026-10-07';
const url = slug => `https://www.obramat.es/productos/${slug}.html`;
const price = p => Math.floor(p * 130 + 0.0000001) / 100;
function product(id, name, type, photo, variants, exampleUrl, priceUnit='unidad por variante') {
  const parentUrl = url(exampleUrl);
  return {
    id, reference:null, nombre:name, precio:null, foto:`imagenes/${photo}`,
    category:'Multicapa', supplier:'Obramat', family:'Multicapa', type,
    size:null, connection:null, variant:null, length:null, manufacturerReference:null,
    sourceUrl:parentUrl, priceDate:date, priceSource:parentUrl, sourcePrice:null,
    priceUnit, priceIncludesVat:true, brand:'ISOLTUBEX', model:null, supplierReference:null,
    priceStatus:'VARIANTES', priceMethod:'Obramat x1.30',
    variants:variants.map(v=>({
      reference:v.ref, price:price(v.raw), description:v.desc,
      photo:null, attributes:v.attrs,
      sourcePrice:v.raw, priceDate:date, priceSource:url(v.slug), sourceUrl:url(v.slug),
      priceUnit:v.unit||'unidad', priceIncludesVat:true, priceMethod:'Obramat x1.30', supplierReference:v.ref
    }))
  };
}
const v=(ref,raw,desc,attrs,slug,unit)=>({ref:String(ref),raw,desc,attrs,slug,unit});
const mm=n=>`${n} mm`;
const pp=(n,m)=>`${n} × ${m} mm`;
const products=[];
products.push(product('multicapa-tubo-barra-4m','Tubo multicapa barra 4 m','Tubo multicapa', 'obramat-multicapa-tubo-4m.webp',[
 v('10285233',3.20,'Tubo multicapa 16 mm, barra 4 m',{Medida:mm(16),Longitud:'4 m'},'tubo-multicapa-16mm-barra-4m-10285233','barra de 4 m'),
 v('10285275',4.15,'Tubo multicapa 20 mm, barra 4 m',{Medida:mm(20),Longitud:'4 m'},'tubo-multicapa-20mm-barra-4m-10285275','barra de 4 m'),
 v('10285303',8.10,'Tubo multicapa 25 mm, barra 4 m',{Medida:mm(25),Longitud:'4 m'},'tubo-multicapa-25mm-barra-4m-10285303','barra de 4 m'),
 v('10468913',13.20,'Tubo multicapa 32 mm, barra 4 m',{Medida:mm(32),Longitud:'4 m'},'tubo-multicapa-32mm-barra-4m-10468913','barra de 4 m')
],'tubo-multicapa-16mm-barra-4m-10285233','barra de 4 m'));
products.push(product('multicapa-codo-90-laton','Codo 90° multicapa press latón','Codo 90° press×press','obramat-multicapa-codo-90-laton.webp',[
 v('10269364',1.75,'Codo 90° latón multicapa 16 mm',{Medida:mm(16)},'codo-90-16mm-multicapa-10269364'),v('10269371',2.45,'Codo 90° latón multicapa 20 mm',{Medida:mm(20)},'codo-90-20mm-multicapa-10269371'),v('10269385',4.15,'Codo 90° latón multicapa 25 mm',{Medida:mm(25)},'codo-90-25mm-multicapa-10269385'),v('10466120',5.70,'Codo 90° latón multicapa 32 mm',{Medida:mm(32)},'codo-90-32mm-multicapa-10466120')
],'codo-90-20mm-multicapa-10269371'));
products.push(product('multicapa-codo-90-ppsu','Codo 90° multicapa press PPSU','Codo 90° press×press','obramat-multicapa-codo-90-ppsu.webp',[
 v('25028717',1.35,'Codo 90° PPSU multicapa 16 mm',{Medida:mm(16)},'codo-90-ppsu-16mm-multicapa-25028717'),v('25028716',1.90,'Codo 90° PPSU multicapa 20 mm',{Medida:mm(20)},'codo-90-ppsu-20mm-multicapa-25028716'),v('25028709',3.25,'Codo 90° PPSU multicapa 25 mm',{Medida:mm(25)},'codo-90-ppsu-25mm-multicapa-25028709'),v('25028718',4.70,'Codo 90° PPSU multicapa 32 mm',{Medida:mm(32)},'codo-90-ppsu-32mm-multicapa-25028718')
],'codo-90-ppsu-16mm-multicapa-25028717'));
products.push(product('multicapa-codo-roscado','Codo 90° multicapa press×rosca latón','Codo 90° press×rosca','obramat-multicapa-codo-roscado.webp',[
 v('10269441',2.25,'Codo 90° multicapa 16 mm × 1/2 hembra',{Medida:mm(16),Pulgadas:'1/2',Conexión:'Hembra'},'codo-90-16mmx1-2-hembra-multicapa-10269441'),v('10269455',2.55,'Codo 90° multicapa 20 mm × 1/2 hembra',{Medida:mm(20),Pulgadas:'1/2',Conexión:'Hembra'},'codo-90-20mmx1-2-hembra-multicapa-10269455'),v('10536141',2.20,'Codo 90° multicapa 16 mm × 1/2 macho',{Medida:mm(16),Pulgadas:'1/2',Conexión:'Macho'},'codo-90-16mmx1-2-macho-multicapa-10536141'),v('10485454',2.70,'Codo 90° multicapa 20 mm × 3/4 hembra',{Medida:mm(20),Pulgadas:'3/4',Conexión:'Hembra'},'codo-90-20mmx3-4-hembra-multicapa-10485454')
],'codo-90-16mmx1-2-hembra-multicapa-10269441'));
products.push(product('multicapa-codo-soporte','Codo con soporte multicapa press×rosca latón','Codo con soporte press×rosca','obramat-multicapa-codo-soporte.webp',[
 v('10269504',3.40,'Codo con soporte multicapa 16 mm × 1/2 hembra',{Medida:mm(16),Pulgadas:'1/2',Conexión:'Hembra'},'codo-placa-16mmx1-2-hembra-multicapa-10269504'),v('10269476',3.40,'Codo con soporte multicapa 20 mm × 1/2 hembra',{Medida:mm(20),Pulgadas:'1/2',Conexión:'Hembra'},'codo-placa-20mmx1-2-hembra-multicapa-10269476')
],'codo-placa-16mmx1-2-hembra-multicapa-10269504'));
products.push(product('multicapa-te-laton','Te multicapa press latón','Te press×press','obramat-multicapa-te-laton.webp',[
 v('10269392',2.35,'Te latón multicapa 16 mm',{Medida:'16 × 16 × 16 mm'},'te-16mm-multicapa-10269392'),v('10269406',3.55,'Te latón multicapa 20 mm',{Medida:'20 × 20 × 20 mm'},'te-20mm-multicapa-10269406'),v('10269413',5.80,'Te latón multicapa 25 mm',{Medida:'25 × 25 × 25 mm'},'te-25mm-multicapa-10269413'),v('10466162',8.30,'Te latón multicapa 32 mm',{Medida:'32 × 32 × 32 mm'},'te-32mm-multicapa-10466162')
],'te-16mm-multicapa-10269392'));
products.push(product('multicapa-te-ppsu','Te multicapa press PPSU','Te press×press','obramat-multicapa-te-ppsu.webp',[
 v('25028735',2.00,'Te PPSU multicapa 16 mm',{Medida:'16 × 16 × 16 mm'},'te-ppsu-16mm-multicapa-25028735'),v('25028741',2.80,'Te PPSU multicapa 20 mm',{Medida:'20 × 20 × 20 mm'},'te-ppsu-20mm-multicapa-25028741'),v('25028743',4.60,'Te PPSU multicapa 25 mm',{Medida:'25 × 25 × 25 mm'},'te-ppsu-25mm-multicapa-25028743'),v('25028734',6.70,'Te PPSU multicapa 32 mm',{Medida:'32 × 32 × 32 mm'},'te-ppsu-32mm-multicapa-25028734')
],'te-ppsu-16mm-multicapa-25028735'));
products.push(product('multicapa-te-reducida-laton','Te reducida multicapa press latón','Te reducida press×press','obramat-multicapa-te-reducida.webp',[
 ['10269420',3.05,'20 × 16 × 20','te-reducida-20x16x20mm-multicapa-10269420'],['10269434',5.45,'25 × 20 × 25','te-reducida-25x20x25mm-multicapa-10269434'],['10278611',2.65,'20 × 16 × 16','te-reducida-20x16x16mm-multicapa-10278611'],['10485475',4.75,'20 × 25 × 20','te-reducida-20x25x20mm-multicapa-10485475'],['10485461',3.20,'20 × 20 × 16','te-reducida-20x20x16mm-multicapa-10485461'],['25057184',3.05,'16 × 20 × 16','te-reducida-16x20x16mm-multicapa-25057184'],['10466190',6.85,'32 × 25 × 32','te-reducida-32x25x32mm-multicapa-10466190'],['10466183',6.80,'32 × 20 × 32','te-reducida-32x20x32mm-multicapa-10466183'],['10485482',4.55,'25 × 16 × 25','te-reducida-25x16x25mm-multicapa-10485482'],['10485496',5.20,'25 × 25 × 20','te-reducida-25x25x20mm-multicapa-10485496'],['10466176',7.90,'32 × 16 × 32','te-reducida-32x16x32mm-multicapa-10466176']
].map(([r,p,m,s])=>v(r,p,`Te reducida latón multicapa ${m} mm`,{Medida:`${m} mm`},s)),'te-reducida-20x16x20mm-multicapa-10269420'));
products.push(product('multicapa-te-reducida-ppsu','Te reducida multicapa press PPSU','Te reducida press×press','obramat-multicapa-te-reducida-ppsu.webp',[
 v('25028698',2.45,'Te reducida PPSU multicapa 20 × 16 × 20 mm',{Medida:'20 × 16 × 20 mm'},'te-reducida-ppsu-20x16x20mm-multicapa-25028698')
],'te-reducida-ppsu-20x16x20mm-multicapa-25028698'));
products.push(product('multicapa-te-roscada','Te roscada multicapa press×rosca latón','Te roscada press×rosca','obramat-multicapa-te-roscada.webp',[
 v('10269616',3.00,'Te roscada multicapa 16 mm × 1/2 hembra',{Medida:mm(16),Pulgadas:'1/2',Conexión:'Hembra'},'te-roscada-16mmx1-2-hembra-multicapa-10269616'),v('10269623',3.60,'Te roscada multicapa 20 mm × 1/2 hembra',{Medida:mm(20),Pulgadas:'1/2',Conexión:'Hembra'},'te-roscada-20mmx1-2-hembra-multicapa-10269623'),v('10269630',5.15,'Te roscada multicapa 25 mm × 3/4 hembra',{Medida:mm(25),Pulgadas:'3/4',Conexión:'Hembra'},'te-roscada-25mmx3-4-hembra-multicapa-10269630')
],'te-roscada-16mmx1-2-hembra-multicapa-10269616'));
products.push(product('multicapa-manguito-laton','Manguito multicapa press latón','Manguito press×press','obramat-multicapa-manguito-laton.webp',[
 v('10269315',1.45,'Manguito latón multicapa 16 mm',{Medida:mm(16)},'manguito-16mm-multicapa-10269315'),v('10269322',2.05,'Manguito latón multicapa 20 mm',{Medida:mm(20)},'manguito-20mm-multicapa-10269322'),v('10269336',3.05,'Manguito latón multicapa 25 mm',{Medida:mm(25)},'manguito-25mm-multicapa-10269336'),v('10466071',4.05,'Manguito latón multicapa 32 mm',{Medida:mm(32)},'manguito-32mm-multicapa-10466071')
],'manguito-16mm-multicapa-10269315'));
products.push(product('multicapa-manguito-ppsu','Manguito multicapa press PPSU','Manguito press×press','obramat-multicapa-manguito-ppsu.webp',[
 v('25028740',1.20,'Manguito PPSU multicapa 16 mm',{Medida:mm(16)},'manguito-ppsu-16mm-multicapa-25028740'),v('25028733',1.65,'Manguito PPSU multicapa 20 mm',{Medida:mm(20)},'manguito-ppsu-20mm-multicapa-25028733'),v('25028732',2.60,'Manguito PPSU multicapa 25 mm',{Medida:mm(25)},'manguito-ppsu-25mm-multicapa-25028732'),v('25028722',3.55,'Manguito PPSU multicapa 32 mm',{Medida:mm(32)},'manguito-ppsu-32mm-multicapa-25028722')
],'manguito-ppsu-16mm-multicapa-25028740'));
products.push(product('multicapa-manguito-reducido-laton','Manguito reducido multicapa press latón','Manguito reducido press×press','obramat-multicapa-manguito-reducido.webp',[
 ['10269343',1.80,'20 × 16','manguito-reducido-20-16mm-multicapa-10269343'],['10485426',2.65,'25 × 16','manguito-reducido-25-16mm-multicapa-10485426'],['10485440',3.85,'32 × 25','manguito-reducido-32-25mm-multicapa-10485440'],['10485433',3.35,'32 × 20','manguito-reducido-32-20mm-multicapa-10485433'],['10269350',2.65,'25 × 20','manguito-reducido-25-20mm-multicapa-10269350']
].map(([r,p,m,s])=>v(r,p,`Manguito reducido latón multicapa ${m} mm`,{Medida:`${m} mm`},s)),'manguito-reducido-20-16mm-multicapa-10269343'));
products.push(product('multicapa-manguito-reducido-ppsu','Manguito reducido multicapa press PPSU','Manguito reducido press×press','obramat-multicapa-manguito-reducido-ppsu.webp',[
 v('25028721',1.40,'Manguito reducido PPSU multicapa 20 × 16 mm',{Medida:'20 × 16 mm'},'manguito-reducido-20-16mm-multicapa-25028721'),v('25028719',2.20,'Manguito reducido PPSU multicapa 25 × 20 mm',{Medida:'25 × 20 mm'},'manguito-reducido-25-20mm-multicapa-25028719')
],'manguito-reducido-20-16mm-multicapa-25028721'));
products.push(product('multicapa-entronque-rosca','Entronque multicapa press×rosca latón','Entronque roscado press×rosca','obramat-multicapa-entronque.webp',[
 ['10269532',1.85,20,'1/2','Macho','entronque-rosca-20mmx1-2-macho-multicapa-10269532'],['10536260',2.55,20,'3/4','Macho','entronque-rosca-20mmx3-4-macho-multicapa-10536260'],['10269560',2.05,20,'1/2','Hembra','entronque-rosca-20mmx1-2-hembra-multicapa-10269560'],['10466036',3.90,32,'1','Macho','entronque-rosca-32mmx1-macho-multicapa-10466036'],['10269574',2.30,25,'3/4','Hembra','entronque-rosca-25mmx3-4-hembra-multicapa-10269574'],['10269525',1.60,16,'1/2','Macho','entronque-rosca-16mmx1-2-macho-multicapa-10269525'],['10269546',2.90,25,'3/4','Macho','entronque-rosca-25mmx3-4-macho-multicapa-10269546'],['10269553',1.85,16,'1/2','Hembra','entronque-rosca-16mmx1-2-hembra-multicapa-10269553'],['10466050',4.10,32,'1','Hembra','entronque-rosca-32mmx1-hembra-multicapa-10466050'],['10466064',3.80,32,'3/4','Hembra','entronque-rosca-32mmx3-4-hembra-multicapa-10466064'],['10466043',3.35,32,'3/4','Macho','entronque-rosca-32mmx3-4-macho-multicapa-10466043']
].map(([r,p,m,inch,sex,s])=>v(r,p,`Entronque multicapa ${m} mm × ${inch} ${sex.toLowerCase()}`,{Medida:mm(m),Pulgadas:inch,Conexión:sex},s)),'entronque-rosca-16mmx1-2-macho-multicapa-10269525'));
products.push(product('multicapa-racor-loco','Racor loco multicapa press×rosca latón','Racor loco press×rosca','obramat-multicapa-racor-loco.webp',[
 v('10485545',2.95,'Racor loco multicapa 20 mm × 3/4 hembra',{Medida:mm(20),Pulgadas:'3/4',Conexión:'Hembra'},'racor-loco-20mmx3-4-hembra-multicapa-10485545'),v('10269602',4.20,'Racor loco multicapa 25 mm × 3/4',{Medida:mm(25),Pulgadas:'3/4',Conexión:'Hembra'},'racor-loco-25mmx3-4-multicapa-10269602'),v('10269581',2.10,'Racor loco multicapa 16 mm × 1/2 hembra',{Medida:mm(16),Pulgadas:'1/2',Conexión:'Hembra'},'racor-loco-16mmx1-2-multicapa-10269581'),v('10269595',2.35,'Racor loco multicapa 20 mm × 1/2 hembra',{Medida:mm(20),Pulgadas:'1/2',Conexión:'Hembra'},'racor-loco-20mmx1-2-multicapa-10269595'),v('25031532',5.25,'Racor loco multicapa 32 mm × 1 hembra',{Medida:mm(32),Pulgadas:'1',Conexión:'Hembra'},'racor-loco-32mmx1-multicapa-25031532')
],'racor-loco-16mmx1-2-multicapa-10269581'));
products.push(product('multicapa-tapon-press','Tapón multicapa press','Tapón press','obramat-multicapa-tapon.webp',[
 v('10855110',1.30,'Tapón multicapa press 20 mm',{Medida:mm(20)},'tapon-20mm-multicapa-10855110'),v('10485601',1.10,'Tapón multicapa press 16 mm',{Medida:mm(16)},'tapon-16mm-multicapa-10485601')
],'tapon-16mm-multicapa-10485601'));
// Excentricas solicitadas expresamente dentro de la familia Latón roscado, aunque la grande sea PVC según ficha.
const eccs=[
 {id:'obramat-excentrica-10509961',ref:'10509961',name:'Juego excéntricas para grifo de cocina (latón)',raw:5.00,photo:'obramat-excentricas-grifo-cocina-10509961.webp',slug:'juego-excentricas-para-grifo-de-cocina-10509961'},
 {id:'obramat-excentrica-grande-10219321',ref:'10219321',name:'Juego excéntricas grandes para grifo de cocina (PVC)',raw:12.65,photo:'obramat-excentricas-grandes-grifo-cocina-10219321.webp',slug:'juego-excentricas-grandes-para-grifo-de-cocina-10219321'}
].map(e=>({id:e.id,reference:e.ref,nombre:e.name,precio:price(e.raw),foto:`imagenes/${e.photo}`,category:'Latón roscado',supplier:'Obramat',family:'Latón roscado',type:'Juego de excéntricas',size:null,connection:null,variant:null,length:null,manufacturerReference:e.ref,sourceUrl:url(e.slug),priceDate:date,priceSource:url(e.slug),sourcePrice:e.raw,priceUnit:'juego',priceIncludesVat:true,brand:'Obramat',model:null,supplierReference:e.ref,priceStatus:'PRECIO_CALCULADO',priceMethod:'Obramat x1.30'}));
const existingRefs=new Set(base.flatMap(p=>[p.reference,...(p.variants||[]).map(v=>v.reference)].filter(Boolean).map(String)));
for(const p of [...products,...eccs]) for(const r of [p.reference,...(p.variants||[]).map(v=>v.reference)].filter(Boolean)) { if(existingRefs.has(String(r))) throw new Error(`Referencia duplicada ${r}`); existingRefs.add(String(r)); }
fs.writeFileSync(file, JSON.stringify([...base,...products,...eccs],null,2)+'\n');
console.log(`Guardados: ${products.length} productos Multicapa, ${products.reduce((n,p)=>n+p.variants.length,0)} variantes y ${eccs.length} excéntricas.`);
