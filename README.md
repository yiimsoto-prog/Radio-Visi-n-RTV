# RadioVisión RTV · IMCOTNV

Sitio oficial de la **Iglesia Misionera Casa de Oración para Todas las Naciones (IMCOTNV)** y su ministerio radial **RadioVisión RTV**.

## Enlaces

| Recurso | URL |
| --- | --- |
| Sitio en Cloudflare Pages | https://radiovision-rtv-6xg.pages.dev/ |
| Dominio oficial | https://radiovisionrtv.com/ |
| Repositorio | https://github.com/yiimsoto-prog/Radio-Visi-n-RTV |

## Qué incluye

- Radio en vivo 24/7 (castellano y quechua)
- Cultos, sedes, ministerios y eventos
- Biblia interactiva (Reina-Valera 1960)
- PWA instalable (offline + service worker)
- Registro de decisiones y peticiones de oración (Firebase)

## Desarrollo local

```bash
npm start
```

Abre `http://127.0.0.1:3847`.

## Deploy en Cloudflare Pages

Este repo está listo para conectarse a Cloudflare Pages:

1. En Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Selecciona el repo `yiimsoto-prog/Radio-Visi-n-RTV`
3. Configuración de build:
   - **Framework preset:** None
   - **Build command:** *(vacío)*
   - **Build output directory:** `/` (raíz del repo)
4. Guarda y despliega. Cada push a `main` actualiza https://radiovision-rtv-6xg.pages.dev/

Si el proyecto Pages ya existe (upload directo), ve a **Settings → Builds & deployments → Connect to Git** y enlaza este mismo repositorio.

## Estructura

```
├── index.html          # App principal
├── decision.html       # Registro de decisiones en culto
├── css/                # Temas y componentes
├── js/                 # App, Firebase, PWA, seguridad
├── img/                # Logos e iconos PWA
├── sw.js               # Service worker
├── manifest.json       # Manifest PWA
├── _headers            # Cabeceras Cloudflare Pages
└── _redirects          # Rutas Cloudflare Pages
```
