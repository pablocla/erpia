import { NextResponse } from 'next/server';
import { createProtheusDbClient } from '@/lib/mesh/adapters/totvs/protheusDbClient';
import { MOCK_SX2_TABLES, MOCK_SX3_FIELDS, MOCK_SX9_RELATIONSHIPS } from '@/lib/mesh/adapters/totvs/protheusMockData';
import { executeParameterizedSql } from '@/lib/studio/sqlExecutor';
import { suggestProtheusCanonicalName } from '@/lib/mesh/adapters/totvs/protheusDictionaryExtractor';

// Regex to extract table names from SQL
function extractTableNames(sql: string): string[] {
  const tables = new Set<string>();
  // Match FROM/JOIN followed by a word (optionally schema-qualified)
  const regex = /\b(?:FROM|JOIN|UPDATE|INTO)\s+([a-zA-Z0-9_#]+)(?:\s+AS\s+)?/gi;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    let tbl = match[1].replace(/[\[\]"`]/g, '').trim().toUpperCase();
    // In Protheus, tables often have company suffixes (e.g. SA1010)
    // Strip numeric suffixes to get the core table name (e.g. SA1)
    const baseTbl = tbl.replace(/\d+$/, '');
    if (baseTbl.length >= 3) {
      tables.add(baseTbl);
    }
    tables.add(tbl);
  }
  return Array.from(tables);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sql,
      connectionString,
      companySuffix = '010',
      mode = 'mock',
      generateType = 'ontology', // 'ontology' | 'data'
    } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ success: false, error: 'SQL query parameter is required.' }, { status: 400 });
    }

    const tableNames = extractTableNames(sql);
    if (tableNames.length === 0) {
      return NextResponse.json({ success: false, error: 'Could not extract any valid tables from SQL query.' }, { status: 400 });
    }

    // 1. ONTOLOGY GENERATION MODE
    if (generateType === 'ontology') {
      let sx2: any[] = [];
      let sx3: any[] = [];
      let sx9: any[] = [];
      let sx6: any[] = [];

      if (mode === 'live' && connectionString) {
        const client = await createProtheusDbClient(connectionString);
        try {
          const suffix = companySuffix;
          const sx2Table = `SX2${suffix}`;
          const sx3Table = `SX3${suffix}`;
          const sx9Table = `SX9${suffix}`;
          const sx6Table = `SX6${suffix}`;

          const tableFilterStr = tableNames.map(t => `'${t}'`).join(',');
          
          const sx2Res = await client.query(`
            SELECT X2_CHAVE, X2_ARQUIVO, X2_NOME, X2_NOMETAB, X2_MODO 
            FROM ${sx2Table} 
            WHERE X2_CHAVE IN (${tableFilterStr}) OR X2_ARQUIVO IN (${tableFilterStr})
          `);
          sx2 = sx2Res.rows;

          const sx3Res = await client.query(`
            SELECT X3_ARQUIVO, X3_CAMPO, X3_TIPO, X3_TITULO, X3_TAMANHO, X3_DECIMAL, X3_OBRIGAT 
            FROM ${sx3Table} 
            WHERE X3_ARQUIVO IN (${tableFilterStr})
            ORDER BY X3_ARQUIVO, X3_ORDEM
          `);
          sx3 = sx3Res.rows;

          const sx9Res = await client.query(`
            SELECT X9_DOM, X9_CDOM, X9_LIGDOM, X9_LIGCDOM, X9_IDENT, X9_ENABLE, X9_CONDSQL 
            FROM ${sx9Table} 
            WHERE X9_DOM IN (${tableFilterStr}) OR X9_LIGDOM IN (${tableFilterStr})
          `);
          sx9 = sx9Res.rows;

          // Fetch some system parameters from SX6
          const sx6Res = await client.query(`
            SELECT X6_VAR, X6_TIPO, X6_DESCR1, X6_CONTEUD 
            FROM ${sx6Table} 
            WHERE X6_VAR LIKE 'MV_FAT%' OR X6_VAR LIKE 'MV_EST%' OR X6_VAR LIKE 'MV_VAL%'
            LIMIT 15
          `);
          sx6 = sx6Res.rows;
        } catch (dbErr: any) {
          console.warn('Database query failed, falling back to mock:', dbErr.message);
          mode === 'mock'; // Fallback
        } finally {
          await client.close();
        }
      }

      if (sx2.length === 0) {
        // Fallback or Mock Mode
        sx2 = MOCK_SX2_TABLES.filter(t => tableNames.includes(t.X2_CHAVE) || tableNames.includes(t.X2_ARQUIVO));
        sx3 = MOCK_SX3_FIELDS.filter(f => tableNames.includes(f.X3_ARQUIVO));
        sx9 = MOCK_SX9_RELATIONSHIPS.filter(r => tableNames.includes(r.X9_DOM) || tableNames.includes(r.X9_LIGDOM));
        sx6 = [
          { X6_VAR: 'MV_FATURAT', X6_TIPO: 'C', X6_DESCR1: 'Control de Facturación activa', X6_CONTEUD: 'S' },
          { X6_VAR: 'MV_ESTADO', X6_TIPO: 'C', X6_DESCR1: 'Estado de conexión ERP', X6_CONTEUD: 'PROD' },
        ];
      }

      // Generate Ontology Document Markdown
      let md = `# OPO Semantics & Ontology Mapping Report\n\n`;
      md += `**Query Analizada:**\n\`\`\`sql\n${sql}\n\`\`\`\n\n`;
      md += `### 1. Tablas Encontradas (SX2)\n`;
      if (sx2.length === 0) {
        md += `No se encontraron descripciones en SX2 para las tablas detectadas: ${tableNames.join(', ')}\n`;
      } else {
        md += `| Tabla | Canonical Name (OPO) | Descripción | Modo de Acceso (X2_MODO) |\n`;
        md += `|---|---|---|---|\n`;
        sx2.forEach(t => {
          const canonical = suggestProtheusCanonicalName(t.X2_CHAVE);
          md += `| \`${t.X2_CHAVE}\` | **\`${canonical}\`** | ${t.X2_NOME || t.X2_NOMETAB || 'N/A'} | ${t.X2_MODO || 'Exclusivo (E)'} |\n`;
        });
      }

      md += `\n### 2. Estructura de Campos Clave (SX3)\n`;
      tableNames.forEach(tbl => {
        const tblFields = sx3.filter(f => f.X3_ARQUIVO === tbl);
        if (tblFields.length > 0) {
          md += `#### Tabla \`${tbl}\` (${suggestProtheusCanonicalName(tbl)})\n`;
          md += `| Campo | Tipo | Título/Etiqueta | Tamaño | Requerido |\n`;
          md += `|---|---|---|---|---|\n`;
          tblFields.forEach(f => {
            md += `| \`${f.X3_CAMPO}\` | \`${f.X3_TIPO}\` | ${f.X3_TITULO} | ${f.X3_TAMANHO || 'N/A'} | ${f.X3_OBRIGAT === 'S' ? 'Sí' : 'No'} |\n`;
          });
          md += `\n`;
        }
      });

      md += `### 3. Relaciones Semánticas Descubiertas (SX9)\n`;
      const activeRelations = sx9.filter(r => (r.X9_ENABLE ?? 'S') !== 'N');
      if (activeRelations.length === 0) {
        md += `No se encontraron relaciones activas en SX9 para este subconjunto de tablas.\n`;
      } else {
        md += `| Origen | Campo Origen | Destino | Campo Destino | Identificador (X9_IDENT) | Filtro SQL (X9_CONDSQL) |\n`;
        md += `|---|---|---|---|---|---|\n`;
        activeRelations.forEach(r => {
          md += `| \`${r.X9_DOM}\` | \`${r.X9_CDOM}\` | \`${r.X9_LIGDOM}\` | \`${r.X9_LIGCDOM}\` | ${r.X9_IDENT || 'N/A'} | ${r.X9_CONDSQL || 'Ninguno'} |\n`;
        });
      }

      md += `\n### 4. Parámetros del Sistema (SX6)\n`;
      if (sx6.length === 0) {
        md += `No se encontraron parámetros de configuración relevantes.\n`;
      } else {
        md += `| Parámetro | Tipo | Descripción | Valor Actual |\n`;
        md += `|---|---|---|---|\n`;
        sx6.forEach(p => {
          md += `| \`${p.X6_VAR}\` | \`${p.X6_TIPO}\` | ${p.X6_DESCR1} | \`${p.X6_CONTEUD}\` |\n`;
        });
      }

      // Generate the canonical OPO JSON snippet
      md += `\n### 5. OPO Entity Mapping Snippet (JSON)\n`;
      const opoMapping: Record<string, any> = {};
      sx2.forEach(t => {
        const canonical = suggestProtheusCanonicalName(t.X2_CHAVE);
        const fields: Record<string, string> = {};
        sx3.filter(f => f.X3_ARQUIVO === t.X2_CHAVE).forEach(f => {
          fields[f.X3_CAMPO.toLowerCase()] = f.X3_CAMPO;
        });

        opoMapping[canonical] = {
          native_reference: `${t.X2_CHAVE}${companySuffix}`,
          opo_fields: fields,
          protheus_meta: {
            x2Modo: t.X2_MODO || 'E',
            filialField: `${t.X2_CHAVE.slice(0, 2)}_FILIAL`,
          }
        };
      });

      md += `\`\`\`json\n${JSON.stringify(opoMapping, null, 2)}\n\`\`\`\n`;

      return NextResponse.json({
        success: true,
        type: 'ontology',
        document: md,
        tablesDetected: tableNames,
      });
    }

    // 2. DATA GENERATION / EXECUTION MODE WITH SEMANTIC MAPPING
    if (generateType === 'data') {
      if (!connectionString) {
        return NextResponse.json({
          success: false,
          error: 'Connection string is required to retrieve live database data.',
        }, { status: 400 });
      }

      // Execute SQL
      const result = await executeParameterizedSql({
        connectionString,
        sql,
      });

      // Map raw columns semantically using common Protheus to OPO prefixes
      const mappedRows = result.rows.map(row => {
        const mapped: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          let logicalKey = key;
          // Apply custom naming translation
          if (key.startsWith('A1_')) {
            if (key === 'A1_COD') logicalKey = 'customerId';
            else if (key === 'A1_NOME') logicalKey = 'customerName';
            else if (key === 'A1_CGC') logicalKey = 'customerTaxId';
            else logicalKey = key.slice(3).toLowerCase();
          } else if (key.startsWith('C5_')) {
            if (key === 'C5_NUM') logicalKey = 'orderNumber';
            else if (key === 'C5_CLIENTE') logicalKey = 'customerId';
            else if (key === 'C5_TOTAL') logicalKey = 'grandTotal';
            else logicalKey = key.slice(3).toLowerCase();
          } else if (key.startsWith('B1_')) {
            if (key === 'B1_COD') logicalKey = 'productId';
            else if (key === 'B1_DESC') logicalKey = 'description';
            else logicalKey = key.slice(3).toLowerCase();
          }
          mapped[logicalKey] = value;
        }
        return mapped;
      });

      return NextResponse.json({
        success: true,
        type: 'data',
        rawRows: result.rows,
        mappedRows,
        driver: result.driver,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid generateType.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
