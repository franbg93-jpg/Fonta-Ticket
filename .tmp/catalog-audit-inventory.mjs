import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('FontaTicket_Catalogo_CORREGIDO/productos.json','utf8'));
const variants = p.flatMap(x => (x.variants || []).map(v => ({parent:x, ...v})));
const urlOk = x => typeof x.sourceUrl === 'string' && /^https?:\/\//.test(x.sourceUrl);
const refOk = x => typeof x.supplierReference === 'string' && x.supplierReference.trim() !== '';
const priceOk = x => Number.isFinite(x.precio ?? x.price);
const priceIssues = [];
for (const x of p) for (const item of [x, ...(x.variants||[])]) {
 const price = item.precio ?? item.price;
 const base = item.sourcePrice;
 if (Number.isFinite(price) && Number.isFinite(base) && /^(Obramat|Ferrocano) x1\.30$/i.test(item.priceMethod||'')) {
  const expect = Math.round((base*1.30+Number.EPSILON)*100)/100;
  if (Math.abs(price-expect)>0.005) priceIssues.push({parent:x.nombre, ref:item.supplierReference||item.reference, price, sourcePrice:base, expected:expect, method:item.priceMethod});
 }
 if (price == null && base != null) priceIssues.push({parent:x.nombre, ref:item.supplierReference||item.reference, problem:'sourcePrice sin precio almacenado'});
}
const allRefs = [...p.flatMap(x=>[{name:x.nombre,ref:x.supplierReference, raw:x.reference, path:'parent'},...(x.variants||[]).map(v=>({name:x.nombre+' / '+v.description,ref:v.supplierReference,raw:v.reference,path:'variant'}))])];
const groups = new Map(); for(const r of allRefs) if(r.ref) groups.set(r.ref,[...(groups.get(r.ref)||[]),r]);
const duplicateRefs = [...groups].filter(([,a])=>a.length>1).map(([ref,items])=>({ref,items}));
const ids = new Map(); for(const x of p)ids.set(x.id,[...(ids.get(x.id)||[]),x.nombre]);
const duplicateIds=[...ids].filter(([,a])=>a.length>1);
const dupeNames = new Map(); for(const x of p){const k=(x.nombre||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();dupeNames.set(k,[...(dupeNames.get(k)||[]),x]);}
const exactNames=[...dupeNames].filter(([k,a])=>k&&a.length>1).map(([key,a])=>({key,products:a.map(x=>({id:x.id,ref:x.supplierReference,url:x.sourceUrl,variants:x.variants?.length||0}))}));
const eanKeys = new Set(['ean','ean13','gtin','barcode']); const ean=[]; for(const x of p) for(const [k,v] of Object.entries(x)) if(eanKeys.has(k.toLowerCase())&&v!=null&&v!=='') ean.push({id:x.id,key:k});
const photoMissing=p.filter(x=>!x.foto); const badPhotoVariants=variants.filter(v=>v.photo&&v.photo!==v.parent.foto);
const vEmpty=p.filter(x=>Array.isArray(x.variants)&&x.variants.length===0);
const counts = {parents:p.length,variants:variants.length,parentsWithVariants:p.filter(x=>x.variants?.length).length, emptyVariantArrays:vEmpty.length, suppliers:Object.fromEntries([...new Set(p.map(x=>x.supplier||'∅'))].map(s=>[s,p.filter(x=>x.supplier===s).length])), parentsMissingRef:p.filter(x=>!refOk(x)).length, parentsMissingUrl:p.filter(x=>!urlOk(x)).length, parentsMissingPrice:p.filter(x=>!priceOk(x)).length, variantsMissingRef:variants.filter(x=>!refOk(x)).length, variantsMissingUrl:variants.filter(x=>!urlOk(x)).length, variantsMissingPrice:variants.filter(x=>!Number.isFinite(x.price)).length, variantsMissingPhoto:variants.filter(x=>!x.photo).length, parentsMissingPhoto:photoMissing.length, variantsWithSeparatePhoto:badPhotoVariants.length, duplicateSupplierReferences:duplicateRefs.length, duplicateIds:duplicateIds.length, exactNormalizedNameDupes:exactNames.length, nonemptyEanFields:ean.length, suspiciousPriceMath:priceIssues.length};
console.log(JSON.stringify({counts, duplicateRefs, duplicateIds, exactNames, ean, priceIssues:priceIssues.slice(0,100), parentsWithNoSupplierRef:p.filter(x=>!refOk(x)).map(x=>({id:x.id,name:x.nombre,supplier:x.supplier,url:x.sourceUrl,variants:x.variants?.length||0})), categories:[...new Set(p.map(x=>x.category))]},null,2));

