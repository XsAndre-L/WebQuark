import { h, type VNode } from '@stencil/core';
import { Braces, Check, Copy } from '@lucide/icons';

interface SyntaxActions {
  editable: boolean;
  copyable: boolean;
  disabled: boolean;
  formatLabel?: string;
  copied: boolean;
  copyFeedback: string;
  onFormat: () => void;
  onCopy: () => void;
  ref: (element?: HTMLElement) => void;
}

export function renderSyntaxActions(actions: SyntaxActions) {
  return (
    <div class="panel-actions" ref={actions.ref}>
      <slot name="actions" />
      {actions.editable && actions.formatLabel && (
        <q-button class="format-btn" ariaLabel={actions.formatLabel} variant="ghost" size="sm"
          disabled={actions.disabled} onClick={actions.onFormat}>
          <q-icon slot="icon-left" definition={Braces} name="braces" size="sm" />
          <q-tooltip slot="icon-left" position="bottom" content={actions.formatLabel} />
        </q-button>
      )}
      {actions.copyable && (
        <q-button variant="ghost" size="sm" ariaLabel={actions.copyFeedback}
          disabled={actions.disabled} onClick={actions.onCopy}>
          <q-icon slot="icon-left" definition={actions.copied ? Check : Copy} name={actions.copied ? 'check' : 'copy'} size="sm" />
          <q-tooltip slot="icon-left" position="bottom" content={actions.copyFeedback} />
        </q-button>
      )}
    </div>
  );
}

export function renderSyntaxScroller(body: VNode, height: string, ref: (element?: HTMLQScrollableElement) => void) {
  return <q-scrollable height={height} ref={ref}>{body}</q-scrollable>;
}
