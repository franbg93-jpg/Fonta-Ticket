# Métodos verificados para extraer datos web

Última comprobación: 6 de octubre de 2026. Este documento contiene únicamente selectores o métodos que se probaron contra una página renderizada o un archivo disponible. No contiene selectores CSS inferidos.

## Ferrocano

### Búsqueda y ficha de producto (abrazaderas)

Comprobado el 6 de octubre de 2026 mediante la búsqueda visible del propio sitio y fichas concretas, entre ellas [isofónica 18 mm](https://ferrocanosuministros.es/abrazaderas/17717-abrazadera-isofonica-18mm.html), [isofónica 22 mm](https://ferrocanosuministros.es/sujeccion/1735-abrazadera-isofonica-m8.html), [isofónica reforzada CELO 31–36 mm](https://ferrocanosuministros.es/abrazaderas/19190-abrazadera-isofonica-reforzada-celo-31-36mm.html), [isofónica reforzada 40 mm](https://ferrocanosuministros.es/abrazaderas/19125-abrazadera-isofonica-reforzada-40mm.html), [PVC blanca 110 mm](https://ferrocanosuministros.es/pvc-blanco/20640-abrazadera-pvc-110-blanco.html) y [sin fin W2 9 mm Ø 12–22](https://ferrocanosuministros.es/abrazaderas/4502-abrazadera-sin-fin-w2-9mm-o-12-22.html).

| Dato | Método comprobado | Evidencia visible |
|---|---|---|
| Localizar producto | Introducir el término en el buscador visible `Buscar` y abrir el resultado con ese nombre; también se verificó el enlace del listado de categoría de abrazaderas. | El listado incluye CELO isofónica reforzada 31–36 mm (referencia 40058418, 0,42 €) y la búsqueda `abrazadera isofonica 40mm` incluye la reforzada MAREFIX 40 mm (referencia 40022959, 0,50 €). |
| Nombre y precio | Leer el título y el importe visibles en la ficha. | Las fichas muestran el título del artículo y el precio online. |
| Impuestos | Leer el texto visible junto al precio. | Las fichas consultadas indicaban `Impuestos incluidos`. |
| Referencia | Abrir la pestaña `Detalles del producto`. | La pestaña muestra `Referencia` y el código del artículo. |
| Características | Leer la pestaña `Descripción`. | Medida, material y detalles de construcción visibles cuando los publica la ficha. |
| Imagen de ficha | Inventariar los recursos de imagen ya observados en la página renderizada con la capacidad `pageAssets`; exportar el recurso exacto mediante `bundle` y asociarlo tras inspección. | Se exportaron las imágenes de las fichas CELO 31–36 mm y MAREFIX 40 mm. No se infiere un selector CSS de imagen. |

No se ha verificado un selector CSS de imagen en estas fichas; por tanto, no se documenta ninguno aquí.


### Catálogo Plasson

Página comprobada: [productos de la marca Plasson](https://ferrocanosuministros.es/brand/361-plasson?order=product.name.asc). Se recorrieron sus seis páginas de resultados y se verificaron fichas Push-Fit de varios tipos y medidas.

| Dato | Selector o método comprobado | Evidencia visible |
|---|---|---|
| Páginas de marca | `a.next.js-search-link` y su atributo `href`; abrir la URL visible de la siguiente página. | La paginación mostraba 1–6 y avanzaba entre páginas. |
| Tarjeta de producto | `article` | Contiene el título, enlace, imagen y precio de cada resultado renderizado. |
| Nombre y ficha | `article h2 a[href*="/accesorio-fitting/"]`; leer texto y `href`. | Títulos y enlaces de los artículos Plasson. |
| Precio publicado de listado | Texto visible de la tarjeta `article`. | Precios en euros; verificar después en la ficha individual. |

### Ficha de producto

Ficha comprobada: [Codo Push-Fit Plasson 20 mm](https://ferrocanosuministros.es/accesorio-fitting/6479-codo-fitting-push-fit-plasson-20mm.html).

| Dato | Selector o método comprobado | Evidencia visible |
|---|---|---|
| Nombre | `h1` | Denominación completa de la pieza y dimensión. |
| Referencia Ferrocano | `[itemprop="sku"]` | Texto visible `Referencia NNNNNNNN`. |
| Precio publicado | `[itemprop="price"]` atributo `content`; contraste visual en `.product-price`. | Importe en euros con IVA incluido. |
| Imagen principal | `.js-qv-product-cover` atributo `src` | Imagen grande del producto de la ficha. |

En las fichas de latiguillos se comprobó `select[name="group[7]"]` y las opciones de longitud; al elegir una se actualizaron la URL, la referencia y el precio. Este selector solo está verificado para esos latiguillos y no debe asumirse para otras familias.

### Unidad de venta y disponibilidad visible en ficha

Comprobado el 7 de octubre de 2026 en la ficha [Codo Push-Fit Plasson 20 mm](https://ferrocanosuministros.es/accesorio-fitting/6479-codo-fitting-push-fit-plasson-20mm.html), tras cargar la página renderizada. La ficha mostró un control `Cantidad` y el botón habilitado `Añadir Al Carrito`; para este tipo de ficha, el precio es por una unidad del artículo. Solo registrar `unidad` cuando ambos sean visibles y el botón esté habilitado. Esto confirma que la página permite añadir el artículo al carrito, no el número de unidades en stock. Si faltan o el botón está deshabilitado, dejar pendiente.

### Latiguillos inox

Categoría comprobada: [Conexiones sanitarias](https://ferrocanosuministros.es/186-conexiones-sanitarias). Desde el listado se verificaron fichas inox M-H y H-H de 3/8 y 1/2 y fichas gigantes de 3/4. La ficha individual indica la referencia de cada longitud seleccionada; no todas las series ofrecen todas las longitudes.

En la ficha se usaron los métodos ya comprobados (`h1`, `[itemprop="sku"]`, `[itemprop="price"]`, `.product-price` y `.js-qv-product-cover`). El selector nativo `select[name="group[7]"]` expone las longitudes disponibles de esa ficha. Solo guardar longitudes mostradas y referencias/precios tras seleccionar cada opción.

## Obramat

### Listado de categoría

Página comprobada: [Sifones y válvulas desagüe](https://www.obramat.es/fontaneria/evacuacion-de-agua/sifones-y-valvulas/?p=1). Al consultar, el almacén visible era **Obramat Murcia** y la página indicaba **129 resultados**.

Selectores CSS comprobados sobre el DOM renderizado:

| Dato | Selector o método comprobado | Evidencia visible |
|---|---|---|
| Tarjeta de producto | `main article` | Coincide con las tarjetas renderizadas del listado. También puede incluir tarjetas sin enlace de producto; filtrarlas. |
| Nombre y URL del producto | Dentro de cada tarjeta: `a[href*="/productos/"]`; leer `innerText` y el atributo `href`. | Enlaces visibles a fichas concretas del catálogo. |
| Stock del almacén | `innerText` de la tarjeta; patrón visible `N en stock en Obramat Murcia`. | Probado en varias tarjetas. Si no aparece, el stock no quedó comprobado. |
| Precio con IVA y unidad | `innerText` de la tarjeta; texto visible `Vendido N,NN € IVA por Unidad`. | Probado en varias tarjetas. Guardar el precio antes de aplicar cualquier multiplicador. |
| Paginación | Control accesible `combobox` con nombre `Elija un número de página`; ofrece valores visibles `1`, `2` y `3` en la sesión comprobada. | Cambiar la opción actualiza `?p=` y el bloque de artículos renderizado. |

La página informa 129 resultados, pero la consulta DOM comprobada solo expone bloques parciales del listado según la página renderizada. No considerar completa una extracción que no haya recorrido y conciliado todos los resultados. No rellenar artículos o cantidades ausentes por inferencia.

### Ficha de producto

Ficha comprobada: [Sifón lavabo extensible Tecnoagua, Ref. 10735354](https://www.obramat.es/productos/sifon-lavabo-extensible-1-1-4-1-1-2-blanco-tecnoagua-10735354.html).

| Dato | Selector o método semántico comprobado | Evidencia visible |
|---|---|---|
| Almacén | Botón con nombre accesible `Obramat Murcia`. | Encabezado de la ficha. |
| Referencia | Texto visible `Ref. NNNNNNNN` junto a la cabecera del producto. | `Ref. 10735354`. |
| Nombre | Encabezado de nivel 1 (`h1`). | Nombre completo en la ficha. |
| Precio | Bloque monetario de la ficha con el texto `IVA / Unidad` y su equivalente `sin IVA / Unidad`. | `1,65 € IVA / Unidad`; guardar como precio publicado con IVA. |
| Stock | Texto visible `N en stock en Obramat Murcia` en la sección `Compra en Almacén`. | `503 en stock en Obramat Murcia`. |
| Imagen principal | Enlace e imagen dentro del grupo accesible `Carrusel de imágenes`. | La imagen expone un texto alternativo con el nombre del producto y un enlace a la imagen. |
| Características | Sección accesible `Características`. | Leer solo los valores que la ficha muestre. |

No usar referencias de artículos recomendados como si fueran la referencia del artículo principal.

### Búsqueda y ficha de cobre/SAMBRA

Comprobado el 6 de octubre de 2026 en resultados y fichas de cobre de [Obramat Murcia](https://www.obramat.es/search?q=te%20cobre%2015mm), incluida la ficha de [T 15 mm cobre hembra, Ref. 10316075](https://www.obramat.es/productos/te-15mm-cobre-hembra-4-unidades-10316075.html).

| Dato | Selector o método comprobado | Evidencia visible |
|---|---|---|
| Almacén elegido | Botón accesible `Obramat Murcia`; confirmar en cada sesión. | Encabezado de resultados y fichas. |
| Nombre y enlace en resultados | `a[href*="/productos/"]`; leer `innerText` y `href`. | El DOM expone enlaces completos, por ejemplo `/productos/te-15mm-cobre-hembra-4-unidades-10316075.html`. |
| Nombre de ficha | `#product-name`. | Coincide con el nombre principal del producto. |
| Precio principal de ficha | `#a11y-product-detail-info`; contrastar con el texto visible `IVA por Unidad` y su equivalente `sin IVA por Unidad`. | En Ref. 10316075 muestra 2,79 € con IVA y 2,31 € sin IVA por unidad. |
| Características | `#featuresAccordion` y el panel accesible `Características`. | El control existe en la ficha; registrar solo los campos que se vean al abrirlo. |
| Referencia de ficha | Texto visible `Ref. NNNNNNNN` junto al título. | `Ref. 10316075`; el sufijo de URL también coincide en esta ficha, pero se debe cotejar contra el texto de referencia. |
| Imagen genérica | Leer el grupo accesible `Carrusel de imágenes`; enumerar recursos que la página ya cargó con `pageAssets.list()` y exportar la imagen observada con `pageAssets.bundle()`. | Se obtuvo el recurso principal de la ficha TE 15 mm. No se infiere un selector CSS para elegir imágenes ni se navega directamente al CDN. |

En resultados de búsqueda se vio el texto de stock `N en stock en Obramat Murcia` y el precio `Vendido N € IVA por Unidad`. El stock puede cambiar; guardar la cifra únicamente si la ficha o tarjeta la muestra en la fecha de consulta. La herramienta accesible que expone `Ref.`, el nombre y el precio de la ficha también se comprobó en las fichas de los productos SAMBRA; abrir la ficha enlazada para confirmar referencia y precio, aunque el resultado ya incluya esos datos.

## Tecnoagua

### Catálogo PDF local

Archivo consultado: `CATALOGO_HIDROTECNOAGUA.pdf`, catálogo 2026 disponible en la raíz del proyecto. Método comprobado: abrir el PDF con PyMuPDF (`fitz`) y extraer el texto de páginas individuales mediante `Page.get_text()`. La extracción incluye referencias, denominaciones, medidas y precios impresos. La numeración interna impresa puede diferir en una página de la posición física en el PDF; identificar cada página por su encabezado y contenido, no solo por el índice.

Este método verifica el texto del PDF; no demuestra por sí solo que una foto represente una referencia ni que un producto de Obramat sea homólogo. Las imágenes solo se asocian al modelo cuando se comprueban en el propio catálogo y en los archivos locales.

## Límites de esta referencia

- No se ha verificado ningún endpoint de API del sitio; no se documenta ninguno.
- No se documentan datos de precio, stock o variante que no aparezcan en los métodos anteriores.
- Registrar la URL exacta, fecha de consulta, referencia, unidad e impuestos junto a cada dato incorporado al catálogo.
