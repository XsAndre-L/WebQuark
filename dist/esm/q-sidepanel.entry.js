import { h, r as registerInstance, c as createEvent } from './index-Dwk5pYo1.js';
import { g as getDeepActiveElement, w as waitForTransitionEnd, f as focusFirstElement, s as safeFocus, h as handleTabTrap } from './dom-CzMGs6SL.js';

function handleDrawerOpenChange(options) {
    const { isOpen, drawerEl, previousActiveElement, setVisible, setAnimatedOpen, setPreviousActiveElement } = options;
    let cancelled = false;
    let firstFrame;
    let secondFrame;
    let transitionCleanup;
    const cleanup = () => {
        cancelled = true;
        if (firstFrame !== undefined) {
            cancelAnimationFrame(firstFrame);
            firstFrame = undefined;
        }
        if (secondFrame !== undefined) {
            cancelAnimationFrame(secondFrame);
            secondFrame = undefined;
        }
        if (transitionCleanup) {
            transitionCleanup();
            transitionCleanup = undefined;
        }
    };
    if (isOpen) {
        setPreviousActiveElement(getDeepActiveElement());
        setVisible(true);
        firstFrame = requestAnimationFrame(() => {
            firstFrame = undefined;
            secondFrame = requestAnimationFrame(() => {
                secondFrame = undefined;
                if (cancelled)
                    return;
                setAnimatedOpen(true);
                if (drawerEl) {
                    transitionCleanup = waitForTransitionEnd(drawerEl, () => {
                        if (!cancelled) {
                            focusFirstElement(drawerEl);
                        }
                    });
                }
            });
        });
    }
    else {
        setAnimatedOpen(false);
        if (drawerEl) {
            transitionCleanup = waitForTransitionEnd(drawerEl, () => {
                if (cancelled)
                    return;
                setVisible(false);
                safeFocus(previousActiveElement);
                setPreviousActiveElement(null);
            });
        }
        else {
            setVisible(false);
            setPreviousActiveElement(null);
        }
    }
    return cleanup;
}

/** Recursively seeds the expanded set with all parent item values */
function seedExpandedGroups(items, set) {
    items.forEach((item) => {
        if (item.children && item.children.length > 0) {
            set.add(item.value);
            seedExpandedGroups(item.children, set);
        }
    });
}
/** In accordion mode: removes sibling group values from the expanded set */
function closeSiblings(targetValue, items, set) {
    const siblings = items.filter((i) => i.children && i.children.length > 0);
    const isAtThisLevel = siblings.some((s) => s.value === targetValue);
    if (isAtThisLevel) {
        siblings.forEach((s) => {
            if (s.value !== targetValue)
                set.delete(s.value);
        });
    }
    else {
        items.forEach((item) => {
            if (item.children)
                closeSiblings(targetValue, item.children, set);
        });
    }
}
/** Toggle a group open/closed, respecting accordion mode. Returns the new expanded set. */
function toggleGroup(items, currentExpanded, accordion, value) {
    const next = new Set(currentExpanded);
    if (next.has(value)) {
        next.delete(value);
    }
    else {
        if (accordion) {
            closeSiblings(value, items, next);
        }
        next.add(value);
    }
    return next;
}

function renderNavItems(options) {
    const { items, expandedGroups, activeValue, onItemClick, depth = 0 } = options;
    return items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedGroups.has(item.value);
        const isActive = !hasChildren && item.value === activeValue;
        const depthTone = depth % 2 === 0 ? 'primary' : 'secondary';
        return (h("div", { class: "nav-item-group", key: item.value }, h("div", { class: {
                'nav-item': true,
                'nav-item--active': isActive,
                'nav-item--parent': hasChildren,
            }, "data-depth": depth, "data-depth-tone": depthTone, style: { paddingLeft: `${16 + depth * 16}px` }, role: "button", tabindex: 0, title: item.label, "aria-expanded": hasChildren ? String(isExpanded) : undefined, "aria-current": isActive ? 'page' : undefined, onClick: () => onItemClick(item), onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onItemClick(item);
                }
            } }, item.icon && (h("q-icon", { class: "nav-item__icon", name: item.icon, lib: "lucide", size: "sm" })), h("span", { class: "nav-item__label" }, item.label), hasChildren && (h("q-icon", { class: { 'nav-item__chevron': true, 'nav-item__chevron--open': isExpanded }, name: "chevron-right", lib: "lucide", size: "sm" }))), hasChildren && isExpanded && (h("div", { class: "nav-children", role: "group" }, renderNavItems({ items: item.children, expandedGroups, activeValue, onItemClick, depth: depth + 1 })))));
    });
}

const sidepanelCss = () => `:host{display:block;box-sizing:border-box}.sidepanel-wrapper{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:var(--q-z-index-overlay, 1000);display:flex;pointer-events:none;overflow:hidden;box-sizing:border-box;visibility:hidden;}.sidepanel-wrapper.is-visible{visibility:visible}.sidepanel-wrapper.is-open{pointer-events:auto;}.sidepanel-backdrop{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0, 0, 0, 0.5);background:var(--q-bg-overlay, rgba(0, 0, 0, 0.5));opacity:0;transition:opacity var(--q-panel-transition-duration, var(--q-transition-normal, 250ms ease)) cubic-bezier(0.4, 0, 0.2, 1);box-sizing:border-box;user-select:none;-webkit-user-select:none}.sidepanel-wrapper.is-open .sidepanel-backdrop{opacity:1}.sidepanel-drawer{position:absolute;background:#1f2937;background:var(--q-sidepanel-bg, var(--q-panel-bg, var(--q-bg-surface-1, #1f2937)));box-shadow:0 16px 32px rgba(0, 0, 0, 0.12);box-shadow:var(--q-sidepanel-shadow, var(--q-panel-shadow, var(--q-shadow-high, 0 16px 32px rgba(0,0,0,0.12))));box-sizing:border-box;display:flex;flex-direction:column;outline:none;transition:transform var(--q-panel-transition-duration, var(--q-transition-normal, 250ms ease)) cubic-bezier(0.4, 0, 0.2, 1)}.side-left .sidepanel-drawer{top:0;left:0;width:var(--q-panel-width, 320px);height:100vh;border-right:1px solid #374151;border-right:var(--q-sidepanel-border, var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151))));transform:translateX(-100%)}.side-left.is-open .sidepanel-drawer{transform:translateX(0)}.side-right .sidepanel-drawer{top:0;right:0;width:var(--q-panel-width, 320px);height:100vh;border-left:1px solid #374151;border-left:var(--q-sidepanel-border, var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151))));transform:translateX(100%)}.side-right.is-open .sidepanel-drawer{transform:translateX(0)}.side-top .sidepanel-drawer{top:0;left:0;width:100vw;height:var(--q-panel-width, 320px);border-bottom:1px solid #374151;border-bottom:var(--q-sidepanel-border, var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151))));transform:translateY(-100%)}.side-top.is-open .sidepanel-drawer{transform:translateY(0)}.side-bottom .sidepanel-drawer{bottom:0;left:0;width:100vw;height:var(--q-panel-width, 320px);border-top:1px solid #374151;border-top:var(--q-sidepanel-border, var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151))));transform:translateY(100%)}.side-bottom.is-open .sidepanel-drawer{transform:translateY(0)}.drawer-header{padding:var(--q-padding-lg, 24px);border-bottom:1px solid #374151;border-bottom:var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));font-family:var(--q-font-family, inherit);font-size:var(--q-font-size-lg, 1.125rem);font-weight:var(--q-font-weight-bold, 700);line-height:1.4;color:#f9fafb;color:var(--q-fg-base, #f9fafb);user-select:none;-webkit-user-select:none}.drawer-body{flex:1;padding:var(--q-padding-lg, 24px);overflow-y:auto;font-family:var(--q-font-family, inherit);font-size:var(--q-font-size-base, 1rem);font-weight:var(--q-font-weight-normal, 400);line-height:1.5;color:#f9fafb;color:var(--q-fg-base, #f9fafb)}@media (max-width: 600px){.side-left .sidepanel-drawer,.side-right .sidepanel-drawer{top:auto;bottom:0;left:0;right:0;width:100vw;height:clamp(280px, var(--q-panel-width, 320px), 80vh);border-left:none;border-right:none;border-top:1px solid #374151;border-top:var(--q-panel-border, var(--q-border, 1px solid var(--q-border-color, #374151)));transform:translateY(100%)}.side-left.is-open .sidepanel-drawer,.side-right.is-open .sidepanel-drawer{transform:translateY(0)}}:host([variant="nav"]){display:flex;flex-direction:column;width:var(--q-sidepanel-expanded-width, 264px);height:100%;transition:width var(--q-transition-normal, 250ms ease)}:host([variant="nav"][collapsible][collapsed][collapse-mode="rail"]){width:var(--q-sidepanel-collapsed-width, 65px)}:host([variant="nav"][collapsible][collapsed][collapse-mode="hidden"]){width:var(--q-sidepanel-hidden-width, 0px)}.nav-sidebar{display:flex;flex-direction:column;width:100%;height:100%;background:#111827;background:var(--q-sidepanel-bg, var(--q-bg-surface-1, #111827));border-right:1px solid rgba(255,255,255,0.08);border-right:1px solid var(--q-border-color, rgba(255,255,255,0.08));box-sizing:border-box;font-family:var(--q-font-family, inherit);overflow:visible;user-select:none;-webkit-user-select:none;position:relative}.nav-header{flex-shrink:0;border-bottom:var(--q-sidepanel-nav-border, var(--q-border, 1px solid var(--q-border-color, rgba(255,255,255,0.08))));overflow:hidden;display:flex;align-items:center;justify-content:space-between}.nav-header>span,.nav-footer>span{display:flex;align-items:center;min-width:0;flex:1}.nav-sidebar:not(.is-collapsible) .nav-header:empty{display:none}.nav-body{flex:1;overflow-y:auto;overflow-x:hidden;border:0;padding:8px 0;scrollbar-width:thin;scrollbar-color:var(--q-border-color, #374151) transparent}.nav-body::-webkit-scrollbar{width:4px}.nav-body::-webkit-scrollbar-track{background:transparent}.nav-body::-webkit-scrollbar-thumb{background:var(--q-border-color, #374151);border-radius:2px}.nav-footer{flex-shrink:0;border-top:var(--q-sidepanel-nav-border, var(--q-border, 1px solid var(--q-border-color, rgba(255,255,255,0.08))));padding:8px 0;overflow:hidden;display:flex;align-items:center;justify-content:space-between}.nav-sidebar:not(.is-collapsible) .nav-footer:empty{display:none}.nav-item-group{display:flex;flex-direction:column}.nav-item{--q-sidepanel-nav-depth-color:var(--q-sidepanel-nav-depth-primary-color, var(--q-fg-base, #f9fafb));display:flex;align-items:center;gap:10px;padding-top:7px;padding-bottom:7px;padding-right:16px;cursor:pointer;border-radius:0;font-size:0.875rem;font-weight:400;line-height:1.4;color:#f9fafb;color:var(--q-sidepanel-nav-depth-color);transition:background 80ms ease-out, color 80ms ease-out;outline:none;position:relative}.nav-item[data-depth-tone='primary']{--q-sidepanel-nav-depth-color:var(--q-sidepanel-nav-depth-primary-color, var(--q-fg-base, #f9fafb))}.nav-item[data-depth-tone='secondary']{--q-sidepanel-nav-depth-color:var(--q-sidepanel-nav-depth-secondary-color, var(--q-fg-muted, #9ca3af))}.nav-item:hover,.nav-item:focus-visible{background:rgba(255, 255, 255, 0.05);background:var(--q-bg-surface-2, rgba(255, 255, 255, 0.05));color:var(--q-sidepanel-nav-depth-color)}.nav-item--active{background:rgba(99, 102, 241, 0.12);background:color-mix(in srgb, var(--q-color-primary, #6366f1) 12%, transparent);color:var(--q-sidepanel-nav-depth-color);font-weight:500}.nav-item--active::before{content:'';position:absolute;left:0;top:4px;bottom:4px;width:3px;background:#6366f1;background:var(--q-color-primary, #6366f1);border-radius:0 2px 2px 0}.nav-item--active:hover,.nav-item--active:focus-visible{background:rgba(99, 102, 241, 0.18);background:color-mix(in srgb, var(--q-color-primary, #6366f1) 18%, transparent);color:var(--q-sidepanel-nav-depth-color)}.nav-item--parent{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--q-sidepanel-nav-depth-color)}.nav-item--parent:hover,.nav-item--parent:focus-visible{color:var(--q-sidepanel-nav-depth-color)}.nav-item__icon{flex-shrink:0;opacity:var(--q-sidepanel-nav-icon-opacity, 1);transition:opacity 80ms ease-out}.nav-item:hover .nav-item__icon,.nav-item--active .nav-item__icon{opacity:1}.nav-item__label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nav-item__chevron{flex-shrink:0;margin-left:auto;opacity:0.5;transition:transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease}.nav-item__chevron--open{transform:rotate(90deg);opacity:0.8}.nav-children{display:flex;flex-direction:column}.nav-sidebar.is-collapsed.collapse-mode-rail .nav-item{padding-left:0 !important;padding-right:0 !important;justify-content:center}.nav-sidebar.is-collapsed.collapse-mode-rail .nav-item__label,.nav-sidebar.is-collapsed.collapse-mode-rail .nav-item__chevron{display:none}.nav-sidebar.is-collapsed.collapse-mode-rail .nav-header{flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;min-height:var(--q-sidepanel-collapsed-header-height, 112px)}.nav-sidebar.is-collapsed.collapse-mode-rail .nav-header>span{flex:0 0 auto;justify-content:center;width:100%}.nav-sidebar.is-collapsed.collapse-mode-hidden .nav-header,.nav-sidebar.is-collapsed.collapse-mode-hidden .nav-body,.nav-sidebar.is-collapsed.collapse-mode-hidden .nav-footer{visibility:hidden;pointer-events:none}.nav-sidebar.is-collapsed.collapse-mode-hidden .collapse-control{visibility:visible;pointer-events:auto}.collapse-control{display:inline-flex;align-items:center;justify-content:center;width:var(--q-sidepanel-collapse-control-size, 32px);height:var(--q-sidepanel-collapse-control-size, 32px);padding:0;border:none;border-radius:6px;background:transparent;color:var(--q-fg-muted, #9ca3af);cursor:pointer;transition:background 80ms ease-out, color 80ms ease-out}.collapse-control:hover,.collapse-control:focus-visible{background:var(--q-bg-surface-2, rgba(255, 255, 255, 0.05));color:var(--q-fg-base, #f9fafb);outline:none}.collapse-control--edge{position:absolute;top:24px;right:8px;z-index:2}.nav-sidebar.is-collapsed.collapse-mode-rail .collapse-control--edge{top:calc(var(--q-sidepanel-collapsed-header-height, 112px) - var(--q-sidepanel-collapse-control-size, 32px) - 8px);right:auto;left:50%;transform:translateX(-50%)}:host([side="right"]) .collapse-control--edge{right:auto;left:8px}:host([side="right"]) .nav-sidebar.is-collapsed.collapse-mode-rail .collapse-control--edge{right:auto;left:50%}`;

const QSidepanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.qClose = createEvent(this, "qClose");
        this.qSelect = createEvent(this, "qSelect");
        this.qCollapsedChange = createEvent(this, "qCollapsedChange");
    }
    // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========
    // ── Shared ────────────────────────────────────────────────────────────────
    /** 'drawer' = slide-in overlay, 'nav' = fixed navigation sidebar */
    variant = 'nav';
    // ── Drawer-mode props ─────────────────────────────────────────────────────
    /** Controls drawer visibility when variant="drawer". */
    open = false;
    /** Edge the drawer opens from. */
    side = 'right';
    /** Width or height depending on `side` (drawer mode only) */
    panelSize = '320px';
    // ── Nav-mode props ────────────────────────────────────────────────────────
    /** Navigation items rendered in nav mode. */
    items = [];
    /** Active leaf item value. */
    value = '';
    /** Item display mode: flat list, one-level groups, or deep tree */
    mode = 'flat';
    expanded = true;
    /** If true, opening one group collapses all sibling groups */
    accordion = false;
    /** Enables the collapse feature. Only takes effect when variant="nav". Reflected so host-level width CSS (e.g. the collapsed/rail width rule) can be gated on it, keeping it in sync with the inner is-collapsed/collapse-mode-* classes applied in render(). */
    collapsible = false;
    /** Current collapsed state. Reflected + mutable: the component's own built-in control can flip it directly (same pattern as q-toggle's `checked`), while consumers can also drive it externally via property binding. */
    collapsed = false;
    /** Where to render the built-in collapse toggle button. 'none' means the consumer supplies their own control and drives `collapsed` externally. */
    collapseControl = 'none';
    /** Visual behavior while collapsed: 'rail' shrinks to an icon-only rail, 'hidden' collapses to near-zero width. Reflected so light-DOM consumers can style slotted header/footer content differently per mode (e.g. q-sidepanel[collapsed][collapse-mode="rail"]). */
    collapseMode = 'rail';
    /** Accessible label for the built-in collapse control (aria-label/title). */
    collapseLabel = 'Toggle sidebar';
    // ── Events ────────────────────────────────────────────────────────────────
    /** Emitted when the drawer is requested to close. */
    qClose;
    /** Fires only for leaf items; clicking a parent group toggles it instead */
    qSelect;
    /** Fires whenever the BUILT-IN collapse control toggles collapsed. Does not fire when a consumer sets [collapsed] externally themselves. */
    qCollapsedChange;
    // ── Internal drawer state ─────────────────────────────────────────────────
    isVisible = false;
    isAnimatedOpen = false;
    // ── Internal nav state ────────────────────────────────────────────────────
    expandedGroups = new Set();
    drawerEl;
    // ========================= [2] INTERNAL STATE & REFS =========================
    previousActiveElement = null;
    drawerOpenCleanup;
    hasUserToggledGroups = false;
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
    disconnectedCallback() {
        this.clearDrawerOpenCleanup();
    }
    handleOpenChange(isOpen) {
        if (this.variant !== 'drawer')
            return;
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
    handleItemsChange() {
        if (this.expanded && !this.hasUserToggledGroups) {
            const newSet = new Set();
            seedExpandedGroups(this.items, newSet);
            this.expandedGroups = newSet;
            return;
        }
        const groupValues = this.getGroupValues(this.items);
        this.expandedGroups = new Set(Array.from(this.expandedGroups).filter(value => groupValues.has(value)));
    }
    // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================
    handleGlobalKeyDown(event) {
        if (this.variant === 'drawer' && this.open && event.key === 'Escape') {
            this.handleClose();
        }
    }
    handleClose = () => {
        this.open = false;
        this.qClose.emit();
    };
    handleKeyDown = (e) => {
        if (this.variant === 'drawer' && e.key === 'Tab' && this.open && this.drawerEl) {
            handleTabTrap(e, this.drawerEl);
        }
    };
    handleNavItemClick = (item) => {
        if (item.children && item.children.length > 0) {
            this.hasUserToggledGroups = true;
            this.expandedGroups = toggleGroup(this.items, this.expandedGroups, this.accordion, item.value);
        }
        else {
            this.qSelect.emit({ value: item.value, label: item.label, item });
        }
    };
    handleCollapseToggle = () => {
        const next = !this.collapsed;
        this.collapsed = next;
        this.qCollapsedChange.emit({ collapsed: next });
    };
    clearDrawerOpenCleanup() {
        if (this.drawerOpenCleanup) {
            this.drawerOpenCleanup();
            this.drawerOpenCleanup = undefined;
        }
    }
    getGroupValues(items) {
        const values = new Set();
        const visit = (item) => {
            if (item.children && item.children.length > 0) {
                values.add(item.value);
                item.children.forEach(visit);
            }
        };
        items.forEach(visit);
        return values;
    }
    // ===================== [6] RENDER (Visual Template Only) =====================
    getCollapseIconName() {
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
    renderCollapseControl(placement) {
        return (h("button", { type: "button", class: {
                'collapse-control': true,
                [`collapse-control--${placement}`]: true,
            }, part: "collapse-control", "aria-label": this.collapseLabel, title: this.collapseLabel, "aria-expanded": String(!this.collapsed), onClick: this.handleCollapseToggle }, h("q-icon", { name: this.getCollapseIconName(), lib: "lucide", size: "sm" })));
    }
    render() {
        if (this.variant === 'nav') {
            const isCollapseActive = this.collapsible;
            const isCollapsed = isCollapseActive && this.collapsed;
            const isHiddenCollapsed = isCollapsed && this.collapseMode === 'hidden';
            const navClasses = {
                'nav-sidebar': true,
                'is-collapsible': isCollapseActive,
                'is-collapsed': isCollapsed,
                [`collapse-mode-${this.collapseMode}`]: isCollapsed,
            };
            return (h("div", { class: navClasses, role: "navigation", "aria-label": "Sidebar navigation" }, h("div", { class: "nav-header", part: "header" }, h("span", { "aria-hidden": isHiddenCollapsed ? 'true' : undefined }, h("slot", { name: "header" })), isCollapseActive && this.collapseControl === 'header' && this.renderCollapseControl('header')), h("div", { class: "nav-body", part: "body", "aria-hidden": isHiddenCollapsed ? 'true' : undefined }, renderNavItems({
                items: this.items,
                expandedGroups: this.expandedGroups,
                activeValue: this.value,
                onItemClick: this.handleNavItemClick,
            })), h("div", { class: "nav-footer", part: "footer" }, h("span", { "aria-hidden": isHiddenCollapsed ? 'true' : undefined }, h("slot", { name: "footer" })), isCollapseActive && this.collapseControl === 'footer' && this.renderCollapseControl('footer')), isCollapseActive && this.collapseControl === 'edge' && this.renderCollapseControl('edge')));
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
        return (h("div", { class: classes, onKeyDown: this.handleKeyDown, inert: !this.open ? true : undefined }, h("div", { class: "sidepanel-backdrop", onClick: this.handleClose, part: "backdrop" }), h("div", { ref: (el) => (this.drawerEl = el), class: "sidepanel-drawer", style: customSizeStyle, part: "drawer", role: "dialog", "aria-modal": "true", "aria-hidden": this.open ? 'false' : 'true', tabindex: "-1" }, h("div", { class: "drawer-header", part: "header" }, h("slot", { name: "header" })), h("div", { class: "drawer-body", part: "body" }, h("slot", null)))));
    }
    static get watchers() { return {
        "open": [{
                "handleOpenChange": 0
            }],
        "items": [{
                "handleItemsChange": 0
            }]
    }; }
};
QSidepanel.style = sidepanelCss();

export { QSidepanel as q_sidepanel };
