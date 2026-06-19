import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE = 'C:\\Users\\Pablo Clavero\\Downloads\\pos-system-argentina';
const API_DIR = path.join(WORKSPACE, 'app', 'api');
const OUTPUT_FILE = path.join(WORKSPACE, 'content', 'docs', 'developer', 'api-overview.mdx');

function getRouteFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getRouteFiles(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  return results;
}

function generateApiOverview() {
  console.log('Generando índice de APIs...');
  const routes = getRouteFiles(API_DIR);
  
  let mdx = `---
title: "Mapa de APIs"
description: "Índice de rutas y endpoints de la API del ERP."
sidebar_position: 4
tags: ["developer", "api"]
audience: developer
layer: 5-codigo
last_verified: 2026-06-19
status: completo
---

# Mapa de la API del ERP Argentina

Este documento lista de forma automatizada las rutas de la API del ERP a partir del escaneo de los archivos de controlador de Next.js App Router (\`route.ts\`).

---

## 📌 Rutas API Disponibles

| Ruta | Métodos Detectados | Seguridad | Estado |
|---|---|---|---|
`;

  routes.forEach(routePath => {
    const relPath = path.relative(API_DIR, routePath).replace(/\\/g, '/');
    const endpoint = '/api/' + path.dirname(relPath);
    const content = fs.readFileSync(routePath, 'utf-8');
    
    const methods: string[] = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    if (content.includes('export async function PATCH')) methods.push('PATCH');
    
    const isSecured = content.includes('getAuthContext') || content.includes('empresa-guard') ? '🔒 JWT' : '🔓 Pública';
    
    // Check if there is a matching test file in __tests__/
    const testName = path.basename(path.dirname(routePath)) + '-route.test.ts';
    // Look for test file
    let hasTest = '❌ Sin test';
    const possibleTestPaths = [
      path.join(WORKSPACE, '__tests__', 'api', testName),
      path.join(WORKSPACE, '__tests__', testName),
    ];
    if (possibleTestPaths.some(p => fs.existsSync(p))) {
      hasTest = '✅ Con test';
    }
    
    mdx += `| \`${endpoint}\` | ${methods.join(', ') || 'GET'} | ${isSecured} | ${hasTest} |\n`;
  });

  // Ensure output dir exists
  const dirName = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, mdx, 'utf-8');
  console.log(`✅ Índice de APIs generado en: ${OUTPUT_FILE}`);
}

generateApiOverview();
