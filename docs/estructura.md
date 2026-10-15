# Estructura del proyecto

```text
portalkit/
├── src/
│   ├── fragments/[nombre]/       ← fragments Liferay
│   │   ├── index.pug             ← markup de preview
│   │   ├── index.css             ← estilos del fragment
│   │   ├── index.js              ← entry de preview
│   │   ├── script.js             ← JS opcional copiado a Liferay
│   │   ├── [nombre].ftl          ← markup Liferay opcional
│   │   └── configuration.json
│   ├── web-content/[nombre]/     ← Web Content de Liferay
│   ├── client-extensions/        ← extensiones IIFE
│   ├── js/                       ← módulos JS compartidos
│   ├── styles/
│   │   ├── base/                 ← fuentes y contenedores
│   │   ├── themes/               ← Portal Uno y fallback neutral
│   │   └── preview.css
│   └── views/                    ← layouts, mixins Pug y catálogo
├── public/                       ← assets estáticos y vendor
├── scripts/                      ← ensamblado Liferay y extensiones
├── docs/                         ← documentación
├── vite.config.js
└── package.json
```

## Regla de prioridad del .ftl

Cuando existe `src/fragments/[nombre]/[nombre].ftl`, el build lo copia tal cual.
Si no existe, extrae el contenido del `<body>` del HTML compilado por Vite.

**Nunca sobreescribe un `.ftl` que ya existe en `src/`.**

Aplica igual para `src/web-content/[nombre]/[nombre].ftl`.

---

## Regla de prioridad del JS

Cuando existe `src/fragments/[nombre]/script.js`, el build lo copia tal cual como `index.js` en el `dist/`.
Si no existe, usa el `index.js` compilado por Vite.

Usar `script.js` cuando el JS ya está escrito para Liferay y no necesita bundling ni imports.
