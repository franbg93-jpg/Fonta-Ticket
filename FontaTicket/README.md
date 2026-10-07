# FontaTicket

Aplicación web móvil para crear tickets de trabajos de fontanería, mantener un catálogo de productos y consultar tickets guardados.

## Requisitos

- Node.js 20 o posterior
- npm

## Instalar y ejecutar

```bash
npm install
npm run dev
```

Para verificar el proyecto:

```bash
npm test
npm run build
npm run preview
```

## Actualizar precios del catálogo

La fuente editable es `../FontaTicket_Catalogo_CORREGIDO/productos.json` y sus imágenes. La herramienta de precios trabaja con la referencia exacta del proveedor y no crea ni sustituye artículos por nombre.

### Tecnoagua

Descarga la nueva tarifa oficial en Excel y prepara una propuesta. El lector reconoce las columnas `COD.` y `€/U` de la tarifa Tecnoagua; la fecha y la URL de la tarifa se guardan en la propuesta.

```powershell
npm run catalog:prices -- prepare --file "C:\ruta\TARIFA_PVP_TECNOAGUA.xlsx" --date 2026-10-07 --source-url "https://www.hidrotecnoagua.com/pdf/TARIFA_PVP_TECNOAGUA.xlsx" --out "propuesta-tecnoagua.json"
```

Se generan un JSON de trabajo y un CSV para revisar. `not_in_source` significa que la referencia no aparece en el archivo recibido; no demuestra que el artículo se haya descatalogado. Referencias duplicadas, no vinculadas o incompletas quedan para revisión y no se actualizan.

### Obramat y Ferrocano

El comprobador local visita las URLs que ya están guardadas en el catálogo con Google Chrome y usa únicamente el contenido visible y los selectores documentados en `../scrapper.md`. Chrome se abre en una ventana visible y conserva cookies y la selección del almacén en un perfil propio del comprobador. La primera vez puede pedirte seleccionar Obramat Murcia en la web y pulsar Intro en la consola. Si el sitio presenta su propia comprobación de seguridad, puedes completarla en la ventana; el script no intenta resolverla. Compara la referencia visible con `supplierReference` y exige precio, unidad e impuestos claros. Para Obramat también exige stock visible positivo. URLs de listados, páginas bloqueadas, disponibilidad no visible, datos ambiguos o diferencias de referencia quedan pendientes; no se prueban endpoints ni se buscan productos parecidos.

Ejecuta:

```powershell
npm run catalog:check-prices
```

Se generan automáticamente dos snapshots y las propuestas CSV/JSON en `../.tmp/catalog-price-checks/AAAA-MM-DD/`. El informe `informe.csv` explica cada verificación y cada pendiente e incluye la fecha y hora de comprobación. El perfil persistente de Chrome queda en `../.tmp/catalog-check-prices-browser-profile/`. La consola distingue los registros con referencias/URLs aptas de los verificados realmente. El snapshot incluye únicamente filas verificadas, por lo que las pendientes nunca llegan al actualizador de precios. Para usar Chrome sin ventana, añade `--headless`; algunos sitios podrían rechazar ese modo y las filas quedarán pendientes.

Después revisa las propuestas y ejecuta el paso actual de aplicación solo para la propuesta que quieras aplicar:

```powershell
npm run catalog:prices -- apply --proposal "..\.tmp\catalog-price-checks\AAAA-MM-DD\obramat-proposal.json"
```

El paso existente vuelve a pedir la confirmación `APLICAR`; el comprobador nunca modifica el catálogo. Si quieres revisar o regenerar la propuesta manualmente, los snapshots también se pueden pasar al modo `prepare --feed`.

Para preparar un snapshot manual, cada fila debe identificar la referencia exacta y la ficha comprobada. El sistema de precios acepta este formato:

```json
{
  "supplier": "Obramat",
  "priceDate": "2026-10-07",
  "sourceUrl": "https://www.obramat.es/fontaneria/",
  "rows": [
    {
      "supplierReference": "25084058",
      "sourcePrice": 12.34,
      "priceUnit": "unidad",
      "priceIncludesVat": true,
      "sourceUrl": "https://www.obramat.es/productos/ficha-del-producto-25084058.html"
    }
  ]
}
```

Para Ferrocano cambia `supplier` a `Ferrocano` y usa su ficha exacta. El actualizador calcula precio publicado × 1,30 y redondea a céntimos con redondeo comercial. Tecnoagua aplica el PVP publicado sin recargo. Las referencias, fecha, precio fuente, precio resultante, unidad, impuestos, URL y método quedan asociados al producto o a la variante correspondiente.

### Revisar y aplicar

1. Revisa el CSV generado: incluye precio actual, precio fuente, precio propuesto y filas pendientes.
2. Aplica a la fuente canónica cuando estés conforme:

   ```powershell
   npm run catalog:prices -- apply --proposal "propuesta-tecnoagua.json"
   ```

3. Confirma escribiendo `APLICAR`. Se crea una copia de seguridad del JSON y se regenera `public/catalogo-inicial.zip`.
4. Para actualizar un navegador que ya tiene catálogo local, abre `CATÁLOGO → ACTUALIZAR PRECIOS` y carga el mismo JSON de propuesta. La app recalcula la vista previa contra los datos de ese navegador y guarda solo precios y metadatos de precio de las coincidencias exactas; no reemplaza el catálogo ni toca fotos, variantes o tickets históricos.

Las propuestas se pueden preparar sin modificar datos. Al aplicar, la herramienta vuelve a comprobar las referencias y precios de origen de la propuesta y cancela toda la operación si el catálogo cambió desde la revisión.

## Ver la aplicación en el móvil

Para abrir la versión de desarrollo en el móvil, conecta el teléfono y el ordenador a la misma red Wi-Fi y arranca el servidor así. Mantén el ordenador y el servidor encendidos mientras la usas:

```bash
npm run dev -- --host 0.0.0.0
```

Busca la dirección IPv4 local del ordenador (por ejemplo `192.168.1.25`) y abre `http://192.168.1.25:5173/` en el navegador del teléfono, sustituyendo la dirección por la del ordenador. Permite el acceso en la red local si el firewall de Windows lo solicita. Para acceder desde cualquier lugar, publica el sitio compilado en `dist/` siguiendo la sección de publicación; en móvil, abre la URL HTTPS asignada por el alojamiento.

## Publicar e instalar como PWA

El repositorio incluye un flujo de GitHub Actions que ejecuta las pruebas, compila la aplicación con la ruta `/FontaTicket/` y la publica en GitHub Pages cuando se actualiza `main`. En GitHub, abre **Settings → Pages** y selecciona **GitHub Actions** como fuente de publicación. El repositorio actual es privado; la publicación de Pages desde repositorios privados depende del plan de GitHub. Tras el primer despliegue, la aplicación estará disponible en `https://onlyfran93.github.io/FontaTicket/`.

La compilación normal (`npm run build`) usa la raíz del servidor para conservar el desarrollo y la vista previa locales. Para generar manualmente la versión de Pages en Windows PowerShell:

```powershell
$env:GITHUB_PAGES = "true"
npm run build
Remove-Item Env:GITHUB_PAGES
```

El sitio incluye un manifiesto instalable y un service worker que guarda la aplicación y el catálogo inicial para abrirlos sin conexión después de la primera carga. En Android, abre la URL publicada con Chrome y elige **Instalar aplicación** o **Añadir a pantalla de inicio**. En iPhone/iPad, ábrela en Safari y elige **Compartir → Añadir a pantalla de inicio**. La instalación requiere el sitio publicado mediante HTTPS. IndexedDB sigue siendo local a cada navegador/dispositivo; el service worker no sincroniza los datos.

El artefacto publicable manualmente es `dist/`; para cualquier alojamiento distinto de GitHub Pages, usa `npm run build` sin `GITHUB_PAGES`.

## Datos y privacidad

El catálogo, las fotos, el historial y las citas de AGENDA se guardan en IndexedDB del navegador y dispositivo actuales. Permanecen disponibles después de cerrar o actualizar la aplicación si se conserva el mismo origen y el almacenamiento del navegador no se borra. Los datos no se suben al alojamiento ni se sincronizan automáticamente entre navegadores o dispositivos: incluso si PC y móvil abren la misma web, cada uno mantiene sus propios datos locales. Para copiar el catálogo y las fotos entre dispositivos, exporta e importa el ZIP; el historial y las citas no forman parte de ese ZIP y permanecen en cada dispositivo. Como en cualquier aplicación web local, el navegador puede eliminar datos si el usuario borra el almacenamiento del sitio o por políticas de espacio.

Los tickets guardan una copia de sus conceptos, descripciones, referencias y precios al generarse: editar, eliminar o borrar productos del catálogo no modifica los tickets ya guardados. El botón `WHATSAPP` comparte la imagen PNG mediante el selector nativo de archivos del dispositivo si el navegador lo admite. En PC sin esa función, intenta copiar la imagen al portapapeles y abrir WhatsApp Web. Por restricciones del navegador y de WhatsApp Web, la aplicación no puede seleccionar una conversación ni adjuntar/enviar el archivo automáticamente desde una página web; el acceso al portapapeles normalmente requiere HTTPS o localhost. No se descarga un archivo como fallback. `IMPRIMIR` abre el diálogo de impresión del navegador.

En `HISTORIAL` se puede filtrar por fechas o seleccionar un mes completo. El resumen suma las líneas cuyo concepto sea `Mano de obra` en esa categoría y clasifica el resto como materiales; el producto se prepara en el catálogo con precio de `1,00 €` para que su cantidad equivalga directamente al importe de mano de obra. La cantidad de cada línea del ticket se puede introducir directamente.

`AGENDA` permite guardar citas ordenadas por fecha y hora, editarlas o eliminarlas. Cada cita incluye cliente, fecha, hora, dirección, trabajo a realizar y una lista de materiales con casillas para marcar lo que ya se tiene o se ha comprado. Las citas y el estado de esas casillas se guardan localmente en el mismo navegador.

## Formato del catálogo ZIP

`IMPORTAR CATÁLOGO` abre el selector de archivos para escoger directamente un `.zip`. Solo admite ZIP —no RAR ni otros formatos— con `productos.json` en la raíz o dentro de una única carpeta superior; las fotos se guardan en `imagenes/` junto a ese JSON. Conserva los registros incompletos que tengan nombre o precio, además de sus asociaciones de imágenes; omite los que no tienen nombre ni precio ni variantes (incluidos los que solo contienen foto). Ignora las imágenes sueltas que no estén asociadas a un registro. La referencia es opcional y también se admite el campo `referencia`. La importación reemplaza el catálogo actual.

Para cargar `FontaTicket_Catalogo.zip`, abre `CATÁLOGO → IMPORTAR CATÁLOGO`, selecciona ese archivo y confirma el reemplazo. La operación solo sustituye el catálogo de ese navegador; no modifica el historial.

`EXPORTAR CATÁLOGO` genera un ZIP compatible con este formato, con `productos.json` y la carpeta `imagenes/`. El JSON es una lista de productos con `reference`, `nombre`, `precio`, `foto`, `category`, `supplier` y, cuando corresponda, `variants`. `foto` y la foto de cada variante contienen la ruta relativa (`imagenes/...`) o `null` si no hay imagen. Cada variante puede conservar su proveedor y referencia propios, además del precio y su procedencia; también mantiene descripción, atributos y foto. En el catálogo, un producto agrupado aparece una sola vez; al añadirlo a un ticket se elige la variante y el ticket conserva la descripción, referencia, precio y foto seleccionados. La importación también acepta los nombres de campo `name`, `price`, `photo`, `categoria` y `proveedor`.

El catálogo adjunto se importa automáticamente solo en el primer inicio y únicamente cuando el catálogo local está vacío. En la primera carga tras esta actualización se eliminan del catálogo local los productos que no tengan nombre ni precio; el historial y los demás productos no se modifican. El ZIP del catálogo inicial y sus fotos se publican como archivo estático para sembrar el primer uso. Los tickets y los cambios posteriores del catálogo (incluidas las fotos importadas o añadidas) permanecen en el IndexedDB de cada navegador y no se sincronizan con GitHub Pages.
