import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { safeParseJson } from '../../utils/utils';
import type { NavbarItem, NavbarSelectDetail } from './navbar.types';

@Component({
  tag: 'q-navbar',
  styleUrl: 'navbar.css',
  shadow: true,
})
export class QNavbar {
  @Prop() brand?: string;
  @Prop() logoSrc?: string;
  @Prop() logoAlt: string = '';
  @Prop() brandHref: string = '/';
  @Prop() items: NavbarItem[] | string = [];
  @Prop() activeValue: string = '';
  @Prop() mobileLabel: string = 'Menu';
  @Prop({ reflect: true }) sticky: boolean = false;
  @Prop({ reflect: true }) compact: boolean = false;
  @Prop({ reflect: true }) transparent: boolean = false;
  @Prop({ reflect: true }) bordered: boolean = true;

  @State() menuOpen: boolean = false;

  @Event() qSelect!: EventEmitter<NavbarSelectDetail>;
  @Event() qMenuToggle!: EventEmitter<boolean>;

  private get parsedItems(): NavbarItem[] {
    return safeParseJson<NavbarItem[]>(this.items, [], 'QNavbar');
  }

  private toggleMenu = () => {
    this.menuOpen = !this.menuOpen;
    this.qMenuToggle.emit(this.menuOpen);
  };

  private closeMenu = () => {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.qMenuToggle.emit(false);
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
    this.closeMenu();
  };

  private renderBrand() {
    const content = (
      <span class="brand-content">
        {this.logoSrc && <img class="brand-logo" src={this.logoSrc} alt={this.logoAlt} />}
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
    const classes = {
      'nav-item': true,
      'is-active': active,
      'is-disabled': !!item.disabled,
    };

    if (item.href) {
      return (
        <a
          class={classes}
          href={item.disabled ? undefined : item.href}
          target={item.disabled ? undefined : item.target}
          rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
          aria-current={active ? 'page' : undefined}
          aria-disabled={item.disabled ? 'true' : 'false'}
          onClick={(ev) => this.handleItemClick(item, ev)}
        >
          {item.label}
        </a>
      );
    }

    return (
      <button
        class={classes}
        type="button"
        disabled={item.disabled}
        aria-current={active ? 'page' : undefined}
        onClick={(ev) => this.handleItemClick(item, ev)}
      >
        {item.label}
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
            onClick={this.toggleMenu}
            part="menu-button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div class="mobile-panel" part="mobile-panel">
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
