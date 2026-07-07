import { Component, Prop, Event, EventEmitter, Watch, Listen, State, Method, h } from '@stencil/core';
import { handleTabTrap, waitForTransitionEnd, focusFirstElement, safeFocus, getDeepActiveElement } from '../../../utils/dom';
import type { QDialogBackdropEffect } from './dialog.types';

let dialogId = 0;

@Component({
  tag: 'q-dialog',
  styleUrl: 'dialog.css',
  shadow: true,
})
export class QDialog {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  /** Controls the dialog's visibility. */
  @Prop({ reflect: true, mutable: true }) open: boolean = false;

  /** Optional title text rendered in the default dialog header. */
  @Prop() dialogTitle?: string;

  /** Optional message text rendered in the default dialog body. */
  @Prop() message?: string;

  /** Allows the Escape key to cancel and close the dialog. */
  @Prop() closeOnEsc: boolean = true;

  /** Allows backdrop clicks to cancel and close the dialog. */
  @Prop() closeOnOverlayClick: boolean = true;

  /** Disables dialog actions and marks the confirm button busy. */
  @Prop() loading: boolean = false;

  /** Text shown on the confirm action button. */
  @Prop() confirmLabel: string = 'Confirm';

  /** Text shown on the cancel action button. */
  @Prop() cancelLabel: string = 'Cancel';

  /** Accessible label for the header close button. */
  @Prop() closeLabel: string = 'Close dialog';

  /** Shows the cancel action button. */
  @Prop() showCancel: boolean = true;

  /** Shows the confirm action button. */
  @Prop() showConfirm: boolean = true;

  /**
   * Backdrop rendering style. The `blur` option uses backdrop-filter and is not safe for CEF/Unreal Webview contexts.
   */
  @Prop({ attribute: 'backdrop-effect', reflect: true }) backdropEffect: QDialogBackdropEffect = 'blur';

  /** Emitted when the confirm action is activated. */
  @Event() qConfirm!: EventEmitter<void>;

  /** Emitted when the cancel action is activated. */
  @Event() qCancel!: EventEmitter<void>;

  /** Emitted whenever the dialog is closed through a public action. */
  @Event() qClose!: EventEmitter<void>;

  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;

  private dialogEl?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private previousActiveElement: HTMLElement | null = null;
  private readonly dialogId = ++dialogId;
  private openAnimationFrame?: number;
  private openSecondAnimationFrame?: number;
  private transitionCleanup?: () => void;

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
        this.waitForDialogTransition(() => {
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

  /** Opens the dialog. */
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

  private get titleId(): string {
    return `q-dialog-${this.dialogId}-title`;
  }

  private get descriptionId(): string {
    return `q-dialog-${this.dialogId}-description`;
  }

  private scheduleOpenAnimation() {
    this.cancelOpenAnimation();
    this.clearTransitionWait();

    this.openAnimationFrame = requestAnimationFrame(() => {
      this.openAnimationFrame = undefined;
      this.openSecondAnimationFrame = requestAnimationFrame(() => {
        this.openSecondAnimationFrame = undefined;
        if (!this.open) return;

        this.isAnimatedOpen = true;
        this.waitForDialogTransition(() => {
          if (this.open) {
            focusFirstElement(this.dialogEl);
          }
        });
      });
    });
  }

  private cancelOpenAnimation() {
    if (this.openAnimationFrame !== undefined) {
      cancelAnimationFrame(this.openAnimationFrame);
      this.openAnimationFrame = undefined;
    }

    if (this.openSecondAnimationFrame !== undefined) {
      cancelAnimationFrame(this.openSecondAnimationFrame);
      this.openSecondAnimationFrame = undefined;
    }
  }

  private waitForDialogTransition(callback: () => void) {
    if (!this.dialogEl) {
      callback();
      return;
    }

    this.clearTransitionWait();
    this.transitionCleanup = waitForTransitionEnd(this.dialogEl, () => {
      this.transitionCleanup = undefined;
      callback();
    });
  }

  private clearTransitionWait() {
    if (this.transitionCleanup) {
      this.transitionCleanup();
      this.transitionCleanup = undefined;
    }
  }

  private getResolvedBackdropEffect(): QDialogBackdropEffect {
    switch (this.backdropEffect) {
      case 'solid':
      case 'none':
        return this.backdropEffect;
      default:
        return 'blur';
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const titleText = this.dialogTitle;

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
          aria-labelledby={titleText ? this.titleId : undefined}
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
