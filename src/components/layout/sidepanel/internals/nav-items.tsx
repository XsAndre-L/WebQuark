import { h } from '@stencil/core';
import type { RenderNavItemsOptions } from '../sidepanel.types';

export function renderNavItems(options: RenderNavItemsOptions): any[] {
  const { items, expandedGroups, activeValue, onItemClick, depth = 0 } = options;

  return items.map((item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.value);
    const isActive = !hasChildren && item.value === activeValue;

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
          title={item.label}
          aria-expanded={hasChildren ? String(isExpanded) : undefined}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => onItemClick(item)}
          onKeyDown={(e) => {
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
            {renderNavItems({ items: item.children!, expandedGroups, activeValue, onItemClick, depth: depth + 1 })}
          </div>
        )}
      </div>
    );
  });
}
