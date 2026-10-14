import { build } from './build';
export async function local(root: string): Promise<void> { await build(root, true); }
