# PortalKit — Guía de desarrollo

**Instructivo para desarrolladores**  
**Proyecto:** PortalKit — ThemeKit para Liferay  
**Objetivo:** explicar cómo preparar el entorno, trabajar con los componentes, generar los entregables y validar los cambios antes de compartirlos.

---

## 1. ¿Qué es PortalKit?

PortalKit es un ThemeKit orientado a construir y mantener componentes para Liferay, con un catálogo de vista previa para desarrollo local.

La solución separa dos objetivos:

- **Vista previa:** permite explorar y probar los componentes durante el desarrollo.
- **Entregables para Liferay:** genera los archivos que se incorporan al portal.

La vista previa no sustituye la validación final dentro de Liferay. Los componentes deben conservar los contratos y atributos que la plataforma necesita.

## 2. Requisitos previos

Antes de empezar, verifica que tengas instalado:

- **Node.js**, en una versión compatible con la configuración del proyecto.
- **npm**, incluido con Node.js.
- **Git**, para gestionar cambios.

Usa la versión de Node.js definida por el proyecto o acordada por el equipo. Si el repositorio incorpora un archivo de versión de Node, sigue esa configuración.

## 3. Preparar el entorno

Desde una terminal, entra en la carpeta del repositorio:

```bash
cd PortalKit
```

Instala las dependencias declaradas en el lockfile:

```bash
npm ci
```

Inicia el entorno de desarrollo:

```bash
npm run dev
```

Abre en el navegador la URL local que indique Vite en la terminal. Usa el catálogo para navegar a los componentes y comprobar sus cambios.

## 4. Comandos disponibles

| Comando | Para qué sirve |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo y el catálogo de componentes. |
| `npm run build:liferay` | Genera todos los entregables de Liferay y las extensiones de cliente. |
| `npm run build:fragments` | Genera los entregables de los fragments. |
| `npm run build:web-content` | Genera el entregable de Web Content. |
| `npm run build:extensions` | Genera las Client Extensions configuradas. |
| `npm run build:extensions -- gsap` | Genera únicamente la extensión `gsap`, si el script admite el argumento indicado. |
| `npm run clean` | Limpia los artefactos generados dentro de `dist/`. |
| `npm run preview` | Sirve la compilación de vista previa generada por Vite. |

**Importante:** no uses `npm run build`; no es un comando definido en el proyecto. Para obtener el conjunto completo de entregables, utiliza `npm run build:liferay`.

Para una reconstrucción limpia:

```bash
npm run clean
npm run build:liferay
```

`npm run preview` sirve la vista previa compilada. Para trabajar e iterar sobre componentes, utiliza normalmente `npm run dev`.

## 5. Estructura del proyecto

La estructura relevante es:

```text
PortalKit/
├── src/
│   ├── fragments/
│   │   ├── horizontal-scroll/
│   │   ├── pk-display-text/
│   │   ├── pk-header/
│   │   ├── pk-hero/
│   │   ├── story-scroll/
│   │   └── text-reveal/
│   ├── web-content/
│   │   └── pk-accordion/
│   ├── js/
│   │   ├── _header.js
│   │   └── _accordion.js
│   ├── styles/
│   │   └── themes/
│   └── views/
├── scripts/
│   ├── build-liferay.js
│   ├── build-client-extensions.js
│   └── clean-dist.js
├── docs/
├── dist/                  # Artefactos generados; no editar manualmente
├── index.html             # Entrada del catálogo de vista previa
├── index.pug              # Plantilla del catálogo
├── vite.config.js
└── package.json
```

El árbol es orientativo: consulta el repositorio si la estructura cambia.

### Componentes incluidos

**Fragments**
- `horizontal-scroll`
- `pk-display-text`
- `pk-header`
- `pk-hero`
- `story-scroll`
- `text-reveal`

**Web Content**
- `pk-accordion`

Además, el proyecto genera dos Client Extensions: `gsap` y `swiperjs`.

## 6. Vista previa y código de producción

No confundas los archivos de entrada de la vista previa con los archivos que se entregan a Liferay.

| Archivo | Uso |
|---|---|
| `index.js` | Entrada de JavaScript para la vista previa con Vite. |
| `script.js` | JavaScript de producción de los componentes Liferay que lo incluyen. |
| `index.css` | CSS generado para el entregable del componente. |
| `configuration.json` | Configuración del fragment o componente. |
| `info.md` | Metadatos/documentación del entregable. |

En producción, el JavaScript de un fragment debe respetar el contrato de Liferay y operar dentro del ámbito del fragmento. La referencia habitual es `fragmentElement`.

### Reglas de JavaScript

- En el código de producción, limita las búsquedas DOM al fragmento correspondiente usando `fragmentElement.querySelector(...)` o `fragmentElement.querySelectorAll(...)`.
- No dependas de búsquedas globales con `document` para encontrar elementos del fragmento en producción.
- Los inicializadores compartidos deben recibir explícitamente la raíz donde van a trabajar.
- El código de vista previa puede usar `document` como raíz cuando no existe `fragmentElement`.
- Evita introducir `import` o `export` en el JavaScript de producción si el formato del entregable espera un script autónomo.
- Comprueba los componentes que pueden aparecer más de una vez en una misma página: no deben interferir entre sí.

## 7. Estilos y Design System

PortalKit utiliza **CSS nativo**, sin Sass.

- Los tokens globales de diseño son responsabilidad del **Style Book de Liferay**.
- El tema CSS local funciona como réplica para la vista previa; no debe tratarse automáticamente como la fuente oficial de los tokens globales.
- El tema activo de la vista previa importa `portal-uno.css`.
- Se conserva Bootstrap 4.3.1 como CSS de proveedor; no lo modifiques como parte de una tarea de componente salvo que exista una solicitud explícita y validada.
- Respeta los nombres de tokens, variables CSS y atributos de edición de Liferay existentes.
- Conserva los atributos `data-lfr-editable-id` y `data-lfr-editable-type` cuando correspondan.

Antes de agregar una variable o un token, revisa primero los tokens disponibles y las convenciones existentes del Design System.

## 8. Flujo recomendado para modificar un componente

1. **Identifica el componente** dentro de `src/fragments/` o `src/web-content/`.
2. **Revisa todos sus archivos relacionados**, incluidos HTML/FTL, CSS, JavaScript de vista previa, JavaScript de producción y configuración.
3. **Inicia la vista previa** con `npm run dev`.
4. **Realiza el cambio mínimo necesario**, respetando los patrones existentes.
5. **Comprueba el componente en el navegador**, tanto su apariencia como sus interacciones.
6. **Verifica los casos de uso relevantes**, por ejemplo, acordeón abierto/cerrado, navegación del menú, teclado y múltiples instancias cuando aplique.
7. **Genera los entregables** con `npm run build:liferay`.
8. **Revisa el resultado en `dist/`** y confirma que el artefacto esperado se generó correctamente.
9. **Revisa `git diff`** antes de confirmar los cambios.

No edites manualmente los archivos generados en `dist/`: corrige la fuente y vuelve a ejecutar el build.

## 9. Validación antes de entregar

Ejecuta:

```bash
npm run build:liferay
git status --short
git diff --check
git diff
```

Comprueba que:

- La compilación finaliza sin errores.
- Los entregables esperados existen en `dist/`.
- No se han generado archivos de vista previa dentro de las carpetas de entregables de Liferay.
- No se han modificado archivos de proveedor ni tokens globales sin justificación.
- No hay cambios accidentales ni archivos temporales.
- Las interacciones se probaron en el navegador o se indicó claramente si no se pudieron probar.

Si se necesita validar la salida desde cero, ejecuta primero `npm run clean` y luego `npm run build:liferay`.

## 10. Git: trabajo seguro

Antes de comenzar:

```bash
git status
git branch --show-current
```

Después de modificar:

```bash
git diff --check
git diff
git status --short
```

Agrupa cambios relacionados y utiliza mensajes de commit descriptivos. No incluyas `dist/` si está configurado como artefacto generado e ignorado por Git.

**No hagas `push`, no configures remotos ni despliegues a Liferay sin autorización explícita del responsable del repositorio.** No reescribas el historial ni incluyas cambios ajenos a tu tarea.

## 11. Problemas frecuentes

### El catálogo no abre o no refleja los cambios
- Confirma que ejecutaste `npm run dev`.
- Usa la URL que Vite muestra en la terminal.
- Revisa los errores de consola del navegador y la terminal.

### El build falla
- Revisa el mensaje de error completo.
- Confirma que instalaste dependencias con `npm ci`.
- Revisa los archivos que modificaste y ejecuta de nuevo `npm run build:liferay`.

### El componente funciona en la vista previa, pero no en Liferay
- Comprueba que modificaste el JavaScript de producción (`script.js`) además del de vista previa cuando corresponda.
- Revisa el uso de `fragmentElement` y el ámbito de las consultas DOM.
- Verifica que los atributos de edición y la configuración de Liferay sigan presentes.
- Valida el componente dentro de una instancia real de Liferay.

### No aparece un archivo esperado en `dist/`
- Confirma que ejecutaste el comando correcto.
- Usa `npm run build:liferay` para generar el conjunto completo.
- Recuerda que `dist/` contiene artefactos generados y no debe usarse como ubicación de trabajo fuente.

## 12. Checklist del desarrollador

Antes de cerrar una tarea:

- [ ] Cambié los archivos fuente correctos.
- [ ] Respeté los tokens y contratos de Liferay.
- [ ] Revisé la vista previa y las interacciones.
- [ ] Ejecuté `npm run build:liferay`.
- [ ] Revisé `git diff --check`, `git diff` y `git status`.
- [ ] Confirmé que no incluí artefactos generados ni cambios ajenos.
- [ ] Documenté cualquier prueba que no pude realizar.

---

## Referencias internas

- `README.md`: descripción y comandos principales.
- `docs/quick-start.md`: inicio rápido.
- `docs/scripts.md`: detalle de los scripts.
- `docs/dependencias.md`: dependencias.
- `docs/liferay/tokens-variables-css.md`: convenciones de tokens y CSS de Liferay.

> Mantén esta guía alineada con `package.json`, los scripts y la estructura real del repositorio cuando el proyecto evolucione.
