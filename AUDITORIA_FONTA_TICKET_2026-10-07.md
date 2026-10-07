# Auditoría FontaTicket — 7 de octubre de 2026

**Estado: EN CURSO; auditoría de solo lectura.** No se han editado productos, variantes, precios, fotos, tickets ni la aplicación. No se ha ejecutado `catalog:prices -- apply`.

Este archivo conserva el estado para retomar la auditoría en otra sesión o con otra IA. La fuente canónica inspeccionada es `FontaTicket_Catalogo_CORREGIDO/productos.json`; no se usaron ZIP históricos para verificar contenido.

## Estado de la comprobación visible de proveedores

Se inició `npm run catalog:check-prices` desde `FontaTicket` con Chrome visible y perfil persistente en `.tmp/catalog-check-prices-browser-profile`. El proceso está detenido en una comprobación de seguridad que requiere intervención humana. No se resolvió el reto automáticamente. Chrome debe quedar visible para que la persona complete lo que la página solicite; luego hay que pulsar Intro en la terminal/sesión que está ejecutando la comprobación.

Los archivos de salida existentes bajo `.tmp/catalog-price-checks/2026-10-07/` contienen snapshots vacíos (`rows: []`) y no constituyen una pasada completa. No contar esos registros como referencias verificadas ni como propuesta de actualización. El proceso aún asociado a la sesión de ejecución puede estar esperando la entrada. No aplicar ninguna propuesta.

La herramienta usa únicamente fichas visibles, comprueba que `supplierReference` coincida exactamente y deja pendiente el registro cuando falta la ficha/referencia/precio/stock/IVA; para Obramat requiere confirmar el almacén «Obramat Murcia». No intenta adivinar coincidencias.

## Inventario estructural

- Productos padre: **142**.
- Variantes: **417**.
- Productos padre con variantes: **78**.
- Arrays de variantes vacíos: **17** (equivalen a no tener selector; revisar si son intencionales).
- Objetivos de precio con precio asignado, desglosados por proveedor: Tecnoagua **177**, Obramat **221**, Ferrocano **83**; total **481**. Un producto padre con precio/ref solo se cuenta como objetivo adicional cuando el catálogo lo tiene además de variantes.
- Objetivos con `supplierReference`: **315/481**; faltan **166** referencias, todas en variantes: Obramat **100/221** presentes, Ferrocano **17/83**, Tecnoagua **177/177**.
- Objetivos con URL: Tecnoagua **147/177** (faltan 30); Obramat **221/221**; Ferrocano **83/83**.
- Fichas URL directas con referencia registrada: Obramat **121/221** (las 121 referencias existentes apuntan a URL con forma de ficha); Ferrocano **15/83** (2 registros con referencia tienen URL que no cumple la forma de ficha concreta y 43 URLs de Ferrocano no son fichas directas).
- En Tecnoagua aparecen **3 referencias proveedor duplicadas** entre dos productos padre: `90932`, `90940`, `90991`; todas se comparten entre `T` y `Derivaciones` en PVC presión.
- IDs padre duplicados: **0**.
- Campos no vacíos con nombre EAN/GTIN/código de barras: **0**, según la petición.
- Todas las rutas de imagen declaradas encontradas existen en `imagenes/` (**0 rutas rotas**). Todos los 142 padres tienen nombre y foto. Hay **43 variantes** con foto propia distinta a la del padre; revisar porque la regla acordada es una foto común por producto.
- Ninguna de las 417 variantes carece de precio numérico. **78 productos agrupadores tienen el precio padre vacío**, pero el selector muestra «Desde» con el mínimo de variantes; se debe confirmar si este comportamiento cumple el requisito de producto principal con precio.
- Recalculo exacto con redondeo comercial half-up: **0 diferencias** detectadas entre `sourcePrice × 1,30` y los precios almacenados bajo `Obramat x1.30` / `Ferrocano x1.30`. Una comprobación inicial con `Math.round` señaló falsos positivos por representación binaria de decimales; no deben registrarse como errores.

### Hallazgos de producto/variante para revisión

1. **PVC presión — `T` y `Derivaciones`:** refs Tecnoagua `90932`, `90940`, `90991` se asignan a ambas familias con las mismas medidas y precios. Verificar la tabla del fabricante y corregir agrupación/ref solo tras evidencia.
2. **Latón roscado — Alargadera / racor Marsella:** 4 variantes solo tienen `Pulgadas` + `Configuración`, mientras 2 tienen `Pulgadas` + `Medida` (2 cm / 3 cm) + `Configuración`. Es un grupo mezclado entre alargadera estándar y longitudes específicas. Revisar si deben separarse o si faltan medidas; no inventarlas.
3. **PVC presión — Derivaciones:** mezcla variantes encoladas y encolado×rosca (con `Pulgadas` solo para estas últimas) dentro del mismo producto. Es una estructura posible, pero hay que verificar cada pareja mm/pulgadas/rosca y el subtipo antes de confirmar.
4. **PVC presión — Reducciones:** el atributo alterna `Diámetro` y `Conexión` entre casquillos y otros tipos; ver el conjunto completo para comprobar selectores y la nomenclatura acordada (`Medida` para mm). No se ha corregido nada.
5. **PVC evacuación — Reducciones:** variantes `Casquillo`, `Excéntrica` y `Excéntrica comprimida`, con algunas conexiones `Macho-Hembra` y otras sin conexión. Revisar que los tipos y atributos corresponden a cada SKU.
6. **Sifones/válvulas — posible duplicidad de nombre:** “Válvula ducha Tecnoagua Ø115 mm” aparece con refs padre `50532` y `50534` y URLs distintas. Puede ser misma dimensión con modelos distintos; verificar catálogo/fichas y renombrar/desduplicar solo con autorización.
7. Se encontraron **10 grupos de nombres normalizados repetidos**; la mayoría son etiquetas genéricas (“T”, “Codos”, “Manguitos”, etc.) usadas en familias/sistemas distintos, así que no se consideran duplicados confirmados. El producto repetido de válvula Ø115 anterior es el candidato más claro para revisión.
8. Los nombres breves de varias familias PVC no identifican el tipo concreto en la tarjeta (“T”, “Derivaciones”, “Reducciones”); mejorar la rotulación podría acelerar el uso, pero sería un cambio de catálogo y queda pendiente de autorización.

## 1. PRECIOS VERIFICADOS

**0** hasta completar la comprobación humana y obtener snapshots no vacíos. Los valores actuales no se presentan como verificados por proveedor en esta pasada.

## 2. PRECIOS QUE PROPONEN CAMBIO

No hay ningún precio propuesto de forma fiable mientras los snapshots estén vacíos. Las propuestas guardadas con feed vacío muestran registros `not_in_source`; eso significa que el feed no trae datos y no es prueba de que haya cambiado el proveedor.

## 3. PRECIOS PENDIENTES

Pendientes los **304 objetivos** de Obramat y Ferrocano y la conciliación fuente/precio de Tecnoagua. En Obramat, completar reto y confirmar Obramat Murcia. En ambas tiendas, cualquier falta de referencia exacta, ficha concreta, precio único/unidad/IVA/stock legible debe permanecer pendiente.

## 4. REFERENCIAS CORRECTAS

No se ha demostrado todavía la corrección comercial de una referencia solo porque esté informada. Estructuralmente hay 315 objetivos con `supplierReference`; la comprobación visible decidirá cuáles coinciden exactamente con su ficha.

## 5. REFERENCIAS SOSPECHOSAS/INCORRECTAS

Revisar referencias ausentes (166 variantes), las tres colisiones Tecnoagua `90932/90940/90991` (ver inventario) y las fichas que no correspondan exactamente. No reasignar por similitud de nombre.

## 6. PRODUCTOS DUPLICADOS

No hay duplicados confirmados. Los grupos de nombre repetido son mayormente etiquetas genéricas para categorías distintas. Revisar las dos válvulas ducha Ø115 (`50532`, `50534`) y los tres SKU PVC presión compartidos.

## 7. VARIANTES CORRECTAS

Los tests de lógica confirman selector por atributos, búsqueda por características/referencia, precio de variante seleccionada, auto-selección cuando queda una única opción, y foto de producto padre en línea de ticket. Esto verifica comportamiento del código, no que cada combinación física esté validada contra la ficha del fabricante.

## 8. VARIANTES CON PROBLEMAS

417 variantes en total. Cuatro grupos tienen claves de atributos inconsistentes: Alargadera Marsella, Derivaciones PVC presión, Reducciones PVC presión, Manguito inodoro extensible acodado. La colisión de SKU en T/Derivaciones PVC presión puede representar una variante atribuida a producto equivocado. Hay 43 fotos distintas a la foto padre. Confirmar productos agrupados y combinaciones contra fuentes primarias.

## 9. PRODUCTOS SIN REFERENCIA

En el nivel de objetivo de venta/precio, faltan 166 `supplierReference`, todos en variantes: 100 Obramat y 66 Ferrocano. No inventar sustitutos. Los 78 padres agrupadores sin referencia no se cuentan como unidades vendibles cuando sus variantes tienen sus propios datos.

## 10. PRODUCTOS SIN URL

30 objetivos Tecnoagua sin URL (los objetivos Obramat/Ferrocano tienen una URL guardada, aunque 43 URLs Ferrocano no son fichas directas y 2 no cumplen la forma concreta pese a tener ref). Ver lista completa derivada del JSON al retomar.

## 11. PRODUCTOS SIN PRECIO VERIFICABLE

Los 481 objetivos tienen un precio numérico en el catálogo, pero **ninguno está aún verificado en la pasada visible**. 78 padres agrupadores tienen `precio` vacío de forma intencional/derivada y muestran el mínimo de las variantes.

## 12. ERRORES DE LA APP

No se detectaron errores de consola del navegador en la inspección realizada. Importación/exportación, persistencia y mutaciones se revisaron estáticamente y mediante tests existentes; no se ejecutaron botones destructivos ni se reemplazó catálogo. Revisión funcional manual de todas las acciones aún incompleta.

## 13. PROBLEMAS DE UX/MÓVIL

En viewport móvil de 375 px no hubo scroll horizontal (`documentWidth = bodyWidth = viewportWidth = 375`); en escritorio tampoco (`scrollWidth = clientWidth = 1879`). El grid de catálogo aparece en dos columnas en móvil. No se detectó problema de overflow. Las tarjetas agrupadas muestran “Desde” cuando el precio vive en variante, y el selector solo aparece para productos con 2 o más variantes.

## 14. TESTS/BUILD

Se ejecutaron por petición del usuario: `npm test` y `npm run build`. Resultado: **11 suites / 56 tests aprobados**; build TypeScript+Vite completado. Warning no bloqueante: bundle JS minificado de aproximadamente 548 kB supera el aviso de 500 kB de Vite. No se añadieron tests ni se cambiaron archivos de aplicación.

## 15. RECOMENDACIONES DE CORRECCIÓN

1. Completar la comprobación visible de Obramat/Ferrocano; revisar que el snapshot no esté vacío y que el almacen sea Murcia antes de contar verificaciones.
2. Revisar primero las 3 referencias Tecnoagua duplicadas en PVC presión y las 166 variantes sin `supplierReference`.
3. Verificar con fichas/catálogo oficial las variantes con atributos mezclados, las válvulas Ø115 y las variantes específicas de alargaderas.
4. Auditar URLs Ferrocano que son listados/no fichas y las 30 URLs Tecnoagua ausentes; dejar como pendiente lo que no tenga evidencia.
5. Después de ver el informe, decidir correcciones explícitas. No aplicar ningún precio ni modificar el catálogo antes de esa aprobación.

## Continuación exacta

- Carpeta de trabajo: `C:\Users\Pipo\Desktop\fontaticket proyecto`.
- Proyecto Vite: `C:\Users\Pipo\Desktop\fontaticket proyecto\FontaTicket`.
- Catálogo canónico: `C:\Users\Pipo\Desktop\fontaticket proyecto\FontaTicket_Catalogo_CORREGIDO\productos.json`.
- Proceso: comprobar Chrome visible con perfil persistente; completar solo interacción humana que pida la web y pulsar Intro en la sesión de `npm run catalog:check-prices` que está esperando.
- Salida prevista: `.tmp\catalog-price-checks\2026-10-07\` (`obramat-snapshot.json`, `ferrocano-snapshot.json`, propuestas JSON/CSV, `pendientes.json`, `informe.csv`). Revisar que los snapshots tengan filas antes de considerar la comprobación completa.
- No ejecutar `npm run catalog:prices -- apply`.
- No cambiar precios, productos, fotos ni variantes durante la auditoría.

## Archivos de trabajo guardados

- Este informe: `AUDITORIA_FONTA_TICKET_2026-10-07.md`.
- Inventario detallado del catálogo (los 481 objetivos, todos los registros sin referencia/URL, duplicados, grupos con atributos inconsistentes y fotos separadas): `.tmp/catalog-audit-findings.json`.
- Scripts auxiliares de análisis, sin modificar la app ni el catálogo: `.tmp/catalog-audit-*.mjs`.
- Las propuestas y snapshots actuales están en `.tmp/catalog-price-checks/2026-10-07/`; verificar fecha y que `rows` sea mayor que cero tras terminar el reto antes de confiar en ellos.
