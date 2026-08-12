import { Component, Element, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { identifyItems, type IdentifiedCollectionItem } from '../../../utils/collection-identity';
import type {
  NavbarItem,
  NavbarItemInput,
  NavbarSelectDetail,
  QNavbarAddonPlacement,
  QNavbarEdge,
  QNavbarMobileMode,
} from './navbar.types';
import { getNavbarItems } from './navbar.utils';

let navbarIds = 0;

/**
 * Edge-aware site navigation with optional brand content, actions, and mobile menu.
 *
 * @slot brand - Custom brand link content.
 * @slot nav - Custom desktop navigation content.
 * @slot actions - Desktop action controls.
 * @slot mobile-nav - Custom mobile navigation content.
 * @slot mobile-actions - Mobile action controls.
 * @part navbar - Navbar container.
 * @part brand - Brand link.
 * @part nav - Desktop navigation container.
 * @part actions - Desktop action container.
 * @part menu-button - Mobile menu toggle button.
 * @part mobile-panel - Mobile menu panel.
 * @part item-addon - Per-item slotted add-on container.
 */
@Component({
  tag: 'q-navbar',
  styleUrl: 'navbar.css',
  shadow: true,
})
export class QNavbar {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  @Prop() brand?: string;
  @Prop() logoSrc?: string;
  /** Accessible text for a logo-only brand image. */
  @Prop() logoAlt: string = '';
  @Prop() brandHref: string = '/';
  /** Navigation items; strings use the same text for label and value, while objects enable links, icons, and state. */
  @Prop() items: NavbarItemInput[] | string = [];
  /** Matches either an item's value or `href`. */
  @Prop() activeValue: string = '';

  @Prop({ reflect: true }) edge: QNavbarEdge = 'top';
  @Prop({ reflect: true }) sticky: boolean = false;
  @Prop({ reflect: true }) compact: boolean = false;
  @Prop({ reflect: true }) transparent: boolean = false;
  @Prop({ reflect: true }) bordered: boolean = true;

  /** Controls whether mobile widths collapse items into a menu or keep them inline. */
  @Prop({ reflect: true }) mobileMode: QNavbarMobileMode = 'menu';
  /** Accessible label for the mobile menu toggle button. */
  @Prop() mobileLabel: string = 'Menu';

  /** Accessible name for the desktop and mobile navigation regions. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @Event() qSelect!: EventEmitter<NavbarSelectDetail>;

  @Event() qMenuToggle!: EventEmitter<boolean>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() menuOpen: boolean = false;
  @State() hasMobileContent: boolean = false;

  private readonly instanceId = ++navbarIds;
  private readonly primaryNavId = `q-navbar-primary-nav-${this.instanceId}`;
  private readonly mobilePanelId = `q-navbar-mobile-panel-${this.instanceId}`;
  private dismissListenersActive = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  disconnectedCallback() {
    this.removeMenuDismissListeners();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get parsedItems(): NavbarItem[] {
    return getNavbarItems(this.items);
  }

  private handleMenuToggle = () => {
    this.setMenuOpen(!this.menuOpen);
  };

  private handleMenuClose = () => {
    this.setMenuOpen(false);
  };

  private setMenuOpen(open: boolean) {
    if (this.menuOpen === open) return;

    this.menuOpen = open;
    this.qMenuToggle.emit(open);

    if (open) {
      this.addMenuDismissListeners();
    } else {
      this.removeMenuDismissListeners();
    }
  }

  private addMenuDismissListeners() {
    if (this.dismissListenersActive || typeof document === 'undefined' || typeof window === 'undefined') return;

    document.addEventListener('keydown', this.handleDocumentKeyDown);
    window.addEventListener('click', this.handleWindowClick);
    this.dismissListenersActive = true;
  }

  private removeMenuDismissListeners() {
    if (!this.dismissListenersActive || typeof document === 'undefined' || typeof window === 'undefined') return;

    document.removeEventListener('keydown', this.handleDocumentKeyDown);
    window.removeEventListener('click', this.handleWindowClick);
    this.dismissListenersActive = false;
  }

  private handleDocumentKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.handleMenuClose();
    }
  };

  private handleWindowClick = (ev: MouseEvent) => {
    const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
    if (path.includes(this.el)) return;
    if (!path.length && ev.target instanceof Node && this.el.contains(ev.target)) return;

    this.handleMenuClose();
  };

  private handleItemClick = (item: NavbarItem, ev: MouseEvent) => {
    if (item.disabled) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    const value = item.value || item.href || item.label;
    this.qSelect.emit({
      value,
      label: item.label,
      item,
      originalEvent: ev,
    });
    this.handleMenuClose();
  };

  private handleMobileSlotChange = () => {
    this.hasMobileContent = !!this.el.querySelector('[slot="mobile-nav"], [slot="mobile-actions"]');
  };

  private setIconAttribute(el: HTMLElement, name: string, value?: string | number) {
    if (value === undefined || value === null || value === '') {
      el.removeAttribute(name);
      return;
    }

    const nextValue = String(value);
    if (el.getAttribute(name) !== nextValue) {
      el.setAttribute(name, nextValue);
    }
  }

  private syncIconAttributes = (el: HTMLElement | undefined, item: NavbarItem) => {
    if (!el || !item.icon) return;

    this.setIconAttribute(el, 'name', item.icon);
    this.setIconAttribute(el, 'lib', item.iconLib || 'lucide');
    this.setIconAttribute(el, 'size', item.iconSize || 'sm');
    this.setIconAttribute(el, 'local-path', item.iconLocalPath);
  };

  // ===================== [6] RENDER (Visual Template Only) =====================

  private renderBrand() {
    const logoAlt = this.logoAlt || (this.brand ? '' : 'Brand');
    const content = (
      <span class="brand-content">
        {this.logoSrc && <img class="brand-logo" src={this.logoSrc} alt={logoAlt} />}
        {this.brand && <span class="brand-text">{this.brand}</span>}
      </span>
    );

    return (
      <a class="brand-link" href={this.brandHref} part="brand">
        <slot name="brand">{content}</slot>
      </a>
    );
  }

  private renderNavItem({ item, key }: IdentifiedCollectionItem<NavbarItem>) {
    const active = item.active || (!!this.activeValue && (item.value === this.activeValue || item.href === this.activeValue));
    const iconOnly = !!item.iconOnly && !!item.icon;
    const accessibleLabel = iconOnly ? item.ariaLabel || item.label : undefined;
    const addonPlacement: QNavbarAddonPlacement = item.addonPlacement || 'top-end';
    const classes = {
      'nav-item': true,
      'is-active': active,
      'is-disabled': !!item.disabled,
      'is-icon-only': iconOnly,
    };
    const content = [
      item.icon && (
        <q-icon
          class="nav-item__icon"
          name={item.icon}
          lib={item.iconLib || 'lucide'}
          localPath={item.iconLocalPath}
          size={item.iconSize || 'sm'}
          ref={(el) => this.syncIconAttributes(el, item)}
        />
      ),
      <span class="nav-item__label" aria-hidden={iconOnly ? 'true' : undefined}>
        {item.label}
      </span>,
    ];
    const addon = item.addonSlot ? (
      <span class={`nav-item__addon is-${addonPlacement}`} part="item-addon">
        <slot name={item.addonSlot} />
      </span>
    ) : null;

    if (item.href) {
      return (
        <span key={key} class={{ 'nav-item-shell': true, 'is-icon-only': iconOnly }}>
          <a
            class={classes}
            href={item.disabled ? undefined : item.href}
            target={item.disabled ? undefined : item.target}
            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            aria-current={active ? 'page' : undefined}
            aria-disabled={item.disabled ? 'true' : 'false'}
            aria-label={accessibleLabel}
            onClick={(ev) => this.handleItemClick(item, ev)}
          >
            {content}
          </a>
          {addon}
        </span>
      );
    }

    return (
      <span key={key} class={{ 'nav-item-shell': true, 'is-icon-only': iconOnly }}>
        <button
          class={classes}
          type="button"
          disabled={item.disabled}
          aria-current={active ? 'page' : undefined}
          aria-label={accessibleLabel}
          onClick={(ev) => this.handleItemClick(item, ev)}
        >
          {content}
        </button>
        {addon}
      </span>
    );
  }

  private renderNavItems(items: readonly IdentifiedCollectionItem<NavbarItem>[]) {
    return items.map(item => this.renderNavItem(item));
  }

  render() {
    const items = identifyItems(
      this.parsedItems,
      item => item.value,
      { warningContext: 'q-navbar.items' },
    );
    const hasItems = items.length > 0;
    const ariaLabel = this.ariaLabel?.trim() || undefined;

    return (
      <div
        class={{
          'navbar': true,
          'is-open': this.menuOpen,
          'is-sticky': this.sticky,
          'is-compact': this.compact,
          'is-transparent': this.transparent,
          'is-bordered': this.bordered,
        }}
        part="navbar"
      >
        <div class="navbar-row">
          {this.renderBrand()}

          <nav id={this.primaryNavId} class="desktop-nav" aria-label={ariaLabel || 'Primary navigation'} part="nav">
            {hasItems && this.renderNavItems(items)}
            <slot name="nav" />
          </nav>

          <div class="desktop-actions" part="actions">
            <slot name="actions" />
          </div>

          <button
            class="menu-button"
            type="button"
            aria-label={this.mobileLabel}
            aria-expanded={this.menuOpen ? 'true' : 'false'}
            aria-controls={`${this.primaryNavId} ${this.mobilePanelId}`}
            aria-haspopup="true"
            onClick={this.handleMenuToggle}
            part="menu-button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          id={this.mobilePanelId}
          class={{ 'mobile-panel': true, 'has-content': this.hasMobileContent }}
          part="mobile-panel"
        >
          <nav class="mobile-nav" aria-label={ariaLabel || 'Mobile navigation'}>
            <slot name="mobile-nav" onSlotchange={this.handleMobileSlotChange} />
          </nav>
          <div class="mobile-actions">
            <slot name="mobile-actions" onSlotchange={this.handleMobileSlotChange} />
          </div>
        </div>
      </div>
    );
  }
}
