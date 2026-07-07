import { h } from "@stencil/core";
export function renderNavItems(options) {
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
