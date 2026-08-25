import { h } from '@stencil/core';

import type { QToastVariant } from '../toast.types';

export const renderToastIcon = (variant: QToastVariant) => {
  const common = {
    slot: 'icon',
    class: 'toast-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  } as const;

  if (variant === 'success') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (variant === 'warning') {
    return (
      <svg {...common}>
        <path d="M10.3 4.1 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (variant === 'danger') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
};
