import { Component, Prop, h, Event, EventEmitter } from '@stencil/core';

import type { QStepDiagramItemLayout, QStepDiagramItemOrientation, QStepDiagramItemLineStyle, QStepDiagramItemStatus } from './step-diagram-item.types';
import { isStepDiagramItemActivationKey } from './step-diagram-item.utils';

/**
 * Interactive step item for q-step-diagram sequences.
 * @slot badge - Optional custom badge content.
 * @slot title - Step title content.
 * @slot - Step body content.
 * @part badge - Decorative badge node.
 * @part connector - Connector line between steps.
 * @part content - Focusable content button.
 * @part title - Step title wrapper.
 * @part body - Step body wrapper.
 */
@Component({
  tag: 'q-step-diagram-item',
  styleUrl: 'step-diagram-item.css',
  shadow: true,
})
export class QStepDiagramItem {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop({ reflect: true }) lineStyle: QStepDiagramItemLineStyle = 'solid';
  /** Direction of the step. A q-step-diagram parent supplies its orientation; standalone default is vertical. */
  @Prop({ reflect: true, mutable: true }) orientation?: QStepDiagramItemOrientation;
  /** @deprecated Use orientation. Used only when orientation is unset. */
  @Prop({ reflect: true, mutable: true }) layout: QStepDiagramItemLayout = 'vertical';

  @Prop({ reflect: true }) status: QStepDiagramItemStatus = 'completed';

  /** Emitted when the focusable step content is clicked or activated with Enter/Space. */
  @Event() qItemClick: EventEmitter<void>;

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleTrigger = (e: Event) => {
    e.stopPropagation();
    this.qItemClick.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (isStepDiagramItemActivationKey(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      this.qItemClick.emit();
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const orientation = this.orientation ?? this.layout;
    return (
      <div class={{ 'step-item': true, [`orientation-${orientation}`]: true }}>
        {/* Visual Line Path and Node Circle - decorative */}
        <div class="step-line-container">
          <div class="step-badge" aria-hidden="true" part="badge">
            <slot name="badge">
              <div class="badge-dot" />
            </slot>
          </div>
          <div class="step-connector" part="connector" />
        </div>

        {/* Content Box - focusable */}
        <div 
          class="step-content" 
          onClick={this.handleTrigger} 
          onKeyDown={this.handleKeyDown}
          tabindex="0"
          role="button"
          part="content"
          aria-current={this.status === 'active' ? 'step' : undefined}
          aria-disabled={this.status === 'pending' ? 'true' : undefined}
        >
          <div class="step-title" part="title">
            <slot name="title" />
          </div>
          <div class="step-body" part="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }
}
