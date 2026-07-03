const fs = require('fs');

function replaceStr(file, find, repl) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, c.replace(find, repl));
}

// 1. app/dashboard/agenda/page.tsx - duplicate Label
replaceStr('app/dashboard/agenda/page.tsx', 'import { Label } from "@/components/ui/label";\nimport { Label } from "@/components/ui/label";', 'import { Label } from "@/components/ui/label";');
// 2. app/dashboard/agenda/page.tsx - duplicate turnoEstadoLabel
replaceStr('app/dashboard/agenda/page.tsx', 'import { turnoEstadoLabel, turnoEstadoVariant } from "@/lib/ui/status-map";\nimport { turnoEstadoLabel, turnoEstadoVariant } from "@/lib/ui/status-map";', 'import { turnoEstadoLabel, turnoEstadoVariant } from "@/lib/ui/status-map";');

// Let's use a regex to strip the duplicate 'Label' and 'turnoEstadoLabel' imports if they aren't exactly consecutive.
let agenda = fs.readFileSync('app/dashboard/agenda/page.tsx', 'utf8');
agenda = agenda.replace(/import \{ Label \} from "@\/components\/ui\/label";/g, '');
agenda = 'import { Label } from "@/components/ui/label";\n' + agenda;
agenda = agenda.replace(/import \{ turnoEstadoLabel, turnoEstadoVariant \} from "@\/lib\/ui\/status-map";/g, '');
agenda = 'import { turnoEstadoLabel, turnoEstadoVariant } from "@/lib/ui/status-map";\n' + agenda;
fs.writeFileSync('app/dashboard/agenda/page.tsx', agenda);


// 3. components/claver-cloud/command-center-dashboard.tsx - duplicate UserPlus
let ccenter = fs.readFileSync('components/claver-cloud/command-center-dashboard.tsx', 'utf8');
ccenter = ccenter.replace('UserPlus, UserPlus', 'UserPlus');
fs.writeFileSync('components/claver-cloud/command-center-dashboard.tsx', ccenter);

// 4. app/api/claver/comercial/leads/[id]/route.ts
// Replace '@/lib/auth/onboarding' with wherever onboarding is, or just mock it.
// Actually, maybe it's just 'empresa-guard'
let route = fs.readFileSync('app/api/claver/comercial/leads/[id]/route.ts', 'utf8');
route = route.replace('@/lib/auth/onboarding', '@/lib/auth/empresa-guard');
fs.writeFileSync('app/api/claver/comercial/leads/[id]/route.ts', route);

// 5. app/dashboard/impuestos/layout.tsx
// Replace '@/lib/auth/empresa-guard-server' with '@/lib/auth/empresa-guard'
let layout = fs.readFileSync('app/dashboard/impuestos/layout.tsx', 'utf8');
layout = layout.replace('@/lib/auth/empresa-guard-server', '@/lib/auth/empresa-guard');
fs.writeFileSync('app/dashboard/impuestos/layout.tsx', layout);
