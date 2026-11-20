import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentAPI } from '../src/playground/examples/example';

const componentRoot = 'src/browser/components';
const playgroundRoot = 'src/playground';
const apiFile = resolve(playgroundRoot, 'examples/component-api.json');
const metadata: Record<string, ComponentAPI> = {};
const issues: string[] = [];
const writing = process.argv.includes('--write');

function table(markdown: string, heading: string): string[][] {
  const section = markdown.split('## ' + heading + '\n')[1]?.split('\n## ')[0] || '';
  return section.split('\n').filter(line => line.startsWith('|')).slice(2).map(line =>
    line.split(/(?<!\\)\|/).slice(1, -1).map(cell => cell.trim().replaceAll('\\|', '|'))
  );
}

function codeValue(cell: string): string {
  return cell.replace(/^`|`$/g, '');
}

function readProperty([property, attribute, , type, defaultValue]: string[]) {
  const [name, marker] = property.split(/\s+/, 2);
  const attributeName = codeValue(attribute);
  return {
    name: codeValue(name),
    attribute: attributeName === '--' ? null : attributeName,
    type: codeValue(type),
    defaultValue: codeValue(defaultValue),
    required: marker === '_(required)_',
  };
}

const manifest = JSON.parse(readFileSync(playgroundRoot + '/components.manifest.json', 'utf8'));
const tags = new Set(manifest.map((entry: { tag: string }) => entry.tag));
if (manifest.length !== tags.size) issues.push('Duplicate catalog entry');

for (const file of [...new Bun.Glob('*/*/readme.md').scanSync({ cwd: componentRoot })].sort()) {
  const readme = readFileSync(resolve(componentRoot, file), 'utf8').replaceAll('\r', '');
  const tag = readme.match(/^# (q-[\w-]+)/)?.[1];
  if (!tag) continue;
  const generated = readme.split('<!-- Auto Generated Below -->').at(-1)!;
  const props = table(generated, 'Properties').map(readProperty);
  const events = table(generated, 'Events').map(row => codeValue(row[0]));
  metadata[tag] = {
    attributes: Object.fromEntries(props.map(({ name, attribute }) => [name, attribute])),
    defaults: Object.fromEntries(props.map(({ name, defaultValue }) => [name, defaultValue])),
    requiredProps: props.filter(prop => prop.required).map(prop => prop.name),
    events,
  };

  if (writing) continue;
  if (!tags.has(tag)) { issues.push(tag + ' missing in catalog'); continue; }
  const spec = await Bun.file(resolve(playgroundRoot, 'specs', tag + '.sandbox.json')).json();
  if (spec.tag !== tag) issues.push(tag + ' spec declares ' + spec.tag);
  const definitions = spec.props || {};
  for (const { name, type } of props) {
    if (!(name in definitions)) { issues.push(tag + '.' + name + ' missing control'); continue; }
    const control = definitions[name];
    if (control.type === 'select' && /^"[^"]+"(?:\s*\|\s*"[^"]+")+$/.test(type)) {
      for (const match of type.matchAll(/"([^"]+)"/g)) {
        if (!control.options?.includes(match[1])) issues.push(tag + '.' + name + ' missing option ' + match[1]);
      }
    }
  }
  for (const scenario of [{props:definitions}, ...spec.variants || [], ...spec.edgeCases || []]) {
    for (const key of Object.keys(scenario.props || {})) {
      if (!(key in metadata[tag].attributes) && !['style', 'dir'].includes(key)) issues.push(tag + ': unknown property ' + key);
    }
  }
}

const sorted = Object.fromEntries(Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)));
const contents = JSON.stringify(sorted, null, 2) + '\n';
if (writing) {
  writeFileSync(apiFile, contents);
} else {
  for (const tag of tags) if (!(String(tag) in metadata)) issues.push('Unknown component ' + tag);
  if (readFileSync(apiFile, 'utf8').replaceAll('\r\n', '\n') !== contents) issues.push('Refresh component API with bun scripts/playground-contract.ts --write');
  if (issues.length) throw new Error(issues.join('\n'));
  console.log(tags.size + ' playground specs match the component API.');
}
