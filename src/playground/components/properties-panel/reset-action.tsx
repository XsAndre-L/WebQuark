import { RotateCcw } from '@lucide/icons';
import { h } from '../../dom-factory';

export function createResetAction(label: string, onReset: () => void): HTMLElement {
  return (
    <span class="playground-reset-action">
      <q-button
        type="button"
        size="sm"
        variant="ghost"
        icon-only="true"
        aria-label={label}
        onClick={onReset}
      >
        {Object.assign(<q-icon name="rotate-ccw" size="16" slot="icon-left" />, { definition: RotateCcw })}
      </q-button>
      <q-tooltip content={label} position="left" />
    </span>
  );
}
