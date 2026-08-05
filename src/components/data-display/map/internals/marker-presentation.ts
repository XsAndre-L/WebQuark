import { Q_MAP_MARKER_VARIANTS } from '../map.types';
import type {
  QMapMarker,
  QMapMarkerCallout,
  QMapMarkerCalloutStat,
} from '../map.types';

type QIconElement = HTMLElement & { name?: string; size?: string | number };

const KIND_CLASSES = ['kind-dot', 'kind-avatar', 'kind-icon'];
const RING_CLASSES = ['ring-none', 'ring-solid', 'ring-dashed'];

function createIcon(document: Document, className: string): QIconElement {
  const icon = document.createElement('q-icon') as QIconElement;
  icon.className = className;
  icon.setAttribute('size', '100%');
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function updateIcon(icon: QIconElement, name: string | undefined): void {
  icon.hidden = !name;
  if (name) icon.setAttribute('name', name);
  else icon.removeAttribute('name');
}

export function createMarkerContent(document: Document): HTMLElement {
  const surface = document.createElement('span');
  surface.className = 'q-map-marker';
  surface.setAttribute('part', 'marker');

  const content = document.createElement('span');
  content.className = 'q-map-marker__content';
  content.setAttribute('aria-hidden', 'true');

  const center = document.createElement('span');
  center.className = 'q-map-marker__center';

  const fallback = document.createElement('span');
  fallback.className = 'q-map-marker__fallback';
  fallback.hidden = true;

  const image = document.createElement('img');
  image.className = 'q-map-marker__image';
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;
  image.hidden = true;
  image.setAttribute('aria-hidden', 'true');
  image.addEventListener('load', () => {
    if (image.dataset.source !== image.getAttribute('src')) return;
    image.hidden = false;
    center.classList.add('has-image');
  });
  image.addEventListener('error', () => {
    if (image.dataset.source !== image.getAttribute('src')) return;
    image.hidden = true;
    center.classList.remove('has-image');
  });

  const icon = createIcon(document, 'q-map-marker__icon');
  icon.hidden = true;

  const badge = document.createElement('span');
  badge.className = 'q-map-marker__badge';
  badge.setAttribute('part', 'marker-badge');
  badge.hidden = true;
  const badgeIcon = createIcon(document, 'q-map-marker__badge-icon');
  badgeIcon.hidden = true;
  const badgeText = document.createElement('span');
  badgeText.className = 'q-map-marker__badge-text';
  badgeText.hidden = true;

  center.append(fallback, image, icon);
  badge.append(badgeIcon, badgeText);
  content.append(center, badge);
  surface.append(content);
  return surface;
}

function updateImage(center: HTMLElement, image: HTMLImageElement, imageUrl: string | undefined): void {
  if (!imageUrl) {
    image.hidden = true;
    image.removeAttribute('src');
    delete image.dataset.source;
    center.classList.remove('has-image');
    return;
  }
  if (image.dataset.source === imageUrl) return;
  image.hidden = true;
  center.classList.remove('has-image');
  image.dataset.source = imageUrl;
  image.src = imageUrl;
}

export function getMarkerAccessibleLabel(marker: QMapMarker): string {
  return marker.badge ? `${marker.label}. ${marker.badge.ariaLabel}` : marker.label;
}

export function updateMarkerPresentation(element: HTMLElement, marker: QMapMarker, selected: boolean): void {
  for (const variant of Q_MAP_MARKER_VARIANTS) element.classList.remove(`variant-${variant}`);
  element.classList.remove(...KIND_CLASSES, ...RING_CLASSES);
  element.classList.add(`variant-${marker.variant ?? 'default'}`, `ring-${marker.ring ?? 'none'}`);

  const kind = marker.kind === 'icon' && !marker.icon ? 'dot' : marker.kind;
  if (kind) element.classList.add(`kind-${kind}`);
  element.classList.toggle('is-pulsing', marker.pulse === true);
  element.classList.toggle('is-selected', selected);

  const center = element.querySelector<HTMLElement>('.q-map-marker__center');
  const fallback = center?.querySelector<HTMLElement>('.q-map-marker__fallback');
  const image = center?.querySelector<HTMLImageElement>('.q-map-marker__image');
  const icon = center?.querySelector<QIconElement>('.q-map-marker__icon');
  if (!center || !fallback || !image || !icon) return;

  const avatarContent = kind === 'avatar' || kind === undefined;
  const fallbackText = avatarContent ? marker.fallbackText ?? '' : '';
  const imageUrl = avatarContent ? marker.imageUrl : undefined;
  const iconName = kind === 'icon' ? marker.icon : undefined;
  fallback.textContent = fallbackText;
  fallback.hidden = !fallbackText;
  updateImage(center, image, imageUrl);
  updateIcon(icon, iconName);
  element.classList.toggle('has-content', Boolean(fallbackText || imageUrl || iconName));

  const badge = element.querySelector<HTMLElement>('.q-map-marker__badge');
  const badgeIcon = badge?.querySelector<QIconElement>('.q-map-marker__badge-icon');
  const badgeText = badge?.querySelector<HTMLElement>('.q-map-marker__badge-text');
  if (!badge || !badgeIcon || !badgeText) return;
  for (const variant of Q_MAP_MARKER_VARIANTS) badge.classList.remove(`variant-${variant}`);
  badge.hidden = !marker.badge;
  badge.classList.add(`variant-${marker.badge?.variant ?? 'default'}`);
  updateIcon(badgeIcon, marker.badge?.icon);
  badgeText.textContent = marker.badge?.text ?? '';
  badgeText.hidden = !marker.badge?.text;
}

export function createClusterContent(document: Document): HTMLElement {
  const surface = document.createElement('span');
  surface.className = 'q-map-cluster';
  surface.setAttribute('part', 'cluster');

  const content = document.createElement('span');
  content.className = 'q-map-cluster__content';
  content.setAttribute('aria-hidden', 'true');
  const count = document.createElement('span');
  count.className = 'q-map-cluster__count';
  content.append(count);
  surface.append(content);
  return surface;
}

export function updateClusterPresentation(element: HTMLElement, count: number, containsSelection: boolean): void {
  const countElement = element.querySelector<HTMLElement>('.q-map-cluster__count');
  if (countElement) countElement.textContent = count > 999 ? `${Math.floor(count / 100) / 10}k` : String(count);
  element.classList.toggle('contains-selection', containsSelection);
}

export function createCalloutContent(document: Document): HTMLElement {
  const content = document.createElement('div');
  content.className = 'q-map-callout__content';
  content.setAttribute('aria-hidden', 'true');

  const heading = document.createElement('span');
  heading.className = 'q-map-callout__heading';

  const title = document.createElement('span');
  title.className = 'q-map-callout__title';

  const status = document.createElement('span');
  status.className = 'q-map-callout__status';
  status.hidden = true;

  const subtitle = document.createElement('span');
  subtitle.className = 'q-map-callout__subtitle';
  subtitle.hidden = true;

  const meta = document.createElement('span');
  meta.className = 'q-map-callout__meta';
  meta.hidden = true;

  const stats = document.createElement('dl');
  stats.className = 'q-map-callout__stats';
  stats.hidden = true;

  heading.append(title, status);
  content.append(heading, subtitle, meta, stats);
  return content;
}

export function updateCalloutContent(element: HTMLElement, callout: QMapMarkerCallout): void {
  const title = element.querySelector<HTMLElement>('.q-map-callout__title');
  const subtitle = element.querySelector<HTMLElement>('.q-map-callout__subtitle');
  const status = element.querySelector<HTMLElement>('.q-map-callout__status');
  const meta = element.querySelector<HTMLElement>('.q-map-callout__meta');
  const stats = element.querySelector<HTMLDListElement>('.q-map-callout__stats');
  if (!title || !subtitle || !status || !meta || !stats) return;
  for (const variant of Q_MAP_MARKER_VARIANTS) element.classList.remove(`variant-${variant}`);
  element.classList.add(`variant-${callout.variant ?? 'default'}`);
  title.textContent = callout.title;
  subtitle.textContent = callout.subtitle ?? '';
  subtitle.hidden = !callout.subtitle;
  for (const variant of Q_MAP_MARKER_VARIANTS) status.classList.remove(`variant-${variant}`);
  status.classList.add(`variant-${callout.status?.variant ?? 'default'}`);
  status.textContent = callout.status?.label ?? '';
  status.hidden = !callout.status;
  meta.textContent = callout.meta ?? '';
  meta.hidden = !callout.meta;
  updateCalloutStats(stats, callout.stats ?? []);
}

function updateCalloutStats(
  element: HTMLDListElement,
  stats: readonly QMapMarkerCalloutStat[],
): void {
  const items = stats.map((stat) => {
    const item = element.ownerDocument.createElement('div');
    item.className = `q-map-callout__stat layout-${stat.layout ?? 'compact'}`;

    const label = element.ownerDocument.createElement('dt');
    label.className = 'q-map-callout__stat-label';
    label.textContent = stat.label;

    const value = element.ownerDocument.createElement('dd');
    value.className = 'q-map-callout__stat-value';
    value.textContent = String(stat.value);

    item.append(label, value);
    return item;
  });

  element.replaceChildren(...items);
  element.hidden = items.length === 0;
}
