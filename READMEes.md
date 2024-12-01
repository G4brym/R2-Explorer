[![Tasa de Commits](https://img.shields.io/github/commit-activity/m/G4brym/R2-Explorer?label=Commits&style=social)](https://github.com/G4brym/R2-Explorer/commits/main) [![Problemas](https://img.shields.io/github/issues/G4brym/R2-Explorer?style=social)](https://github.com/G4brym/R2-Explorer/issues) [![Licencia de Software](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=social)](LICENSE)

Leer esto en otros idiomas: [English](README.md), [Português](READMEpt.md), [Français](READMEfr.md)

# R2-Explorer

<p align="center">
    <em>¡Una interfaz tipo Google Drive para tus Buckets de Cloudflare R2!</em>
</p>

<p>
  Este proyecto se implementa/autohospeda en tu propia cuenta de Cloudflare como un Worker, y no se requiere ninguna credencial/token para comenzar a usarlo.
</p>

---

**Documentación**: <a href="https://r2explorer.dev" target="_blank">https://r2explorer.dev</a>

**Demo en Vivo**: <a href="https://demo.r2explorer.dev" target="_blank">https://demo.r2explorer.dev</a>

---

## Características

- [Explorador de Correo Electrónico](https://r2explorer.dev/guides/setup-email-explorer/) (usando Cloudflare Email Routing)
- [Autenticación Básica](https://r2explorer.dev/getting-started/security/#basic-auth)
- [Autenticación de Acceso de Cloudflare](https://r2explorer.dev/getting-started/security/)
- Navegación muy rápida de bucket/carpeta
- Vista previa en el navegador de pdf, imágenes, txt, markdown, csv, etc.
- Carga mediante arrastrar y soltar (Drag-and-Drop)
- Cargas de múltiples archivos y carpetas
- Crear carpetas
- Cargar/Renombrar/Descargar/Eliminar archivos
- Clic derecho en un archivo para opciones adicionales
- Carga multipart para archivos grandes

## Primeros pasos

Ejecuta este comando para configurar un proyecto de ejemplo

```bash
npm create cloudflare@latest r2-explorer -- --template "G4brym/R2-Explorer/template"
```

## Actualizar tu instalación

Para actualizar a la última versión, solo necesitas instalar el paquete r2-explorer más reciente desde npm y volver a implementar tu aplicación

```bash
npm install r2-explorer@latest --save
```

```bash
wrangler publish
```

## Tareas pendientes

- Permitir nombres de buckets con espacios
- Buscar archivos
- Renombrar carpetas
- Eliminar carpetas
- Miniaturas de imágenes usando workers de Cloudflare
- Información sobre herramientas al pasar el ratón por encima de un archivo con el formato "hace x días"
- Agrupar íconos de bootstrap en lugar de importarlos
