import { Component, Prop, Event, EventEmitter, Watch, Listen, State, Method, h } from '@stencil/core';
import { handleTabTrap, focusFirstElement, getDeepActiveElement } from '../../../utils/dom';
import type { QDialogBackdropEffect } from './dialog.types';
import { resolveDialogBackdropEffect } from './internals/backdrop';
import {
  cancelDialogOpenAnimation,
  clearDialogTransitionWait,
  closeDialogAfterTransition,
  scheduleDialogOpenAnimation,
  type DialogLifecycleState,
} from './internals/lifecycle';

let dialogId = 0;

/**
 * Modal confirmation or message dialog with focus trapping and safe solid backdrops.
 * @slot - Custom dialog body content.
 * @slot header - Custom header content. Provide an accessible name when replacing `heading`.
 * @slot footer - Custom action content. Consumers own disabled/loading behavior for slotted controls.
 * @part backdrop - Backdrop click target.
 * @part modal - Dialog surface.
 * @part header - Header region.
 * @part body - Body region.
 * @part footer - Footer region.
 * @part close-btn - Header close button.
 * @part cancel-btn - Default cancel button.
 * @part confirm-btn - Default confirm button.
 */
@Component({
  tag: 'q-dialog',
  styleUrl: 'dialog.css',
  shadow: true,
})
export class QDialog {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Rendered by the default dialog header. */
  @Prop() heading?: string;
  /** @deprecated Use heading. Used only when heading is unset. */
  @Prop() dialogTitle?: string;
  /** Accessible name for the dialog, especially when using a custom header without heading. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Rendered by the default dialog body. */
  @Prop() message?: string;

  @Prop({ reflect: true }) size: 'sm' | 'md' | 'lg' | 'full' = 'md';
  /** `solid` is CEF-safe; `none` keeps only a transparent click layer. */
  @Prop({ reflect: true }) backdrop?: QDialogBackdropEffect;
  /** @deprecated Use backdrop. Used only when backdrop is unset. */
  @Prop({ attribute: 'backdrop-effect', reflect: true }) backdropEffect: QDialogBackdropEffect = 'solid';

  /** Allows Escape to close the dialog when not loading. Defaults to true. */
  @Prop() closeOnEscape?: boolean;
  /** @deprecated Use closeOnEscape. Used only when closeOnEscape is unset. */
  @Prop() closeOnEsc: boolean = true;
  /** Allows a backdrop click to close the dialog when not loading. Defaults to true. */
  @Prop() closeOnBackdropClick?: boolean;
  /** @deprecated Use closeOnBackdropClick. Used only when closeOnBackdropClick is unset. */
  @Prop() closeOnOverlayClick: boolean = true;
  @Prop() showCancel: boolean = true;
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() showConfirm: boolean = true;
  @Prop() confirmLabel: string = 'Confirm';
  /** Disables dialog actions and marks the confirm button busy. */
  @Prop() loading: boolean = false;

  @Prop({ reflect: true, mutable: true }) open: boolean = false;

  /** Accessible label for the header close button. */
  @Prop() closeLabel: string = 'Close dialog';

  @Event() qConfirm!: EventEmitter<void>;

  @Event() qCancel!: EventEmitter<void>;

  /** Emitted whenever the dialog is closed through a public action. */
  @Event() qClose!: EventEmitter<void>;

  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;
  @State() hasFooter: boolean = false;

  private dialogEl?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private previousActiveElement: HTMLElement | null = null;
  private readonly dialogId = ++dialogId;
  private lifecycleState: DialogLifecycleState = {};

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad() {
    this.isVisible = this.open;
    this.isAnimatedOpen = this.open;
  }

  componentDidLoad() {
    if (this.open) {
      focusFirstElement(this.dialogEl);
    }
  }

  disconnectedCallback() {
    this.cancelOpenAnimation();
    this.clearTransitionWait();
  }

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.previousActiveElement = getDeepActiveElement() as HTMLElement | null;
      this.isVisible = true;
      this.scheduleOpenAnimation();
    } else {
      this.cancelOpenAnimation();
      this.isAnimatedOpen = false;
      if (this.dialogEl) {
        closeDialogAfterTransition({
          state: this.lifecycleState,
          dialogEl: this.dialogEl,
          previousActiveElement: this.previousActiveElement,
          setVisible: visible => {
            this.isVisible = visible;
          },
          setPreviousActiveElement: element => {
            this.previousActiveElement = element;
          },
        });
      } else {
        this.isVisible = false;
      }
    }
  }

  // ============================ [4] EXPOSED METHODS ============================

  @Method()
  async show() {
    this.open = true;
  }

  /** Closes the dialog and emits qClose. */
  @Method()
  async close() {
    this.open = false;
    this.qClose.emit();
  }

  /** Runs the confirm action unless the dialog is loading. */
  @Method()
  async confirm() {
    if (this.loading) return;
    this.handleConfirm();
  }

  /** Runs the cancel action unless the dialog is loading. */
  @Method()
  async cancel() {
    if (this.loading) return;
    this.handleCancel();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape' && (this.closeOnEscape ?? this.closeOnEsc)) {
      this.handleCancel();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' && this.open && this.dialogEl) {
      handleTabTrap(e, this.dialogEl);
    }
  };

  private handleBackdropClick = () => {
    if ((this.closeOnBackdropClick ?? this.closeOnOverlayClick) && !this.loading) {
      this.handleCancel();
    }
  };

  private handleConfirm = () => {
    if (this.loading) return;
    this.qConfirm.emit();
    this.open = false;
    this.qClose.emit();
  };

  private handleCancel = () => {
    if (this.loading) return;
    this.qCancel.emit();
    this.open = false;
    this.qClose.emit();
  };

  private handleCloseButton = () => {
    if (this.loading) return;
    this.open = false;
    this.qClose.emit();
  };

  private get titleId(): string {
    return `q-dialog-${this.dialogId}-title`;
  }

  private get descriptionId(): string {
    return `q-dialog-${this.dialogId}-description`;
  }

  private scheduleOpenAnimation() {
    scheduleDialogOpenAnimation({
      state: this.lifecycleState,
      dialogEl: this.dialogEl,
      isOpen: () => this.open,
      setAnimatedOpen: open => {
        this.isAnimatedOpen = open;
      },
    });
  }

  private cancelOpenAnimation() {
    cancelDialogOpenAnimation(this.lifecycleState);
  }

  private clearTransitionWait() {
    clearDialogTransitionWait(this.lifecycleState);
  }

  private getResolvedBackdropEffect(): QDialogBackdropEffect {
    return resolveDialogBackdropEffect(this.backdrop ?? this.backdropEffect);
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const titleText = this.heading ?? this.dialogTitle;
    const ariaLabel = this.ariaLabel?.trim() || undefined;

    const classes = {
      'dialog-wrapper': true,
      'is-open': this.isAnimatedOpen,
      'is-visible': this.isVisible,
    };
    const backdropEffect = this.getResolvedBackdropEffect();
    const backdropClasses = {
      'dialog-backdrop': true,
      [`effect-${backdropEffect}`]: true,
    };

    return (
      <div
        class={classes}
        onKeyDown={this.handleKeyDown}
        inert={!this.open ? true : undefined}
      >
        {/* Semi-transparent Backdrop Overlay */}
        <div
          class={backdropClasses}
          onClick={this.handleBackdropClick}
          part="backdrop"
        />

        {/* Sliding / Fading Dialog Box */}
        <div
          ref={el => (this.dialogEl = el)}
          class="dialog-modal"
          part="modal"
          role="dialog"
          aria-modal="true"
          aria-hidden={this.open ? 'false' : 'true'}
          aria-label={ariaLabel}
          aria-labelledby={!ariaLabel && titleText ? this.titleId : undefined}
          aria-describedby={this.message ? this.descriptionId : undefined}
          tabindex="-1"
        >
          {/* Header */}
          <header class="dialog-header" part="header">
            <slot name="header">
              {titleText && <h2 id={this.titleId} class="dialog-title">{titleText}</h2>}
            </slot>
            <button
              class="dialog-close-btn"
              onClick={this.handleCloseButton}
              aria-label={this.closeLabel}
              disabled={this.loading}
              part="close-btn"
            >
              <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Body */}
          <div class="dialog-body" part="body">
            <slot>
              {this.message && <p id={this.descriptionId} class="dialog-message">{this.message}</p>}
            </slot>
          </div>

          {/* Footer */}
          <footer class={{ 'dialog-footer': true, 'is-hidden': !this.showCancel && !this.showConfirm && !this.hasFooter }} part="footer">
            <slot name="footer" onSlotchange={event => {
              this.hasFooter = (event.target as HTMLSlotElement).assignedNodes().some(node => node.nodeType === 1 || !!node.textContent?.trim());
            }}>
              <div class="dialog-actions">
                {this.showCancel && (
                  <button
                    class="btn-cancel"
                    onClick={this.handleCancel}
                    disabled={this.loading}
                    part="cancel-btn"
                  >
                    {this.cancelLabel}
                  </button>
                )}
                {this.showConfirm && (
                  <button
                    class="btn-confirm"
                    onClick={this.handleConfirm}
                    disabled={this.loading}
                    aria-busy={this.loading ? 'true' : 'false'}
                    part="confirm-btn"
                  >
                    {this.loading && <span class="spinner-el" />}
                    <span class="btn-label">{this.confirmLabel}</span>
                  </button>
                )}
              </div>
            </slot>
          </footer>
        </div>
      </div>
    );
  }
}
