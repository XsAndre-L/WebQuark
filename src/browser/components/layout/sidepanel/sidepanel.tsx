import { Component, Prop, Event, EventEmitter, Watch, Listen, State, Element, h } from '@stencil/core';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelTopClose,
  PanelTopOpen,
} from '@lucide/icons';
import { focusFirstElement, getDeepActiveElement, handleTabTrap, safeFocus } from '../../../utils/dom';
import type { QIconDefinition } from '../../media/icon/icon.types';
import { handleDrawerOpenChange } from './internals/drawer';
import { seedExpandedGroups, toggleGroup } from './internals/groups';
import { renderNavItems } from './internals/nav-items';
import type {
  QSidepanelCollapseControl,
  QSidepanelCollapseControlAppearance,
  QSidepanelCollapseMode,
  QSidepanelCollapsedChangeDetail,
  QSidepanelMode,
  QSidepanelSelectDetail,
  QSidepanelSide,
  QSidepanelVariant,
  SidepanelItem,
  SidepanelItemInput,
} from './sidepanel.types';
import { getSidepanelItems } from './sidepanel.utils';

const DEFAULT_COLLAPSE_LABEL = 'Toggle sidebar';
const COLLAPSE_ICON_DEFINITIONS: Readonly<Record<string, QIconDefinition>> = {
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'panel-bottom-close': PanelBottomClose,
  'panel-bottom-open': PanelBottomOpen,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  'panel-right-close': PanelRightClose,
  'panel-right-open': PanelRightOpen,
  'panel-top-close': PanelTopClose,
  'panel-top-open': PanelTopOpen,
};

/**
 * Drawer, persistent panel, or hierarchical navigation side panel.
 * @slot - Main content used by drawer and panel variants.
 * @slot header - Header content for all variants.
 * @slot footer - Footer content for all variants.
 * @slot collapse-icon - Optional icon shown by the built-in control while the sidepanel is expanded.
 * @slot expand-icon - Optional icon shown by the built-in control while the sidepanel is collapsed.
 * @slot collapse-control-adornment - Optional notification badge or visible label positioned over the built-in control's top-left corner.
 * @part backdrop - Drawer backdrop click target.
 * @part drawer - Drawer dialog surface.
 * @part panel - Persistent panel surface.
 * @part surface - Stable inner content surface for persistent panels.
 * @part header - Header region.
 * @part body - Body or navigation region.
 * @part item-badge - Navigation item's optional count badge.
 * @part footer - Footer region.
 * @part collapse-control - Built-in collapse button.
 * @part collapse-control-adornment - Positioning wrapper for the built-in control's optional visual adornment.
 */
@Component({
  tag: 'q-sidepanel',
  styleUrl: 'sidepanel.css',
  shadow: true,
})
export class QSidepanel {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
  // ── Shared ────────────────────────────────────────────────────────────────
  /** Selects a drawer overlay, navigation sidebar, or persistent slotted panel. */
  @Prop({ reflect: true }) variant: QSidepanelVariant = 'nav';

  // ── Drawer-mode props ─────────────────────────────────────────────────────
  /** Controls drawer visibility when variant="drawer". */
  @Prop({ reflect: true, mutable: true }) open: boolean = false;
  @Prop({ reflect: true }) side: QSidepanelSide = 'right';
  /** Drawer width or height, depending on `side`. */
  @Prop() drawerSize?: string;
  /** @deprecated Use drawerSize. Used only when drawerSize is unset. */
  @Prop() panelSize: string = '320px';

  // ── Nav-mode props ────────────────────────────────────────────────────────
  /** Navigation items rendered in nav mode. */
  @Prop() items: SidepanelItemInput[] = [];
  /** Active leaf item value. */
  @Prop({ reflect: true }) value: string = '';
  /** Displays items as a flat list, one-level groups, or a deep tree. */
  @Prop() mode: QSidepanelMode = 'flat';
  /** Seeds navigation group expansion before user interaction. Defaults to true. */
  @Prop() defaultGroupsExpanded?: boolean;
  /** @deprecated Use defaultGroupsExpanded. Used only when defaultGroupsExpanded is unset. */
  @Prop() expanded: boolean = true;
  /** Opening one group collapses its siblings. */
  @Prop() accordion: boolean = false;

  /** Enables collapse behavior for nav and panel variants. */
  @Prop({ reflect: true }) collapsible: boolean = false;
  /** Updated by either the built-in control or external property binding. */
  @Prop({ reflect: true, mutable: true }) collapsed: boolean = false;
  /** `none` delegates the collapse control and `collapsed` state to the consumer. */
  @Prop() collapseControl: QSidepanelCollapseControl = 'none';
  /** `edge-tab` is intended for `collapse-control="edge"`. */
  @Prop({ reflect: true }) collapseControlStyle?: QSidepanelCollapseControlAppearance;
  /** @deprecated Use collapseControlStyle. Used only when collapseControlStyle is unset. */
  @Prop({ reflect: true }) collapseControlAppearance: QSidepanelCollapseControlAppearance = 'icon-button';
  /** Measured from the top on vertical sides and left on horizontal sides. */
  @Prop() collapseControlPosition: string = '';
  /** `rail` keeps an icon rail; `hidden` collapses to near-zero size. */
  @Prop({ reflect: true }) collapseMode: QSidepanelCollapseMode = 'rail';
  /** Accessible label for the built-in collapse control. */
  @Prop() collapseLabel: string = DEFAULT_COLLAPSE_LABEL;

  /** Accessible name for the rendered navigation, panel, or drawer region. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  // ── Events ────────────────────────────────────────────────────────────────
  /** Emitted when the drawer is requested to close. */
  @Event() qClose!: EventEmitter<void>;
  /** Emitted only for leaf items; parent activation toggles the group. */
  @Event() qSelect!: EventEmitter<QSidepanelSelectDetail>;
  /** Emitted only when the built-in control changes `collapsed`. */
  @Event() qCollapsedChange!: EventEmitter<QSidepanelCollapsedChangeDetail>;

  // ── Internal state ────────────────────────────────────────────────────────
  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;
  @State() hasHeaderContent: boolean = false;
  @State() hasFooterContent: boolean = false;

  // ── Internal nav state ────────────────────────────────────────────────────
  @State() expandedGroups: Set<string> = new Set();
  @State() normalizedItems: SidepanelItem[] = [];

  @Element() host!: HTMLElement;

  private drawerEl?: HTMLDivElement;
  private persistentShell?: HTMLDivElement;
  private persistentContent?: HTMLDivElement;
  private panelParentObserver?: ResizeObserver;

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
    this.normalizedItems = getSidepanelItems(this.items);
    if (this.defaultGroupsExpanded ?? this.expanded) {
      seedExpandedGroups(this.normalizedItems, this.expandedGroups);
    }
  }

  componentDidLoad() {
    this.updatePersistentSizing();
    if (this.variant === 'drawer' && this.open) {
      this.previousActiveElement = getDeepActiveElement() as HTMLElement | null;
      focusFirstElement(this.drawerEl);
    }
  }

  connectedCallback() {
    if (this.persistentShell) this.updatePersistentSizing();
  }

  componentDidUpdate() {
    this.updatePersistentSizing();
  }

  @Listen('resize', { target: 'window' })
  handleResize() {
    this.updatePersistentSizing();
  }

  @Watch('collapsed')
  handleCollapsedChange(collapsed: boolean) {
    if (!collapsed || !this.collapsible || this.variant === 'drawer' || this.collapseMode !== 'hidden') return;
    let active = getDeepActiveElement() as HTMLElement | null;
    while (active) {
      if (this.host.contains(active) || this.persistentContent?.contains(active)) {
        const control = this.persistentShell?.querySelector<HTMLButtonElement>('.collapse-control');
        // Externally controlled panels without a built-in control release focus.
        if (control) safeFocus(control);
        else active.blur();
        return;
      }
      active = (active.getRootNode() as ShadowRoot).host as HTMLElement | null;
    }
  }

  private updatePersistentSizing() {
    if (!this.persistentShell) return;
    const style = getComputedStyle(this.persistentShell);
    const hostStyle = getComputedStyle(this.host);
    const inset = ['borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight']
      .reduce((total, property) => total + (parseFloat(style[property]) || 0) + (parseFloat(hostStyle[property]) || 0), 0);
    this.persistentShell.style.setProperty('--q-sidepanel-content-inline-inset', `${inset}px`);
    const blockInset = ['borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom']
      .reduce((total, property) => total + (parseFloat(style[property]) || 0) + (parseFloat(hostStyle[property]) || 0), 0);
    const height = (hostStyle.getPropertyValue('--q-sidepanel-panel-content-height') || hostStyle.getPropertyValue('--q-sidepanel-panel-height')).trim();
    if (height) this.persistentShell.style.setProperty('--q-sidepanel-resolved-content-height', `calc(${height} - ${blockInset}px)`);
    else this.persistentShell.style.removeProperty('--q-sidepanel-resolved-content-height');
    const width = (this.variant === 'nav'
      ? hostStyle.getPropertyValue('--q-sidepanel-expanded-width')
      : hostStyle.getPropertyValue('--q-sidepanel-panel-width') || hostStyle.getPropertyValue('--q-panel-width')).trim();
    const parent = this.host.parentElement;
    if (this.collapsible && parent && /^\d+(\.\d+)?%$/.test(width)) {
      const parentStyle = getComputedStyle(parent);
      const parentWidth = parent.clientWidth - parseFloat(parentStyle.paddingLeft || '0') - parseFloat(parentStyle.paddingRight || '0');
      this.persistentShell.style.setProperty('--q-sidepanel-resolved-panel-width', `${parentWidth * parseFloat(width) / 100}px`);
      if (!this.panelParentObserver && typeof ResizeObserver !== 'undefined') {
        // Only percentage sizing needs observation of its containing layout.
        this.panelParentObserver = new ResizeObserver(() => this.updatePersistentSizing());
        this.panelParentObserver.observe(parent);
      }
    } else {
      this.persistentShell.style.removeProperty('--q-sidepanel-resolved-panel-width');
      this.panelParentObserver?.disconnect();
      this.panelParentObserver = undefined;
    }
  }

  disconnectedCallback() {
    this.clearDrawerOpenCleanup();
    this.panelParentObserver?.disconnect();
    this.panelParentObserver = undefined;
  }

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (this.variant !== 'drawer') return;
    this.clearDrawerOpenCleanup();
    if (!isOpen && !this.isAnimatedOpen) {
      this.isVisible = false;
      safeFocus(this.previousActiveElement);
      this.previousActiveElement = null;
      return;
    }
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
    this.normalizedItems = getSidepanelItems(this.items);

    if ((this.defaultGroupsExpanded ?? this.expanded) && !this.hasUserToggledGroups) {
      const newSet = new Set<string>();
      seedExpandedGroups(this.normalizedItems, newSet);
      this.expandedGroups = newSet;
      return;
    }

    const groupValues = this.getGroupValues(this.normalizedItems);
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
      if (item.alwaysExpanded === true) {
        return;
      }

      this.hasUserToggledGroups = true;
      this.expandedGroups = toggleGroup(this.normalizedItems, this.expandedGroups, this.accordion, item.value);
    } else {
      this.qSelect.emit({ value: item.value, label: item.label, item });
    }
  };

  private handleCollapseToggle = (event: MouseEvent) => {
    event.stopPropagation();
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

  private getIconButtonCollapseIconName(): string {
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

  private getEdgeTabCollapseIconName(): string {
    switch (this.side) {
      case 'right':
        return this.collapsed ? 'chevron-left' : 'chevron-right';
      case 'top':
        return this.collapsed ? 'chevron-down' : 'chevron-up';
      case 'bottom':
        return this.collapsed ? 'chevron-up' : 'chevron-down';
      case 'left':
      default:
        return this.collapsed ? 'chevron-right' : 'chevron-left';
    }
  }

  private getCollapseIconName(): string {
    return (this.collapseControlStyle ?? this.collapseControlAppearance) === 'edge-tab'
      ? this.getEdgeTabCollapseIconName()
      : this.getIconButtonCollapseIconName();
  }

  private getCollapseIconDefinition(): QIconDefinition {
    return COLLAPSE_ICON_DEFINITIONS[this.getCollapseIconName()];
  }

  private getCollapseControlLabel(): string {
    const label = this.collapseLabel.trim();

    if (label && label !== DEFAULT_COLLAPSE_LABEL) {
      return label;
    }

    const target = this.variant === 'panel' ? 'panel' : 'sidebar';
    return this.collapsed ? `Expand ${target}` : `Collapse ${target}`;
  }

  private renderCollapseControl(placement: QSidepanelCollapseControl) {
    const collapseControlLabel = this.getCollapseControlLabel();
    const iconSlotName = this.collapsed ? 'expand-icon' : 'collapse-icon';
    const isEdgeTab = placement === 'edge' && (this.collapseControlStyle ?? this.collapseControlAppearance) === 'edge-tab';
    const controlStyle = this.collapseControlPosition.trim()
      ? { '--q-sidepanel-collapse-control-position': this.collapseControlPosition.trim() }
      : undefined;

    return (
      <button
        type="button"
        class={{
          'collapse-control': true,
          [`collapse-control--${placement}`]: true,
          'collapse-control--edge-tab': isEdgeTab,
          'collapse-control--icon-button': !isEdgeTab,
        }}
        style={controlStyle}
        part="collapse-control"
        aria-label={collapseControlLabel}
        title={collapseControlLabel}
        aria-expanded={String(!this.collapsed)}
        onClick={this.handleCollapseToggle}
      >
        <slot name={iconSlotName}>
          <q-icon
            definition={this.getCollapseIconDefinition()}
            name={this.getCollapseIconName()}
            size="sm"
          />
        </slot>
        <span
          class="collapse-control__adornment"
          part="collapse-control-adornment"
          aria-hidden="true"
        >
          <slot name="collapse-control-adornment" />
        </span>
      </button>
    );
  }

  render() {
    const customSizeStyle = {
      '--q-panel-width': this.drawerSize ?? this.panelSize,
    };
    const ariaLabel = this.ariaLabel?.trim() || undefined;

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
        [`collapse-mode-${this.collapseMode}`]: true,
        'has-header-control': isCollapseActive && this.collapseControl === 'header',
        'has-footer-control': isCollapseActive && this.collapseControl === 'footer',
      };

      return (
        <div
          ref={el => { this.persistentShell = el; }}
          class={navClasses}
          role="navigation"
          aria-label={ariaLabel || 'Sidebar navigation'}
        >
          <div
            class={{
              'nav-header': true,
              'is-hidden': !showHeader,
            }}
            part="header"
          >
            <span
              aria-hidden={isHiddenCollapsed ? 'true' : undefined}
              inert={isHiddenCollapsed ? true : undefined}
            >
              <slot name="header" onSlotchange={this.handleHeaderSlotChange} />
            </span>
          </div>

          <div
            ref={el => { this.persistentContent = el; }}
            class="nav-body"
            part="body"
            aria-hidden={isHiddenCollapsed ? 'true' : undefined}
            inert={isHiddenCollapsed ? true : undefined}
          >
            <div class="nav-surface">
              {renderNavItems({
                items: this.normalizedItems,
                expandedGroups: this.expandedGroups,
                activeValue: this.value,
                onItemClick: this.handleNavItemClick,
              })}
            </div>
          </div>

          <div
            class={{
              'nav-footer': true,
              'is-hidden': !showFooter,
            }}
            part="footer"
          >
            <span
              aria-hidden={isHiddenCollapsed ? 'true' : undefined}
              inert={isHiddenCollapsed ? true : undefined}
            >
              <slot name="footer" onSlotchange={this.handleFooterSlotChange} />
            </span>
          </div>

          {isCollapseActive && this.collapseControl === 'header' && this.renderCollapseControl('header')}
          {isCollapseActive && this.collapseControl === 'footer' && this.renderCollapseControl('footer')}
          {isCollapseActive && this.collapseControl === 'edge' && this.renderCollapseControl('edge')}
        </div>
      );
    }

    if (this.variant === 'panel') {
      const isCollapseActive = this.collapsible;
      const isCollapsed = isCollapseActive && this.collapsed;
      const isHiddenCollapsed = isCollapsed && this.collapseMode === 'hidden';
      const showHeader = this.hasHeaderContent || (isCollapseActive && this.collapseControl === 'header');
      const showFooter = this.hasFooterContent || (isCollapseActive && this.collapseControl === 'footer');

      return (
        <div
          ref={el => { this.persistentShell = el; }}
          class={{
            'panel-shell': true,
            [`panel-side-${this.side}`]: true,
            'is-collapsible': isCollapseActive,
            'is-collapsed': isCollapsed,
            [`collapse-mode-${this.collapseMode}`]: isCollapsed,
            'has-header-control': isCollapseActive && this.collapseControl === 'header',
            'has-footer-control': isCollapseActive && this.collapseControl === 'footer',
          }}
          part="panel"
          role={ariaLabel ? 'region' : undefined}
          aria-label={ariaLabel}
        >
          <div
            ref={el => { this.persistentContent = el; }}
            class="panel-content"
            aria-hidden={isHiddenCollapsed ? 'true' : undefined}
            inert={isHiddenCollapsed ? true : undefined}
          >
            <div class="panel-surface" part="surface">
              <div
                class={{
                  'panel-header': true,
                  'is-hidden': !showHeader,
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
                  'is-hidden': !showFooter,
                }}
                part="footer"
              >
                <slot name="footer" onSlotchange={this.handleFooterSlotChange} />
              </div>
            </div>
          </div>

          {isCollapseActive && this.collapseControl === 'header' && this.renderCollapseControl('header')}
          {isCollapseActive && this.collapseControl === 'footer' && this.renderCollapseControl('footer')}
          {isCollapseActive && this.collapseControl === 'edge' && this.renderCollapseControl('edge')}
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
          aria-label={ariaLabel}
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
