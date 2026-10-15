# Liferay — Tokens y variables CSS

## Regla principal

Los componentes consumen las custom properties que Liferay expone desde el
Style Book. Los valores de producción siguen siendo responsabilidad del portal;
los archivos locales solo replican esos valores para la preview.

## Themes locales

```text
src/styles/themes/
├── portal-uno.css   ← theme neutral activo para la preview
├── default.css      ← fallback neutral para nuevos sitios
└── theme.css        ← punto de entrada del theme local
```

Para cambiar el theme de preview, modifica únicamente el `@import` de
`src/styles/themes/theme.css`. No se importa el theme desde los componentes,
por lo que sus tokens globales no se incluyen en los CSS de producción.

Para crear un theme de otro sitio, copia `portal-uno.css`, ajusta sus valores a
las Token Definitions del Style Book y selecciona el archivo desde `theme.css`.

## Uso de custom properties

```css
.component {
  color: var(--brand-color-1);
  padding: var(--spacer-4);
  border-radius: var(--border-radius-lg);
}
```

No declares estos tokens dentro del CSS de un componente. En Liferay llegan
desde el Style Book.

## Contrato de tokens

No renombres ni redefinas estos grupos porque forman parte de la integración
con Liferay:

- `--brand-color-*`
- `--gray-*`
- `--spacer-*`
- `--container-max-sm`, `--container-max-md`, `--container-max-lg`,
  `--container-max-xl`
- `--font-family-*`, `--font-size-*`, `--line-height-*`
- `--border-radius-*`

Los anchos `--container-max-*` son tamaños máximos del contenedor, no
breakpoints. Las reglas responsive viven en `src/styles/base/containers.css`.

## Componentes

Los componentes deben consumir tokens existentes y evitar valores globales,
`@font-face` o estilos del vendor Bootstrap en sus hojas de producción.
El contenedor compartido se aplica mediante la clase neutral `.pk-container`.
