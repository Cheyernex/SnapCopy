# ⚡ SnapCopy

> **SnapCopy** es una aplicación de escritorio moderna y eficiente construida con **Electron**, **React 19** y **Vite**, diseñada para organizar, guardar y sincronizar fragmentos de código, comandos de consola y consultas SQL de manera rápida e intuitiva.

Desarrollada por **CMT DEV SOLUTIONS**.

---

## ✨ Características Principales

- 📁 **Organización por Espacios de Trabajo y Carpetas:** Crea workspaces dedicados (SQL, Consola, Código, General) y organiza tus snippets mediante estructuras de carpetas anidadas.
- ☁️ **Sincronización en la Nube (Supabase):** Inicia sesión con Google OAuth y mantén tus fragmentos sincronizados entre dispositivos.
- 🎨 **Personalización Visual:** Elige entre múltiples temas de color (*Índigo, Medianoche, Esmeralda, Rosa, Ámbar, Celeste, Violeta, Pizarra*).
- 🌐 **Soporte Multi-Idioma (i18n):** Disponible completamente en **Español** e **Inglés**.
- 📌 **Integración en Bandeja de Sistema (System Tray):** Minimiza la app en la barra de tareas de Windows para un acceso rápido y discreto.
- 🔄 **Actualizaciones Automáticas:** Integración con `electron-updater` para mantener la aplicación siempre actualizada desde GitHub Releases.
- ⚡ **Búsqueda y Acceso Rápido:** Copia fragmentos al portapapeles con un solo clic o mediante atajos de teclado.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Desktop Wrapper:** [Electron 43](https://www.electronjs.org/)
- **Backend & Auth:** [Supabase JS Client](https://supabase.com/)
- **Iconos & Estilos:** [Lucide React](https://lucide.dev/), Vanilla CSS / CSS Variables
- **Internacionalización:** [i18next](https://www.i18next.com/) & `react-i18next`
- **Linter & Build Tools:** [Oxlint](https://oxc.rs/), `electron-builder`

---

## 🚀 Inicio Rápido

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- `npm` o `pnpm`

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Cheyernex/SnapCopy.git
   cd SnapCopy
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto (puedes basarte en `.env.example`):
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

### Scripts Disponibles

- **Desarrollo:** Inicia el servidor Vite y la aplicación Electron de forma concurrente.
  ```bash
  npm run dev
  ```
- **Compilar Frontend:** Genera los archivos estáticos optimizados en `dist/`.
  ```bash
  npm run build
  ```
- **Linter:** Ejecuta Oxlint para verificar la calidad del código.
  ```bash
  npm run lint
  ```
- **Generar Ejecutable / Instalador:** Empaqueta la aplicación para distribución (Windows NSIS).
  ```bash
  npm run dist
  ```

---

## 📁 Estructura del Proyecto

```
SnapCopy/
├── electron/              # Proceso principal de Electron, tray y preload scripts
│   ├── main.cjs
│   └── preload.cjs
├── src/                   # Código fuente de React
│   ├── assets/            # Recursos estáticos e imágenes
│   ├── locales/           # Archivos de traducción (en.json, es.json)
│   ├── App.jsx            # Componente principal de la aplicación
│   ├── main.jsx           # Punto de entrada de React
│   ├── i18n.js            # Configuración de internacionalización
│   └── supabase.js        # Cliente y utilidades de Supabase
├── supabase-schema.sql    # Esquema SQL para la base de datos Supabase
├── package.json           # Dependencias y scripts del proyecto
└── vite.config.js         # Configuración del bundler Vite
```

---

## 📄 Licencia y Créditos

Desarrollado por **CMT DEV SOLUTIONS**.
- **Autor:** CMT DEV SOLUTIONS (`cmtdevsolutions@gestricon.com`)
- **Versión Actual:** 1.1.2

