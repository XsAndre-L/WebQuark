import { Component, Element, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { identifyItems, type IdentifiedCollectionItem } from '../../../utils/collection-identity';
import type {
  NavbarItem,
  NavbarItemInput,
  NavbarSelectDetail,
  QNavbarAddonPlacement,
  QNavbarEdge,
  QNavbarMobileMode,
  QNavbarNavAlign,
  QNavbarNavCenterWithin,
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
  @Prop() value?: string;
  /** @deprecated Use value. Used only when value is unset. */
  @Prop() activeValue: string = '';

  @Prop({ reflect: true }) edge: QNavbarEdge = 'top';
  @Prop({ reflect: true }) sticky: boolean = false;
  @Prop({ reflect: true }) compact: boolean = false;
  @Prop({ reflect: true }) transparent: boolean = false;
  @Prop({ reflect: true }) bordered: boolean = true;
  /** Horizontal desktop navigation alignment. */
  @Prop({ reflect: true }) navAlign: QNavbarNavAlign = 'start';
  /** Reference box for centred horizontal desktop navigation. */
  @Prop({ reflect: true }) navCenterWithin: QNavbarNavCenterWithin = 'available';

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
  @State() collision: boolean = false;
  @State() hasMobileNav: boolean = false;
  @State() hasMobileActions: boolean = false;

  private readonly instanceId = ++navbarIds;
  private readonly primaryNavId = `q-navbar-primary-nav-${this.instanceId}`;
  private readonly mobilePanelId = `q-navbar-mobile-panel-${this.instanceId}`;
  private dismissListenersActive = false;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private frame = 0;
  private focusAfterRender?: HTMLElement;
  private desktopFocus?: HTMLElement;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  connectedCallback() {
    if (typeof window === 'undefined') return;
    this.resizeObserver = new ResizeObserver(this.scheduleMeasure);
    this.resizeObserver.observe(this.el);
    this.mutationObserver = new MutationObserver(this.refreshObservedContent);
    this.mutationObserver.observe(this.el, { subtree: true, childList: true, characterData: true, attributes: true });
    this.el.addEventListener('load', this.scheduleMeasure, true);
    window.addEventListener('resize', this.scheduleMeasure);
    document.fonts?.addEventListener('loadingdone', this.scheduleMeasure);
    void document.fonts?.ready.then(() => this.scheduleMeasure());
    this.el.shadowRoot?.addEventListener('slotchange', this.refreshObservedContent);
    this.el.shadowRoot?.addEventListener('load', this.scheduleMeasure, true);
    if (this.el.shadowRoot) this.refreshObservedContent();
    this.scheduleMeasure();
  }

  componentDidLoad() {
    this.el.shadowRoot?.addEventListener('slotchange', this.refreshObservedContent);
    this.el.shadowRoot?.addEventListener('load', this.scheduleMeasure, true);
    this.refreshObservedContent();
  }

  componentDidRender() {
    if (this.focusAfterRender) {
      const target = this.focusAfterRender;
      (target.checkVisibility() && !target.matches(':disabled, [aria-disabled="true"]') ? target : this.firstNavigationControl()).focus();
      this.focusAfterRender = undefined;
    }
    this.scheduleMeasure();
  }

  @Watch('mobileMode')
  protected mobileModeChanged() {
    if (!this.collision) return;
    const root = this.el.shadowRoot!;
    const focused = root.activeElement || document.activeElement;
    this.setMenuOpen(false);
    if (this.mobileMode === 'inline' && focused === root.querySelector('.menu-button')) {
      this.focusAfterRender = this.desktopFocus || this.firstNavigationControl();
    } else if (this.mobileMode === 'menu' && focused &&
      (root.querySelector('.desktop-nav')!.contains(focused) || this.el.contains(focused))) {
      this.desktopFocus = focused as HTMLElement;
      this.focusAfterRender = root.querySelector<HTMLElement>('.menu-button')!;
    }
  }

  disconnectedCallback() {
    this.removeMenuDismissListeners();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.el.removeEventListener('load', this.scheduleMeasure, true);
    this.el.shadowRoot?.removeEventListener('slotchange', this.refreshObservedContent);
    this.el.shadowRoot?.removeEventListener('load', this.scheduleMeasure, true);
    window.removeEventListener('resize', this.scheduleMeasure);
    document.fonts?.removeEventListener('loadingdone', this.scheduleMeasure);
  }

  private refreshObservedContent = () => {
    this.handleMobileSlotChange();
    this.resizeObserver?.disconnect();
    this.resizeObserver?.observe(this.el);
    for (const node of [...Array.from(this.el.querySelectorAll('*')), ...Array.from(this.el.shadowRoot?.querySelectorAll('img, .brand-link, .desktop-actions, .nav-item-shell') || [])]) {
      this.resizeObserver?.observe(node);
    }
    this.scheduleMeasure();
  };

  private scheduleMeasure = () => {
    if (!this.el.isConnected || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.measureLayout();
    });
  };

  /** Measure the original nodes synchronously; no cloned controls or hidden-width guesses. */
  private measureLayout() {
    const root = this.el.shadowRoot;
    const bar = root?.querySelector<HTMLElement>('.navbar');
    if (!bar) return;
    const enabled = window.innerWidth > 720 && this.navAlign === 'center' && (this.edge === 'top' || this.edge === 'bottom');
    let next = false;
    if (enabled) {
      const row = root!.querySelector<HTMLElement>('.navbar-row')!;
      const nav = root!.querySelector<HTMLElement>('.desktop-nav')!;
      bar.classList.add('is-measuring');
      try {
        const style = getComputedStyle(row);
        const available = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const gap = parseFloat(style.columnGap) || 0;
        const brand = this.visualWidth(root!.querySelector<HTMLElement>('.brand-link')!);
        const actions = this.visualWidth(root!.querySelector<HTMLElement>('.desktop-actions')!);
        const navRect = nav.getBoundingClientRect();
        const bounds = this.visualBounds(nav);
        // Symmetric overflow allowance keeps the actual navigation group centred.
        const navigation = navRect.width + 2 * Math.max(0, navRect.left - bounds.left, bounds.right - navRect.right);
        const offset = Math.abs(parseFloat(getComputedStyle(nav).insetInlineStart) || 0);
        const sides = this.navCenterWithin === 'container' ? 2 * Math.max(brand, actions) : brand + actions;
        const spare = available - (sides + 2 * gap + navigation + 2 * offset);
        next = spare < (this.collision ? 8 : 0);
      } finally {
        bar.classList.remove('is-measuring');
      }
    }
    if (next === this.collision) return;
    let focused = (root!.activeElement || document.activeElement) as HTMLElement | null;
    while (focused?.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement as HTMLElement;
    let owner: Node | null = focused;
    let inBrand = false;
    let inMobileSlot = false;
    while (owner && owner !== this.el) {
      if (owner.nodeType === Node.ELEMENT_NODE) {
        const element = owner as HTMLElement;
        inBrand ||= element.matches('.brand-link, [slot="brand"]');
        inMobileSlot ||= element.matches('[slot="mobile-nav"], [slot="mobile-actions"]');
      }
      owner = owner.parentNode || (owner instanceof ShadowRoot ? owner.host : null);
    }
    const owned = owner === this.el;
    const toggle = root!.querySelector<HTMLElement>('.menu-button')!;
    if (next && this.mobileMode === 'menu' && owned && !inBrand) {
      this.desktopFocus = focused!;
      // Expose the toggle before the render hides the focused desktop control.
      bar.classList.add('is-collapsed');
      toggle.focus();
      this.focusAfterRender = toggle;
    } else if (!next && this.collision) {
      this.setMenuOpen(false);
      if (owned) {
        const desktopControl = focused !== toggle && !inMobileSlot ? focused : this.desktopFocus;
        this.focusAfterRender = window.innerWidth <= 720 && this.mobileMode === 'menu' ? toggle :
          desktopControl?.isConnected ? desktopControl : this.firstNavigationControl();
      }
      this.desktopFocus = undefined;
    }
    this.collision = next;
  }

  private visualBounds(element: Element): { left: number; right: number } {
    const rect = element.getBoundingClientRect();
    let left = rect.left;
    let right = rect.right;
    const visit = (node: Element) => {
      if (getComputedStyle(node).display === 'none') return;
      const box = node.getBoundingClientRect();
      if (box.width && getComputedStyle(node).visibility !== 'hidden') {
        left = Math.min(left, box.left);
        right = Math.max(right, box.right);
      }
      const children = node instanceof HTMLSlotElement ? node.assignedElements({ flatten: true }) : Array.from(node.shadowRoot?.children || node.children);
      for (const child of children) visit(child);
    };
    visit(element);
    return { left, right };
  }

  private visualWidth(element: Element): number {
    const bounds = this.visualBounds(element);
    return bounds.right - bounds.left;
  }

  private firstNavigationControl(): HTMLElement {
    const selector = 'a[href]:not([aria-disabled="true"]), button:not(:disabled), [tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])';
    const generated = this.el.shadowRoot!.querySelector('.desktop-nav')!.querySelector<HTMLElement>(selector);
    if (generated) return generated;
    for (const node of Array.from(this.el.querySelectorAll<HTMLElement>(':scope > [slot="nav"]'))) {
      const control = node.matches(selector) ? node : node.querySelector<HTMLElement>(selector);
      if (control) return control;
    }
    return this.el.shadowRoot!.querySelector<HTMLElement>('.brand-link')!;
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
      if (this.collision) this.el.shadowRoot?.querySelector<HTMLElement>('.menu-button')?.focus();
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
    this.hasMobileNav = !!this.el.querySelector(':scope > [slot="mobile-nav"]');
    this.hasMobileActions = !!this.el.querySelector(':scope > [slot="mobile-actions"]');
    this.hasMobileContent = this.hasMobileNav || this.hasMobileActions;
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
    this.setIconAttribute(el, 'library', item.iconLib || 'lucide');
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
    const value = this.value ?? this.activeValue;
    const active = item.active || (!!value && (item.value === value || item.href === value));
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
          library={item.iconLib || 'lucide'}
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
          'is-collapsed': this.collision,
          'has-mobile-nav': this.hasMobileNav,
          'has-mobile-actions': this.hasMobileActions,
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
