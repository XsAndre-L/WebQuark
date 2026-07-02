import { Component, Prop, h, Element, Event, EventEmitter } from '@stencil/core';

import type { QStepDiagramItemLayout, QStepDiagramItemLineStyle, QStepDiagramItemStatus } from './step-diagram-item.types';

@Component({
  tag: 'q-step-diagram-item',
  styleUrl: 'step-diagram-item.css',
  shadow: true,
})
export class QStepDiagramItem {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Prop({ reflect: true }) status: QStepDiagramItemStatus = 'completed';
  @Prop({ reflect: true }) lineStyle: QStepDiagramItemLineStyle = 'solid';
  @Prop({ reflect: true, mutable: true }) layout: QStepDiagramItemLayout = 'vertical';
  @Element() el!: HTMLElement;

  @Event() qItemClick: EventEmitter<void>;

  componentWillLoad() {
    const parent = this.el.closest('q-step-diagram');
    if (parent) {
      this.layout = (parent as any).layout;
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private handleTrigger = (e: Event) => {
    e.stopPropagation();
    this.qItemClick.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this.qItemClick.emit();
    }
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    return (
      <div 
        class={{
          'step-item': true,
          [`status-${this.status}`]: true,
          [`line-${this.lineStyle}`]: true,
          [`layout-${this.layout}`]: true
        }}
      >
        {/* Visual Line Path and Node Circle - decorative */}
        <div class="step-line-container">
          <div 
            class="step-badge" 
            onClick={this.handleTrigger} 
            aria-hidden="true"
            part="badge"
          >
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
