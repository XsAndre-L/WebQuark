import { h } from '@stencil/core';

import type { QIconDefinition, QIconNode } from '../icon.types';

function renderNode(node: QIconNode): any {
  const [tagName, attributes, children] = node;
  return h(tagName, attributes, children?.map(renderNode));
}

export function renderQIconDefinition(definition: QIconDefinition): any {
  const width = definition.width ?? definition.size ?? 24;
  const height = definition.height ?? definition.size ?? 24;
  const attributes = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: `0 0 ${width} ${height}`,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    ...definition.attributes,
    width: '100%',
    height: '100%',
    'aria-hidden': 'true',
    focusable: 'false',
  };

  return h('svg', attributes, definition.node.map(renderNode));
}
