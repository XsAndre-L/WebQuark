import { Component, Prop, Element, Event, EventEmitter, Watch, Listen, State, Method, h } from '@stencil/core';
import { handleTabTrap, waitForTransitionEnd, focusFirstElement, safeFocus } from '../../utils/dom';

@Component({
  tag: 'q-dialog',
  styleUrl: 'dialog.css',
  shadow: true,
})
export class QDialog {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop({ reflect: true, mutable: true }) open: boolean = false;
  @Prop() dialogTitle?: string;
  @Prop() message?: string;
  @Prop() closeOnEsc: boolean = true;
  @Prop() closeOnOverlayClick: boolean = true;
  @Prop() loading: boolean = false;
  @Prop() confirmLabel: string = 'Confirm';
  @Prop() cancelLabel: string = 'Cancel';
  @Prop() showCancel: boolean = true;
  @Prop() showConfirm: boolean = true;

  @Event() qConfirm!: EventEmitter<void>;
  @Event() qCancel!: EventEmitter<void>;
  @Event() qClose!: EventEmitter<void>;

  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;

  private dialogEl?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private previousActiveElement: HTMLElement | null = null;

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

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.previousActiveElement = document.activeElement as HTMLElement;
      this.isVisible = true;
      setTimeout(() => {
        this.isAnimatedOpen = true;
        if (this.dialogEl) {
          waitForTransitionEnd(this.dialogEl, () => {
            focusFirstElement(this.dialogEl);
          });
        }
      }, 50);
    } else {
      this.isAnimatedOpen = false;
      if (this.dialogEl) {
        waitForTransitionEnd(this.dialogEl, () => {
          this.isVisible = false;
          safeFocus(this.previousActiveElement);
          this.previousActiveElement = null;
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

  @Method()
  async close() {
    this.open = false;
    this.qClose.emit();
  }

  @Method()
  async confirm() {
    if (this.loading) return;
    this.handleConfirm();
  }

  @Method()
  async cancel() {
    if (this.loading) return;
    this.handleCancel();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape' && this.closeOnEsc) {
      this.handleCancel();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' && this.open && this.dialogEl) {
      handleTabTrap(e, this.dialogEl);
    }
  };

  private handleBackdropClick = () => {
    if (this.closeOnOverlayClick && !this.loading) {
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

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const titleText = this.dialogTitle;

    const classes = {
      'dialog-wrapper': true,
      'is-open': this.isAnimatedOpen,
      'is-visible': this.isVisible,
    };

    return (
      <div
        class={classes}
        onKeyDown={this.handleKeyDown}
        inert={!this.open ? true : undefined}
      >
        {/* Semi-transparent Backdrop Overlay */}
        <div
          class="dialog-backdrop"
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
          tabindex="-1"
        >
          {/* Header */}
          <header class="dialog-header" part="header">
            <slot name="header">
              {titleText && <h2 class="dialog-title">{titleText}</h2>}
            </slot>
            <button
              class="dialog-close-btn"
              onClick={this.handleCloseButton}
              aria-label="Close dialog"
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
              {this.message && <p class="dialog-message">{this.message}</p>}
            </slot>
          </div>

          {/* Footer */}
          <footer class="dialog-footer" part="footer">
            <slot name="footer">
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
