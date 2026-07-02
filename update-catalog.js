const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'lib', 'marketplace', 'generative-catalog.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const betas = [
  'gen.intel.briefing_semanal',
  'gen.intel.pulse_diario',
  'gen.intel.margen_sku',
  'gen.content.wa_semana',
  'gen.optimize.pedido_sugerido',
  'gen.content.redes_rubro',
  'gen.comply.calendario_fiscal'
];

content = content.replace(/sku: "([^"]+)",([^}]+?)status: "disponible"/gs, (match, sku, middle) => {
  if (betas.includes(sku)) {
    return `sku: "${sku}",${middle}status: "beta"`;
  } else {
    return `sku: "${sku}",${middle}status: "planned"`;
  }
});

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update complete');
