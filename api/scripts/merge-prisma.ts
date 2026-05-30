import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const modulesDir = resolve(__dirname, '../modules');
const prismaDir = resolve(__dirname, '../prisma');
const baseSchemaPath = join(prismaDir, 'schema.base.prisma');
const outputPath = join(prismaDir, 'schema.prisma');

const header = readFileSync(baseSchemaPath, 'utf-8');
const lines: string[] = [header.trimEnd()];

if (existsSync(modulesDir)) {
  const entries = readdirSync(modulesDir, { withFileTypes: true });
  const moduleDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => join(modulesDir, e.name));

  for (const dir of moduleDirs) {
    const schemaPath = join(dir, 'schema.prisma');
    if (existsSync(schemaPath)) {
      const content = readFileSync(schemaPath, 'utf-8').trim();
      if (content) {
        lines.push('');
        lines.push('// --- Module: ' + basename(dir) + ' ---');
        lines.push(content);
      }
    }
  }
}

lines.push('');
writeFileSync(outputPath, lines.join('\n'));
console.log('Merged schema written to ' + outputPath);

function basename(p: string): string {
  return p.split('/').pop() || p.split('\\').pop() || p;
}
