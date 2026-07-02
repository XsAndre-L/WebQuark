import { Component, Prop, Element, Event, EventEmitter, Watch, Listen, State, h } from '@stencil/core';
import { focusFirstElement, handleTabTrap } from '../../../utils/dom';
import { handleDrawerOpenChange } from './internals/drawer';
import { seedExpandedGroups, toggleGroup } from './internals/groups';
import { renderNavItems } from './internals/nav-items';
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
  /** 'drawer' = slide-in overlay, 'nav' = fixed navigation sidebar */
  @Prop({ reflect: true }) variant: QSidepanelVariant = 'nav';

  // ── Drawer-mode props ─────────────────────────────────────────────────────
  @Prop({ reflect: true }) open: boolean = false;
  @Prop({ reflect: true }) side: QSidepanelSide = 'right';
  /** Width or height depending on `side` (drawer mode only) */
  @Prop() panelSize: string = '320px';

  // ── Nav-mode props ────────────────────────────────────────────────────────
  @Prop() items: SidepanelItem[] = [];
  @Prop({ reflect: true }) value: string = '';
  /** Item display mode: flat list, one-level groups, or deep tree */
  @Prop() mode: QSidepanelMode = 'flat';
  @Prop() expanded: boolean = true;
  /** If true, opening one group collapses all sibling groups */
  @Prop() accordion: boolean = false;

  // ── Events ────────────────────────────────────────────────────────────────
  @Event() qClose!: EventEmitter<void>;
  /** Fires only for leaf items; clicking a parent group toggles it instead */
  @Event() qSelect!: EventEmitter<QSidepanelSelectDetail>;

  // ── Internal drawer state ─────────────────────────────────────────────────
  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;

  // ── Internal nav state ────────────────────────────────────────────────────
  @State() expandedGroups: Set<string> = new Set();

  private drawerEl?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private previousActiveElement: HTMLElement | null = null;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad() {
    // Drawer mode
    this.isVisible = this.open;
    this.isAnimatedOpen = this.open;

    // Nav mode
    if (this.expanded) {
      seedExpandedGroups(this.items, this.expandedGroups);
    }
  }

  componentDidLoad() {
    if (this.variant === 'drawer' && this.open) {
      focusFirstElement(this.drawerEl);
    }
  }

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (this.variant !== 'drawer') return;
    handleDrawerOpenChange({
      isOpen,
      drawerEl: this.drawerEl,
      previousActiveElement: this.previousActiveElement,
      setVisible: (visible) => { this.isVisible = visible; },
      setAnimatedOpen: (animatedOpen) => { this.isAnimatedOpen = animatedOpen; },
      setPreviousActiveElement: (el) => { this.previousActiveElement = el; },
    });
  }

  @Watch('items')
  handleItemsChange() {
    if (this.expanded) {
      const newSet = new Set<string>();
      seedExpandedGroups(this.items, newSet);
      this.expandedGroups = newSet;
    }
  }

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.variant === 'drawer' && this.open && event.key === 'Escape') {
      this.handleClose();
    }
  }

  private handleClose = () => {
    this.open = false;
    this.qClose.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.variant === 'drawer' && e.key === 'Tab' && this.open && this.drawerEl) {
      handleTabTrap(e, this.drawerEl);
    }
  };

  private handleNavItemClick(item: SidepanelItem) {
    if (item.children && item.children.length > 0) {
      this.expandedGroups = toggleGroup(this.items, this.expandedGroups, this.accordion, item.value);
    } else {
      this.qSelect.emit({ value: item.value, label: item.label, item });
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    if (this.variant === 'nav') {
      return (
        <div class="nav-sidebar" role="navigation" aria-label="Sidebar navigation">
          <div class="nav-header" part="header">
            <slot name="header" />
          </div>

          <div class="nav-body" role="menu" part="body">
            {renderNavItems({
              items: this.items,
              expandedGroups: this.expandedGroups,
              activeValue: this.value,
              onItemClick: (item) => this.handleNavItemClick(item),
            })}
          </div>

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
        <div
          class="sidepanel-backdrop"
          onClick={this.handleClose}
          part="backdrop"
        />

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
          <div class="drawer-header" part="header">
            <slot name="header" />
          </div>

          <div class="drawer-body" part="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }
}
