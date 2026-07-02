import { Component, Prop, Element, Event, EventEmitter, Watch, Listen, State, h } from '@stencil/core';
import { handleTabTrap, waitForTransitionEnd, focusFirstElement, safeFocus } from '../../utils/dom';
import type { QSidepanelMode, QSidepanelSelectDetail, QSidepanelSide, QSidepanelVariant, SidepanelItem } from './sidepanel.types';

@Component({
  tag: 'q-sidepanel',
  styleUrl: 'sidepanel.css',
  shadow: true,
})
export class QSidepanel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  @Element() el!: HTMLElement;

  // ── Shared ────────────────────────────────────────────────────────────────
  /** Selects behavior: 'drawer' = slide-in overlay, 'nav' = fixed navigation sidebar */
  @Prop({ reflect: true }) variant: QSidepanelVariant = 'nav';

  // ── Drawer-mode props ─────────────────────────────────────────────────────
  /** Controls drawer open/close state (drawer mode only) */
  @Prop({ reflect: true }) open: boolean = false;
  /** Screen edge the drawer slides from (drawer mode only) */
  @Prop({ reflect: true }) side: QSidepanelSide = 'right';
  /** Panel dimension – width or height depending on side (drawer mode only) */
  @Prop() panelSize: string = '320px';

  // ── Nav-mode props ────────────────────────────────────────────────────────
  /** Navigation item tree passed programmatically (nav mode only) */
  @Prop() items: SidepanelItem[] = [];
  /** Value of the currently active/selected item (nav mode only) */
  @Prop({ reflect: true }) value: string = '';
  /** Display mode for items: flat list, one-level groups, or deep tree */
  @Prop() mode: QSidepanelMode = 'flat';
  /** Whether all parent groups start expanded on first render (nav mode only) */
  @Prop() expanded: boolean = true;
  /** If true, opening one group collapses all sibling groups (nav mode only) */
  @Prop() accordion: boolean = false;

  // ── Events ────────────────────────────────────────────────────────────────
  /** Fires when the drawer is closed (drawer mode) */
  @Event() qClose!: EventEmitter<void>;
  /** Fires when a leaf navigation item is clicked (nav mode) */
  @Event() qSelect!: EventEmitter<QSidepanelSelectDetail>;

  // ── Internal drawer state ─────────────────────────────────────────────────
  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;

  // ── Internal nav state ────────────────────────────────────────────────────
  /** Tracks which group values are currently expanded */
  @State() expandedGroups: Set<string> = new Set();

  private drawerEl?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private previousActiveElement: HTMLElement | null = null;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  componentWillLoad() {
    // Drawer mode setup
    this.isVisible = this.open;
    this.isAnimatedOpen = this.open;

    // Nav mode: seed expandedGroups from expanded prop
    if (this.expanded) {
      this.seedExpandedGroups(this.items, this.expandedGroups);
    }
  }

  componentDidLoad() {
    if (this.variant === 'drawer' && this.open) {
      focusFirstElement(this.drawerEl);
    }
  }

  // ── Watches ───────────────────────────────────────────────────────────────

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (this.variant !== 'drawer') return;
    if (isOpen) {
      this.previousActiveElement = document.activeElement as HTMLElement;
      this.isVisible = true;
      setTimeout(() => {
        this.isAnimatedOpen = true;
        if (this.drawerEl) {
          waitForTransitionEnd(this.drawerEl, () => {
            focusFirstElement(this.drawerEl);
          });
        }
      }, 50);
    } else {
      this.isAnimatedOpen = false;
      if (this.drawerEl) {
        waitForTransitionEnd(this.drawerEl, () => {
          this.isVisible = false;
          safeFocus(this.previousActiveElement);
        });
      } else {
        this.isVisible = false;
      }
    }
  }

  @Watch('items')
  handleItemsChange() {
    if (this.expanded) {
      const newSet = new Set<string>();
      this.seedExpandedGroups(this.items, newSet);
      this.expandedGroups = newSet;
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  // ── Keyboard ──────────────────────────────────────────────────────────────

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.variant === 'drawer' && this.open && event.key === 'Escape') {
      this.handleClose();
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private handleClose = () => {
    this.qClose.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.variant === 'drawer' && e.key === 'Tab' && this.open && this.drawerEl) {
      handleTabTrap(e, this.drawerEl);
    }
  };

  /** Recursively seeds the expanded set with all parent item values */
  private seedExpandedGroups(items: SidepanelItem[], set: Set<string>) {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        set.add(item.value);
        this.seedExpandedGroups(item.children, set);
      }
    });
  }

  /** Toggle a group open/closed, respecting accordion mode */
  private toggleGroup(value: string) {
    const next = new Set(this.expandedGroups);
    if (next.has(value)) {
      next.delete(value);
    } else {
      if (this.accordion) {
        // Close all siblings at the same level — find which parent contains this value
        this.closeSiblings(value, this.items, next);
      }
      next.add(value);
    }
    this.expandedGroups = next;
  }

  /** In accordion mode: removes sibling group values from the expanded set */
  private closeSiblings(targetValue: string, items: SidepanelItem[], set: Set<string>) {
    const siblings = items.filter(i => i.children && i.children.length > 0);
    const isAtThisLevel = siblings.some(s => s.value === targetValue);
    if (isAtThisLevel) {
      siblings.forEach(s => {
        if (s.value !== targetValue) set.delete(s.value);
      });
    } else {
      items.forEach(item => {
        if (item.children) this.closeSiblings(targetValue, item.children, set);
      });
    }
  }

  private handleNavItemClick(item: SidepanelItem) {
    if (item.children && item.children.length > 0) {
      this.toggleGroup(item.value);
    } else {
      this.qSelect.emit({ value: item.value, label: item.label, item });
    }
  }

  // ── Nav render helpers ────────────────────────────────────────────────────

  private renderNavItems(items: SidepanelItem[], depth: number = 0): any[] {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = this.expandedGroups.has(item.value);
      const isActive = !hasChildren && item.value === this.value;

      return (
        <div class="nav-item-group" key={item.value}>
          <div
            class={{
              'nav-item': true,
              'nav-item--active': isActive,
              'nav-item--parent': hasChildren,
              'nav-item--expanded': hasChildren && isExpanded,
            }}
            style={{ paddingLeft: `${16 + depth * 16}px` }}
            role={hasChildren ? 'button' : 'menuitem'}
            tabindex={0}
            aria-expanded={hasChildren ? String(isExpanded) : undefined}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => this.handleNavItemClick(item)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleNavItemClick(item);
              }
            }}
          >
            {item.icon && (
              <q-icon class="nav-item__icon" name={item.icon} lib="lucide" size="sm" />
            )}
            <span class="nav-item__label">{item.label}</span>
            {hasChildren && (
              <q-icon
                class={{ 'nav-item__chevron': true, 'nav-item__chevron--open': isExpanded }}
                name="chevron-right"
                lib="lucide"
                size="sm"
              />
            )}
          </div>

          {hasChildren && isExpanded && (
            <div class="nav-children" role="group">
              {this.renderNavItems(item.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    if (this.variant === 'nav') {
      return (
        <div class="nav-sidebar" role="navigation" aria-label="Sidebar navigation">
          {/* Header slot */}
          <div class="nav-header" part="header">
            <slot name="header" />
          </div>

          {/* Navigation items */}
          <div class="nav-body" role="menu" part="body">
            {this.renderNavItems(this.items)}
          </div>

          {/* Footer slot */}
          <div class="nav-footer" part="footer">
            <slot name="footer" />
          </div>
        </div>
      );
    }

    // variant === 'drawer'
    const classes = {
      'sidepanel-wrapper': true,
      'is-open': this.isAnimatedOpen,
      'is-visible': this.isVisible,
      [`side-${this.side}`]: true,
    };

    const customSizeStyle = {
      '--q-panel-width': this.panelSize,
    };

    return (
      <div
        class={classes}
        onKeyDown={this.handleKeyDown}
        inert={!this.open ? true : undefined}
      >
        {/* Semi-transparent Backdrop Overlay */}
        <div
          class="sidepanel-backdrop"
          onClick={this.handleClose}
          part="backdrop"
        />

        {/* Sliding Panel Drawer */}
        <div
          ref={(el) => (this.drawerEl = el)}
          class="sidepanel-drawer"
          style={customSizeStyle}
          part="drawer"
          role="dialog"
          aria-modal="true"
          aria-hidden={this.open ? 'false' : 'true'}
          tabindex="-1"
        >
          {/* Header Slot (Optional title and close btn) */}
          <div class="drawer-header" part="header">
            <slot name="header" />
          </div>

          {/* Core Content Slot */}
          <div class="drawer-body" part="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }
}
