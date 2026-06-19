import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE = 'C:\\Users\\Pablo Clavero\\Downloads\\pos-system-argentina';
const SRC_DOCS = path.join(WORKSPACE, 'docs');
const DEST_DOCS = path.join(WORKSPACE, 'content', 'docs');

const MIGRATIONS = [
  { src: path.join(SRC_DOCS, 'analista', 'GUIA_ANALISTA_IMPLEMENTACION.md'), dest: 'analista/guia-implementacion.mdx', title: 'Guía de Implementación del Analista', audience: 'analista', tags: ['analista', 'implementacion'] },
  { src: path.join(SRC_DOCS, 'G13_DOCUMENTACION_Y_TECNOLOGIA.md'), dest: 'roadmap/g13-gaps.mdx', title: 'Brechas de Documentación y Tecnología', audience: 'developer', tags: ['roadmap', 'gaps'] },
  { src: path.join(SRC_DOCS, 'funcional', 'rubro-config-railroad-engine.md'), dest: 'funcional/railroad-engine.mdx', title: 'Motor Railroad por Rubro', audience: 'analista', tags: ['funcional', 'railroad'] },
  { src: path.join(SRC_DOCS, 'funcional', 'sistema-pos.md'), dest: 'funcional/sistema-pos.mdx', title: 'Especificación Sistema POS', audience: 'all', tags: ['funcional', 'pos', 'p0'] },
  { src: path.join(SRC_DOCS, 'ESPECIFICACION_FUNCIONAL_ERP.md'), dest: 'funcional/especificacion-erp.mdx', title: 'Especificación Funcional Transversal', audience: 'all', tags: ['funcional', 'especificacion'] },
  { src: path.join(SRC_DOCS, 'funcional', 'tesoreria-cuentas-corrientes.md'), dest: 'funcional/tesoreria.mdx', title: 'Tesorería y Cuentas Corrientes', audience: 'analista', tags: ['funcional', 'tesoreria'] },
  { src: path.join(SRC_DOCS, 'funcional', 'maestros-clientes-proveedores.md'), dest: 'funcional/maestros-clientes.mdx', title: 'Maestros Clientes y Proveedores', audience: 'analista', tags: ['funcional', 'maestros'] },
  { src: path.join(SRC_DOCS, 'funcional', 'logistica-distribucion-ecommerce.md'), dest: 'funcional/logistica.mdx', title: 'Logística, Distribución y E-commerce', audience: 'analista', tags: ['funcional', 'logistica'] },
  { src: path.join(SRC_DOCS, 'funcional', 'modulo-ia.md'), dest: 'funcional/modulo-ia.mdx', title: 'Módulo de Inteligencia Artificial', audience: 'developer', tags: ['funcional', 'ia'] },
  { src: path.join(SRC_DOCS, 'funcional', 'IMPLEMENTACION_COMPLETA.md'), dest: 'roadmap/implementacion-modulos.mdx', title: 'Matriz de Implementación Completa', audience: 'analista', tags: ['roadmap', 'implementacion'] },
  { src: path.join(SRC_DOCS, 'introspeccion_por_modulos.md'), dest: 'developer/modulos-index.mdx', title: 'Índice Estructural de Módulos', audience: 'developer', tags: ['developer', 'modulos'] },
  { src: path.join(SRC_DOCS, 'funcional', 'rubros', 'distribuidora-bebidas.md'), dest: 'funcional/rubros/distribuidora-bebidas.mdx', title: 'Vertical Distribuidora de Bebidas', audience: 'analista', tags: ['funcional', 'rubro', 'bebidas'] },
  { src: path.join(SRC_DOCS, 'funcional', 'rubros', 'otros-rubros.md'), dest: 'funcional/rubros/otros-rubros.mdx', title: 'Especificaciones de Otros Rubros', audience: 'analista', tags: ['funcional', 'rubro'] },
  { src: path.join(SRC_DOCS, 'funcional', 'rubros', 'veterinaria.md'), dest: 'funcional/rubros/veterinaria.mdx', title: 'Vertical Veterinaria y Agro', audience: 'analista', tags: ['funcional', 'rubro', 'veterinaria'] },
  { src: path.join(WORKSPACE, 'TESTING_GEMINI.md'), dest: 'developer/testing.mdx', title: 'Guía de Testing QA', audience: 'developer', tags: ['developer', 'testing', 'qa'] },
  { src: path.join(WORKSPACE, 'AGENTS.md'), dest: 'developer/arquitectura.mdx', title: 'Guía de Arquitectura del ERP', audience: 'developer', tags: ['developer', 'arquitectura'] },
  { src: path.join(WORKSPACE, 'DIVISION_TAREAS_CURSOR_GEMINI.txt'), dest: 'roadmap/fases-f1-f4.mdx', title: 'Plan de Fases del Proyecto', audience: 'all', tags: ['roadmap', 'fases'] },
  { src: path.join(WORKSPACE, 'funcional.txt'), dest: 'funcional/pendientes-por-rol.mdx', title: 'Bandeja de Pendientes por Rol', audience: 'analista', tags: ['funcional', 'roles'] },
  { src: path.join(WORKSPACE, 'PROMPT_GEMINI_TESTING_ERP.md'), dest: 'ia-context/prompts-implementacion.mdx', title: 'Prompts de Implementación y Testing', audience: 'ia', tags: ['ia', 'prompts'] }
];

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function generateFrontmatter(title: string, desc: string, audience: string, tags: string[] = []) {
  return `---
title: "${title}"
description: "${desc}"
sidebar_position: 10
tags: [${tags.map(t => `"${t}"`).join(', ')}]
audience: ${audience}
layer: 1-config
last_verified: 2026-06-19
status: completo
---

`;
}

function runMigration() {
  console.log('Iniciando migración de documentación...');
  
  MIGRATIONS.forEach(m => {
    if (!fs.existsSync(m.src)) {
      console.warn(`⚠️ Archivo origen no encontrado: ${m.src}`);
      return;
    }
    
    const destPath = path.join(DEST_DOCS, m.dest);
    ensureDirectoryExistence(destPath);
    
    let content = fs.readFileSync(m.src, 'utf-8');
    
    // Si ya tiene frontmatter, no duplicamos
    if (!content.startsWith('---')) {
      const desc = `Documento sobre ${m.title.toLowerCase()}.`;
      const frontmatter = generateFrontmatter(m.title, desc, m.audience, m.tags);
      content = frontmatter + content;
    }
    
    fs.writeFileSync(destPath, content, 'utf-8');
    console.log(`✅ Migrado: ${m.src} -> ${m.dest}`);
  });
  
  console.log('Migración de archivos base finalizada.');
}

runMigration();
