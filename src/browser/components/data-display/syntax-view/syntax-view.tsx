import { AttachInternals, Component, Element, Host, Mixin, Prop, h } from '@stencil/core';
import { withSyntaxContent } from '../syntax-box/syntax-content';
import { syntaxOwner } from '../syntax-box/internals/views';

/**
 * An independently editable or read-only view inside a Syntax Box.
 * @slot - Read-only content when code is omitted.
 * @slot actions - Actions for this view.
 */
@Component({
  tag: 'q-syntax-view',
  styleUrl: '../syntax-box/syntax-box.css',
  shadow: { delegatesFocus: true },
  formAssociated: true,
})
export class QSyntaxView extends Mixin(withSyntaxContent) {
  @Element() declare el: HTMLElement;
  @AttachInternals() declare internals: ElementInternals;

  /** Optional identity for preserving selection when replacing a view element. */
  @Prop({ reflect: true }) viewKey?: string;

  render() {
    const owner = syntaxOwner(this.el);
    const variant = owner?.variant ?? this.variant;
    if (owner) {
      return <Host class="embedded-view">
        {variant === 'panel' && this.renderActions()}
        {this.renderContent(variant)}
      </Host>;
    }

    return <Host>
      <div class={variant === 'panel' ? 'panel-container syntax-layout' : 'plain-container syntax-layout'}>
        {variant === 'panel' && <div class="panel-header"><span>{this.heading}</span></div>}
        {variant === 'panel' && this.renderActions()}
        {this.renderContent(variant)}
      </div>
    </Host>;
  }
}
