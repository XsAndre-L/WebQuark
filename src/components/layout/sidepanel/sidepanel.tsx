import { Component, Prop, Event, EventEmitter, Watch, Listen, State, Element, h } from '@stencil/core';
import { focusFirstElement, handleTabTrap } from '../../../utils/dom';
import { handleDrawerOpenChange } from './internals/drawer';
import { seedExpandedGroups, toggleGroup } from './internals/groups';
import { renderNavItems } from './internals/nav-items';
import type {
  QSidepanelCollapseControl,
  QSidepanelCollapseMode,
  QSidepanelCollapsedChangeDetail,
  QSidepanelMode,
  QSidepanelSelectDetail,
  QSidepanelSide,
  QSidepanelVariant,
  SidepanelItem,
} from './sidepanel.types';

const DEFAULT_COLLAPSE_LABEL = 'Toggle sidebar';

@Component({
  tag: 'q-sidepanel',
  styleUrl: 'sidepanel.css',
  shadow: true,
})
export class QSidepanel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  // ── Shared ────────────────────────────────────────────────────────────────
  /** 'drawer' = slide-in overlay, 'nav' = fixed navigation sidebar, 'panel' = persistent slotted side panel */
  @Prop({ reflect: true }) variant: QSidepanelVariant = 'nav';

  // ── Drawer-mode props ─────────────────────────────────────────────────────
  /** Controls drawer visibility when variant="drawer". */
  @Prop({ reflect: true, mutable: true }) open: boolean = false;
  /** Edge the drawer opens from. */
  @Prop({ reflect: true }) side: QSidepanelSide = 'right';
  /** Width or height depending on `side` (drawer mode only) */
  @Prop() panelSize: string = '320px';

  // ── Nav-mode props ────────────────────────────────────────────────────────
  /** Navigation items rendered in nav mode. */
  @Prop() items: SidepanelItem[] = [];
  /** Active leaf item value. */
  @Prop({ reflect: true }) value: string = '';
  /** Item display mode: flat list, one-level groups, or deep tree */
  @Prop() mode: QSidepanelMode = 'flat';
  @Prop() expanded: boolean = true;
  /** If true, opening one group collapses all sibling groups */
  @Prop() accordion: boolean = false;
  /** Enables the collapse feature. Only takes effect when variant="nav". Reflected so host-level width CSS (e.g. the collapsed/rail width rule) can be gated on it, keeping it in sync with the inner is-collapsed/collapse-mode-* classes applied in render(). */
  @Prop({ reflect: true }) collapsible: boolean = false;
  /** Current collapsed state. Reflected + mutable: the component's own built-in control can flip it directly (same pattern as q-toggle's `checked`), while consumers can also drive it externally via property binding. */
  @Prop({ reflect: true, mutable: true }) collapsed: boolean = false;
  /** Where to render the built-in collapse toggle button. 'none' means the consumer supplies their own control and drives `collapsed` externally. */
  @Prop() collapseControl: QSidepanelCollapseControl = 'none';
  /** Visual behavior while collapsed: 'rail' shrinks to an icon-only rail, 'hidden' collapses to near-zero width. Reflected so light-DOM consumers can style slotted header/footer content differently per mode (e.g. q-sidepanel[collapsed][collapse-mode="rail"]). */
  @Prop({ reflect: true }) collapseMode: QSidepanelCollapseMode = 'rail';
  /** Accessible label override for the built-in collapse control (aria-label/title). */
  @Prop() collapseLabel: string = DEFAULT_COLLAPSE_LABEL;

  // ── Events ────────────────────────────────────────────────────────────────
  /** Emitted when the drawer is requested to close. */
  @Event() qClose!: EventEmitter<void>;
  /** Fires only for leaf items; clicking a parent group toggles it instead */
  @Event() qSelect!: EventEmitter<QSidepanelSelectDetail>;
  /** Fires whenever the BUILT-IN collapse control toggles collapsed. Does not fire when a consumer sets [collapsed] externally themselves. */
  @Event() qCollapsedChange!: EventEmitter<QSidepanelCollapsedChangeDetail>;

  // ── Internal state ────────────────────────────────────────────────────────
  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;
  @State() hasHeaderContent: boolean = false;
  @State() hasFooterContent: boolean = false;

  // ── Internal nav state ────────────────────────────────────────────────────
  @State() expandedGroups: Set<string> = new Set();

  @Element() host!: HTMLElement;

  private drawerEl?: HTMLDivElement;

  // ========================= [2] INTERNAL STATE & REFS =========================

  private previousActiveElement: HTMLElement | null = null;
  private drawerOpenCleanup?: () => void;
  private hasUserToggledGroups = false;

  // ========================= [3] LIFECYCLE & WATCHERS ==========================

  componentWillLoad() {
    // Drawer mode
    this.isVisible = this.open;
    this.isAnimatedOpen = this.open;
    this.hasHeaderContent = this.hasSlotContent('header');
    this.hasFooterContent = this.hasSlotContent('footer');

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

  disconnectedCallback() {
    this.clearDrawerOpenCleanup();
  }

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (this.variant !== 'drawer') return;
    this.clearDrawerOpenCleanup();
    this.drawerOpenCleanup = handleDrawerOpenChange({
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
    if (this.expanded && !this.hasUserToggledGroups) {
      const newSet = new Set<string>();
      seedExpandedGroups(this.items, newSet);
      this.expandedGroups = newSet;
      return;
    }

    const groupValues = this.getGroupValues(this.items);
    this.expandedGroups = new Set(Array.from(this.expandedGroups).filter(value => groupValues.has(value)));
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

  private handleNavItemClick = (item: SidepanelItem) => {
    if (item.children && item.children.length > 0) {
      this.hasUserToggledGroups = true;
      this.expandedGroups = toggleGroup(this.items, this.expandedGroups, this.accordion, item.value);
    } else {
      this.qSelect.emit({ value: item.value, label: item.label, item });
    }
  };

  private handleCollapseToggle = () => {
    const next = !this.collapsed;
    this.collapsed = next;
    this.qCollapsedChange.emit({ collapsed: next });
  };

  private handleHeaderSlotChange = (event: Event) => {
    this.hasHeaderContent = this.slotHasAssignedContent(event.target as HTMLSlotElement);
  };

  private handleFooterSlotChange = (event: Event) => {
    this.hasFooterContent = this.slotHasAssignedContent(event.target as HTMLSlotElement);
  };

  private clearDrawerOpenCleanup() {
    if (this.drawerOpenCleanup) {
      this.drawerOpenCleanup();
      this.drawerOpenCleanup = undefined;
    }
  }

  private getGroupValues(items: SidepanelItem[]): Set<string> {
    const values = new Set<string>();

    const visit = (item: SidepanelItem) => {
      if (item.children && item.children.length > 0) {
        values.add(item.value);
        item.children.forEach(visit);
      }
    };

    items.forEach(visit);
    return values;
  }

  private hasSlotContent(name: string): boolean {
    return Array.from(this.host.childNodes).some((node) => {
      if (node.nodeType !== 1 || (node as HTMLElement).slot !== name) {
        return false;
      }

      return true;
    });
  }

  private slotHasAssignedContent(slot: HTMLSlotElement): boolean {
    return slot.assignedNodes({ flatten: true }).some((node) => {
      if (node.nodeType === 1) {
        return true;
      }

      return node.nodeType === 3 && Boolean(node.textContent?.trim());
    });
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  private getCollapseIconName(): string {
    switch (this.side) {
      case 'right':
        return this.collapsed ? 'panel-right-open' : 'panel-right-close';
      case 'top':
        return this.collapsed ? 'panel-top-open' : 'panel-top-close';
      case 'bottom':
        return this.collapsed ? 'panel-bottom-open' : 'panel-bottom-close';
      case 'left':
      default:
        return this.collapsed ? 'panel-left-open' : 'panel-left-close';
    }
  }

  private getCollapseControlLabel(): string {
    const label = this.collapseLabel.trim();

    if (label && label !== DEFAULT_COLLAPSE_LABEL) {
      return label;
    }

    return this.collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }

  private renderCollapseControl(placement: QSidepanelCollapseControl) {
    const collapseControlLabel = this.getCollapseControlLabel();

    return (
      <button
        type="button"
        class={{
          'collapse-control': true,
          [`collapse-control--${placement}`]: true,
        }}
        part="collapse-control"
        aria-label={collapseControlLabel}
        title={collapseControlLabel}
        aria-expanded={String(!this.collapsed)}
        onClick={this.handleCollapseToggle}
      >
        <q-icon name={this.getCollapseIconName()} lib="lucide" size="sm" />
      </button>
    );
  }

  render() {
    const customSizeStyle = {
      '--q-panel-width': this.panelSize,
    };

    if (this.variant === 'nav') {
      const isCollapseActive = this.collapsible;
      const isCollapsed = isCollapseActive && this.collapsed;
      const isHiddenCollapsed = isCollapsed && this.collapseMode === 'hidden';
      const showHeader = this.hasHeaderContent || (isCollapseActive && this.collapseControl === 'header');
      const showFooter = this.hasFooterContent || (isCollapseActive && this.collapseControl === 'footer');

      const navClasses = {
        'nav-sidebar': true,
        'is-collapsible': isCollapseActive,
        'is-collapsed': isCollapsed,
        [`collapse-mode-${this.collapseMode}`]: isCollapsed,
      };

      return (
        <div class={navClasses} role="navigation" aria-label="Sidebar navigation">
          <div
            class={{
              'nav-header': true,
              'is-hidden': !showHeader,
            }}
            part="header"
          >
            {/* aria-hidden lives on this inner wrapper (not nav-header itself) so the
                built-in collapse-control button below -- which stays visually/keyboard
                reachable in collapse-mode="hidden" via the CSS override -- is never pulled
                out of the accessibility tree by an aria-hidden ancestor. */}
            <span aria-hidden={isHiddenCollapsed ? 'true' : undefined}>
              <slot name="header" onSlotchange={this.handleHeaderSlotChange} />
            </span>
            {isCollapseActive && this.collapseControl === 'header' && this.renderCollapseControl('header')}
          </div>

          <div class="nav-body" part="body" aria-hidden={isHiddenCollapsed ? 'true' : undefined}>
            {renderNavItems({
              items: this.items,
              expandedGroups: this.expandedGroups,
              activeValue: this.value,
              onItemClick: this.handleNavItemClick,
            })}
          </div>

          <div
            class={{
              'nav-footer': true,
              'is-hidden': !showFooter,
            }}
            part="footer"
          >
            <span aria-hidden={isHiddenCollapsed ? 'true' : undefined}>
              <slot name="footer" onSlotchange={this.handleFooterSlotChange} />
            </span>
            {isCollapseActive && this.collapseControl === 'footer' && this.renderCollapseControl('footer')}
          </div>

          {isCollapseActive && this.collapseControl === 'edge' && this.renderCollapseControl('edge')}
        </div>
      );
    }

    if (this.variant === 'panel') {
      return (
        <div
          class={{
            'panel-shell': true,
            [`panel-side-${this.side}`]: true,
          }}
          part="panel"
        >
          <div
            class={{
              'panel-header': true,
              'is-hidden': !this.hasHeaderContent,
            }}
            part="header"
          >
            <slot name="header" onSlotchange={this.handleHeaderSlotChange} />
          </div>

          <div class="panel-body" part="body">
            <slot />
          </div>

          <div
            class={{
              'panel-footer': true,
              'is-hidden': !this.hasFooterContent,
            }}
            part="footer"
          >
            <slot name="footer" onSlotchange={this.handleFooterSlotChange} />
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
          <div
            class={{
              'drawer-header': true,
              'is-hidden': !this.hasHeaderContent,
            }}
            part="header"
          >
            <slot name="header" onSlotchange={this.handleHeaderSlotChange} />
          </div>

          <div class="drawer-body" part="body">
            <slot />
          </div>

          <div
            class={{
              'drawer-footer': true,
              'is-hidden': !this.hasFooterContent,
            }}
            part="footer"
          >
            <slot name="footer" onSlotchange={this.handleFooterSlotChange} />
          </div>
        </div>
      </div>
    );
  }
}
