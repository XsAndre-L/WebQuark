import { buildPinnedFormatter, refreshPinnedAdapters, updateFormatter } from '../../src/tooling/formatter/update';

const [action, tool] = process.argv.slice(2);
if (tool === 'formatter' && action === 'update') {
  console.log('Embedded Prettier ' + await updateFormatter());
} else if (tool === 'formatter' && action === 'build') {
  await buildPinnedFormatter();
} else if (tool === 'formatter' && action === 'refresh') {
  await refreshPinnedAdapters();
} else {
  throw new Error('Usage: bun script/tooling/tooling.ts <update|build|refresh> formatter');
}
