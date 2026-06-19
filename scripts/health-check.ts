/**
 * Health check script para validar los endpoints críticos de la API.
 */

const ENDPOINTS = [
  '/api/health',
  '/api/afip/test-conexion',
  '/api/auth/me',
  '/api/config/empresa'
];

async function run() {
  console.log('Iniciando Health Check de ERP Argentina...\n');
  let exitCode = 0;
  
  for (const endpoint of ENDPOINTS) {
    try {
      const url = `http://localhost:3000${endpoint}`;
      const start = Date.now();
      const res = await fetch(url);
      const ms = Date.now() - start;
      
      if (res.ok) {
        console.log(`✅ [${res.status}] ${endpoint} (${ms}ms)`);
      } else if (res.status === 401 || res.status === 403) {
        // 401 is acceptable for protected endpoints
        console.log(`⚠️ [${res.status}] ${endpoint} (Protegido, requiere auth) (${ms}ms)`);
      } else {
        console.error(`❌ [${res.status}] ${endpoint} - Falló el health check!`);
        exitCode = 1;
      }
    } catch (error) {
      console.error(`❌ [ERROR] ${endpoint} - No se pudo conectar. ¿Está corriendo Next.js en el puerto 3000?`);
      exitCode = 1;
    }
  }
  
  console.log('\nFinalizado.');
  process.exit(exitCode);
}

run();
