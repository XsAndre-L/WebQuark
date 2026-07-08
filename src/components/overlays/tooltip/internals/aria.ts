export function ensureTooltipDescribedBy(options: {
  host: HTMLElement;
  trigger: HTMLElement;
  fallbackId: string;
}): { tooltipId: string; added: boolean } {
  const tooltipId = options.host.id || options.fallbackId;
  if (!options.host.id) {
    options.host.id = tooltipId;
  }

  const describedBy = options.trigger.getAttribute('aria-describedby');
  const ids = describedBy ? describedBy.split(/\s+/).filter(Boolean) : [];
  if (ids.includes(tooltipId)) {
    return { tooltipId, added: false };
  }

  options.trigger.setAttribute('aria-describedby', [...ids, tooltipId].join(' '));
  return { tooltipId, added: true };
}

export function removeTooltipDescribedBy(options: {
  trigger: HTMLElement | null;
  tooltipId: string;
  added: boolean;
}): void {
  if (!options.trigger || !options.added || !options.tooltipId) return;

  const describedBy = options.trigger.getAttribute('aria-describedby');
  if (!describedBy) return;

  const ids = describedBy.split(/\s+/).filter(id => id && id !== options.tooltipId);
  if (ids.length) {
    options.trigger.setAttribute('aria-describedby', ids.join(' '));
  } else {
    options.trigger.removeAttribute('aria-describedby');
  }
}
