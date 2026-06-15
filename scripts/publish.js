const { execSync } = require('child_process');
const path = require('path');

const target = process.argv[2];
const rootDir = path.resolve(__dirname, '..');
const reactDir = path.resolve(rootDir, 'packages', 'react');

if (!target) {
  console.error('Please specify a target to publish (e.g. react, core, or all)');
  process.exit(1);
}

try {
  if (target === 'core') {
    console.log('Building core components...');
    execSync('bun run build', { stdio: 'inherit', cwd: rootDir });
    console.log('Publishing @webquark/core to npm...');
    execSync('npm publish --access public', { stdio: 'inherit', cwd: rootDir });
  } else if (target === 'react') {
    console.log('Building core components...');
    execSync('bun run build', { stdio: 'inherit', cwd: rootDir });
    console.log('Building react wrapper package...');
    execSync('bun run build', { stdio: 'inherit', cwd: reactDir });
    console.log('Publishing @webquark/react to npm...');
    execSync('npm publish --access public', { stdio: 'inherit', cwd: reactDir });
  } else if (target === 'all') {
    console.log('Building core components...');
    execSync('bun run build', { stdio: 'inherit', cwd: rootDir });
    console.log('Publishing @webquark/core to npm...');
    execSync('npm publish --access public', { stdio: 'inherit', cwd: rootDir });

    console.log('Building react wrapper package...');
    execSync('bun run build', { stdio: 'inherit', cwd: reactDir });
    console.log('Publishing @webquark/react to npm...');
    execSync('npm publish --access public', { stdio: 'inherit', cwd: reactDir });
  } else {
    console.error(`Unknown target: ${target}. Supported targets are 'core', 'react', 'all'.`);
    process.exit(1);
  }
  console.log('\nPublishing completed successfully!');
} catch (error) {
  console.error('\nPublishing failed:', error.message);
  process.exit(1);
}
