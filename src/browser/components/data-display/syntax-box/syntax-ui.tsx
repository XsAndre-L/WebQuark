import { h, type VNode } from '@stencil/core';
import { Braces, Check, Copy } from '@lucide/icons';

interface SyntaxActions {
  editable: boolean;
  copyable: boolean;
  disabled: boolean;
  formatSupported: boolean;
  copied: boolean;
  copyFeedback: string;
  onFormat: () => void;
  onCopy: () => void;
  ref: (element?: HTMLElement) => void;
}

export function renderSyntaxActions(actions: SyntaxActions) {
  const formatLabel = actions.formatSupported ? 'Format JSON' : 'Formatting is available for JSON only.';
  return (
    <div class="panel-actions" ref={actions.ref}>
      <slot name="actions" />
      {actions.editable && (
        <q-button class="format-btn" ariaLabel="Format JSON" variant="ghost" size="sm"
          disabled={actions.disabled || !actions.formatSupported} onClick={actions.onFormat}>
          <q-icon slot="icon-left" definition={Braces} name="braces" size="sm" />
          <q-tooltip slot="icon-left" position="bottom" content={formatLabel} />
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
