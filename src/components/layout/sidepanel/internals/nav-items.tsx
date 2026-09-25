import { h } from '@stencil/core';
import { ChevronRight } from '@lucide/icons';
import { identifyItems } from '../../../../utils/collection-identity';
import type { RenderNavItemsOptions } from '../sidepanel.types';

export function renderNavItems(options: RenderNavItemsOptions): any[] {
  const { items, expandedGroups, activeValue, onItemClick, depth = 0 } = options;
  const identifiedItems = identifyItems(
    items,
    item => item.value,
    { warningContext: `q-sidepanel items at depth ${depth}` },
  );

  return identifiedItems.map(({ item, key }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isAlwaysExpanded = Boolean(hasChildren && item.alwaysExpanded === true);
    const isExpanded = isAlwaysExpanded || expandedGroups.has(item.value);
    const isActive = !hasChildren && item.value === activeValue;
    const depthTone = !hasChildren || depth === 0 ? 'primary' : 'secondary';
    const count = item.badgeCount ?? 0;
    const hasBadge = Number.isSafeInteger(count) && count > 0;
    const accessibleLabel = hasBadge ? `${item.label}, ${item.badgeLabel?.trim() || count}` : item.label;

    return (
      <div class="nav-item-group" key={key}>
        <div
          class={{
            'nav-item': true,
            'nav-item--active': isActive,
            'nav-item--parent': hasChildren,
            'nav-item--always-expanded': isAlwaysExpanded,
          }}
          data-depth={depth}
          data-depth-tone={depthTone}
          style={{ paddingLeft: `${16 + depth * 16}px` }}
          role={isAlwaysExpanded ? 'heading' : 'button'}
          tabindex={isAlwaysExpanded ? undefined : 0}
          title={accessibleLabel}
          aria-label={accessibleLabel}
          aria-level={isAlwaysExpanded ? String(Math.min(depth + 2, 6)) : undefined}
          aria-expanded={hasChildren && !isAlwaysExpanded ? String(isExpanded) : undefined}
          aria-current={isActive ? 'page' : undefined}
          onClick={isAlwaysExpanded ? undefined : () => onItemClick(item)}
          onKeyDown={isAlwaysExpanded
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onItemClick(item);
                }
              }}
        >
          {item.icon && (
            <q-icon class="nav-item__icon" name={item.icon} lib="lucide" size="sm" />
          )}
          <span class="nav-item__label">{item.label}</span>
          {hasBadge && (
            <span class="nav-item__badge" part="item-badge" aria-hidden="true">
              {count > 99 ? '99+' : count}
            </span>
          )}
          {hasChildren && !isAlwaysExpanded && (
            <q-icon
              class={{ 'nav-item__chevron': true, 'nav-item__chevron--open': isExpanded }}
              definition={ChevronRight}
              name="chevron-right"
              size="sm"
            />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div class="nav-children" role="group" aria-label={item.label}>
            {renderNavItems({ items: item.children!, expandedGroups, activeValue, onItemClick, depth: depth + 1 })}
          </div>
        )}
      </div>
    );
  });
}
