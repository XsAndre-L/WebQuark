import { Component, Prop, h } from '@stencil/core';
import type { QToolbarEdge } from './toolbar.types';

/**
 * Customizable edge toolbar with consumer-owned start, content, and end regions.
 *
 * @slot start - Optional content aligned to the starting edge.
 * @slot - Primary toolbar content.
 * @slot end - Optional content aligned to the ending edge.
 * @part toolbar - Toolbar container.
 * @part row - Toolbar layout region.
 * @part start - Starting content region.
 * @part content - Primary content region.
 * @part end - Ending content region.
 */
@Component({
  tag: 'q-toolbar',
  styleUrl: 'toolbar.css',
  shadow: true,
})
export class QToolbar {
  /** Edge the toolbar is arranged against. */
  @Prop({ reflect: true }) edge: QToolbarEdge = 'top';

  /** Keeps the toolbar pinned to its configured edge. */
  @Prop({ reflect: true }) sticky: boolean = false;

  /** Uses a reduced toolbar size and padding. */
  @Prop({ reflect: true }) compact: boolean = false;

  /** Removes the toolbar background. */
  @Prop({ reflect: true }) transparent: boolean = false;

  /** Renders a border along the inward-facing edge. */
  @Prop({ reflect: true }) bordered: boolean = false;

  /** Accessible label for the toolbar content group. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  render() {
    return (
      <div
        class={{
          toolbar: true,
          'is-compact': this.compact,
          'is-transparent': this.transparent,
          'is-bordered': this.bordered,
        }}
        role={this.ariaLabel ? 'group' : undefined}
        aria-label={this.ariaLabel}
        part="toolbar"
      >
        <div class="toolbar-row" part="row">
          <div class="toolbar-start" part="start">
            <slot name="start" />
          </div>

          <div class="toolbar-content" part="content">
            <slot />
          </div>

          <div class="toolbar-end" part="end">
            <slot name="end" />
          </div>
        </div>
      </div>
    );
  }
}
