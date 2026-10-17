import { dimensionTokens } from '../../../browser/theme/tokens';
import type { TokenItem } from './token-row';

/** Editor ranges use pixels even when the underlying theme value uses rem. */
export const dimensionTokenItems: TokenItem[] = dimensionTokens.map(token => ({
  ...token,
  type: 'dimension',
  min: 0,
  max: token.name.startsWith('--q-input-width-') ? 720 : 64,
  desc: token.name,
}));
