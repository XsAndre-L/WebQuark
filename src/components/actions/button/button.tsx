import { Build, Component, Prop, Element, State, Event, EventEmitter, Mixin, Watch, h } from '@stencil/core';
import type { QIconName } from '../../media/icon/icon.types';
import { withActionProps } from '../action.props';
import type { QButtonLayout, QButtonShape, QButtonSize, QButtonType, QButtonVariant } from './button.types';
import { shouldWarnForMissingButtonAccessibleName } from './button.utils';

/**
 * Action button that renders a native button or anchor according to `href`.
 * @slot - Button label content.
 * @slot icon-left - Content placed before the label.
 * @slot icon-right - Content placed after the label.
 * @part button - Native button or anchor element.
 * @part icon - Leading q-icon rendered by the `icon` shorthand.
 * @part spinner - Loading spinner shown while `loading` is true.
 */
@Component({
  tag: 'q-button',
  styleUrl: 'button.css',
  shadow: {
    delegatesFocus: true,
  },
})
export class QButton extends Mixin(withActionProps) {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** Lucide icon rendered before the label. Use icon slots for custom content. */
  @Prop() icon?: QIconName;
  /** Auto-detected from slotted icon content when omitted. */
  @Prop({ reflect: true }) iconOnly?: boolean;
  /** Required when an icon-only button has no accessible text. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @Prop() variant: QButtonVariant = 'primary';
  @Prop() size: QButtonSize = 'md';
  /** The `circle` shape uses a fixed-size circular presentation. */
  @Prop({ reflect: true }) shape: QButtonShape = 'default';
  @Prop({ reflect: true }) layout: QButtonLayout = 'inline';
  @Prop({ reflect: true }) expand: boolean = false;

  /** Shows a spinner and prevents interaction while loading. */
  @Prop({ reflect: true }) loading: boolean = false;

  @Prop() target?: string;
  /** Applied to the native `<button>` when `href` is unset. */
  @Prop() type: QButtonType = 'button';

  /** Emitted on activation unless disabled or loading. */
  @Event() qClick!: EventEmitter<MouseEvent>;
  @Event() qFocus!: EventEmitter<FocusEvent>;
  @Event() qBlur!: EventEmitter<FocusEvent>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() autoIconOnly: boolean = false;

  private hasWarnedMissingAccessibleName = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad() {
    this.checkIconOnly();
  }

  componentDidLoad() {
    this.warnForMissingAccessibleName();
  }

  @Watch('icon')
  @Watch('iconOnly')
  @Watch('ariaLabel')
  handleIconAccessibilityChange() {
    this.checkIconOnly();
    this.warnForMissingAccessibleName();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private checkIconOnly = () => {
    const text = this.getVisibleText();
    const hasIcon = this.hasShortcutIcon() ||
                    this.el.querySelector('q-icon') !== null ||
                    this.el.querySelector('[slot="icon-left"]') !== null ||
                    this.el.querySelector('[slot="icon-right"]') !== null;
    this.autoIconOnly = text === '' && hasIcon;
  };

  private handleSlotChange = () => {
    this.checkIconOnly();
    this.warnForMissingAccessibleName();
  };

  private getVisibleText(): string {
    return Array.from(this.el.childNodes)
      .filter(node => {
        if (node.nodeType !== 1) return true;
        const slot = (node as HTMLElement).slot;
        return slot !== 'icon-left' && slot !== 'icon-right';
      })
      .map(node => node.textContent || '')
      .join('')
      .trim();
  }

  private getShortcutIcon(): QIconName | undefined {
    const icon = this.icon?.trim();
    return icon || undefined;
  }

  private hasShortcutIcon(): boolean {
    return this.getShortcutIcon() !== undefined;
  }

  private hasIconContent(): boolean {
    return this.hasShortcutIcon() ||
      this.el.querySelector('q-icon') !== null ||
      this.el.querySelector('[slot="icon-left"]') !== null ||
      this.el.querySelector('[slot="icon-right"]') !== null;
  }

  private hasDefaultSlotIcon(): boolean {
    return this.el.querySelector('q-icon:not([slot])') !== null;
  }

  private warnForMissingAccessibleName() {
    if (!Build.isDev) return;

    if (shouldWarnForMissingButtonAccessibleName({
      ariaLabel: this.ariaLabel,
      iconOnly: this.iconOnly,
      hasVisibleText: this.getVisibleText() !== '',
      hasIcon: this.hasIconContent(),
      hasWarned: this.hasWarnedMissingAccessibleName,
    })) {
      this.hasWarnedMissingAccessibleName = true;
      console.warn('QButton: Icon-only buttons require visible text or aria-label.', this.el);
    }
  }

  private handleClick = (e: MouseEvent) => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.qClick.emit(e);
  };

  private handleFocus = (ev: FocusEvent) => {
    this.qFocus.emit(ev);
  };

  private handleBlur = (ev: FocusEvent) => {
    this.qBlur.emit(ev);
  };

  private getResolvedRel(): string | undefined {
    if (this.rel) return this.rel;
    return this.target === '_blank' ? 'noopener noreferrer' : undefined;
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const isLink = this.href !== undefined && this.href !== null && this.href !== '';
    const isBtnDisabled = this.disabled || this.loading;
    const isIcon = this.iconOnly !== undefined ? this.iconOnly : this.autoIconOnly;
    const shortcutIcon = this.getShortcutIcon();
    const ariaLabel = this.ariaLabel?.trim() || undefined;
    const hasDefaultSlotIcon = this.hasDefaultSlotIcon();

    const classes = {
      'btn': true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      [`shape-${this.shape}`]: true,
      [`layout-${this.layout}`]: true,
      'is-disabled': isBtnDisabled,
      'is-expanded': this.expand,
      'is-icon-only': isIcon,
    };

    const innerContent = [
      this.loading && <div class="btn-spinner" part="spinner" />,
      <span class="btn-content-wrap" style={{ visibility: this.loading ? 'hidden' : 'visible' }}>
        <slot name="icon-left" onSlotchange={this.handleSlotChange}>
          {shortcutIcon && <q-icon name={shortcutIcon} size={this.size} part="icon" />}
        </slot>
        <span class={{ 'btn-label': true, 'has-default-slot-icon': hasDefaultSlotIcon }}>
          <slot onSlotchange={this.handleSlotChange} />
        </span>
        <slot name="icon-right" onSlotchange={this.handleSlotChange} />
      </span>
    ];

    if (isLink) {
      return (
        <a
          class={classes}
          part="button"
          href={this.href}
          target={this.target}
          rel={this.getResolvedRel()}
          download={this.download}
          tabindex={isBtnDisabled ? -1 : undefined}
          aria-disabled={isBtnDisabled ? 'true' : 'false'}
          aria-busy={this.loading ? 'true' : 'false'}
          aria-label={ariaLabel}
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          {innerContent}
        </a>
      );
    }

    return (
      <button
        class={classes}
        part="button"
        type={this.type}
        disabled={isBtnDisabled}
        aria-busy={this.loading ? 'true' : 'false'}
        aria-label={ariaLabel}
        onClick={this.handleClick}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        {innerContent}
      </button>
    );
  }
}

