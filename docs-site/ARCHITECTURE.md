# Arquitectura del Sitio de Documentación Embebida

Elegimos implementar un **Motor de Renderizado Dinámico de Markdown a través de Next.js Server Components** en la ruta `/dashboard/documentacion/[[...slug]]` (Estrategia A) en lugar de instalar setups pesados de MDX o Docusaurus standalone por las siguientes razones:

1. **Evitar conflictos de dependencias**: La suite usa Next.js 15, React 19 y Tailwind CSS v4. Configurar compiladores como MDX o frameworks externos (ej. Fumadocs) suele provocar incompatibilidades de tipos y errores de transpilación debido a las dependencias inestables de React 19.
2. **Cero impacto en el bundle de producción**: Al correr en Server Components usando `marked` y `gray-matter`, el procesado del contenido y extracción del frontmatter ocurre 100% en el servidor. El cliente solo recibe HTML semántico puro e interactivos dinámicos ligeros.
3. **Mismo puerto y proceso**: Cero puertos colisionando. La documentación técnica se sirve en el puerto 3000 de forma nativa manteniendo los tokens de estilo y el layout global del Dashboard.
4. **Interactividad Fluida & Mermaid**: Integrado con un componente cliente dinámico para renderizar diagramas Mermaid a demanda usando lazy-loading, reduciendo la carga inicial de JavaScript.
5. **SEO & Búsqueda Integrada**: Genera metadatos dinámicos por ruta a partir del frontmatter YAML, facilitando el escaneo directo de archivos para herramientas de RAG / Agentes de Inteligencia Artificial.
