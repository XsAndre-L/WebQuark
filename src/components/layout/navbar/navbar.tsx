import { Component, Element, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { safeParseJson } from '../../../utils/utils';
import type { NavbarItem, NavbarSelectDetail, QNavbarMobileMode } from './navbar.types';

let navbarIds = 0;

/**
 * Responsive site navigation with optional brand content, actions, and mobile menu.
 *
 * @slot brand - Custom brand link content.
 * @slot nav - Custom desktop navigation content.
 * @slot actions - Desktop action controls.
 * @slot mobile-nav - Custom mobile navigation content.
 * @slot mobile-actions - Mobile action controls.
 * @part navbar - Header container.
 * @part brand - Brand link.
 * @part nav - Desktop navigation container.
 * @part actions - Desktop action container.
 * @part menu-button - Mobile menu toggle button.
 * @part mobile-panel - Mobile menu panel.
 */
@Component({
  tag: 'q-navbar',
  styleUrl: 'navbar.css',
  shadow: true,
})
export class QNavbar {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  /** Brand text rendered inside the brand link. */
  @Prop() brand?: string;

  /** Brand logo image URL. */
  @Prop() logoSrc?: string;

  /** Accessible text for a logo-only brand image. */
  @Prop() logoAlt: string = '';

  /** URL used by the brand link. */
  @Prop() brandHref: string = '/';

  /** Navigation items rendered in the desktop and mobile menus. */
  @Prop() items: NavbarItem[] | string = [];

  /** Value or href of the currently active navigation item. */
  @Prop() activeValue: string = '';

  /** Accessible label for the mobile menu toggle button. */
  @Prop() mobileLabel: string = 'Menu';

  /** Controls whether mobile widths collapse items into a menu or keep them inline. */
  @Prop({ reflect: true }) mobileMode: QNavbarMobileMode = 'menu';

  /** Keeps the navbar pinned to the top of its scroll container. */
  @Prop({ reflect: true }) sticky: boolean = false;

  /** Uses the compact navbar height and padding. */
  @Prop({ reflect: true }) compact: boolean = false;

  /** Removes the navbar background when true. */
  @Prop({ reflect: true }) transparent: boolean = false;

  /** Renders a bottom border on the navbar. */
  @Prop({ reflect: true }) bordered: boolean = true;

  /** Emitted when a navigation item is selected. */
  @Event() qSelect!: EventEmitter<NavbarSelectDetail>;

  /** Emitted when the mobile menu opens or closes. */
  @Event() qMenuToggle!: EventEmitter<boolean>;

  // ========================= [2] INTERNAL STATE & REFS =========================

  @State() menuOpen: boolean = false;

  private readonly mobilePanelId = `q-navbar-mobile-panel-${++navbarIds}`;
  private dismissListenersActive = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  disconnectedCallback() {
    this.removeMenuDismissListeners();
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get parsedItems(): NavbarItem[] {
    return safeParseJson<NavbarItem[]>(this.items, [], 'QNavbar');
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

  private renderNavItem(item: NavbarItem) {
    const active = item.active || (!!this.activeValue && (item.value === this.activeValue || item.href === this.activeValue));
    const iconOnly = !!item.iconOnly && !!item.icon;
    const accessibleLabel = iconOnly ? item.ariaLabel || item.label : undefined;
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

    if (item.href) {
      return (
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
      );
    }

    return (
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
    );
  }

  private renderNavItems() {
    return this.parsedItems.map((item) => this.renderNavItem(item));
  }

  render() {
    const hasItems = this.parsedItems.length > 0;

    return (
      <header
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

          <nav class="desktop-nav" aria-label="Primary navigation" part="nav">
            {hasItems && this.renderNavItems()}
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
            aria-controls={this.mobilePanelId}
            aria-haspopup="true"
            onClick={this.handleMenuToggle}
            part="menu-button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div id={this.mobilePanelId} class="mobile-panel" part="mobile-panel">
          <nav class="mobile-nav" aria-label="Mobile navigation">
            {hasItems && this.renderNavItems()}
            <slot name="mobile-nav" />
          </nav>
          <div class="mobile-actions">
            <slot name="mobile-actions" />
          </div>
        </div>
      </header>
    );
  }
}
