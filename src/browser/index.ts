/**
 * @fileoverview entry point for your component library
 *
 * This is the entry point for your component library. Use this file to export utilities,
 * constants or data structure that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */

export { format } from './utils/utils';
export { calculateImageCropGeometry, hasPartialImageCrop, isImageCropValid } from './utils/image-crop';
export type { ImageCrop, ImageCropBox, ImageCropGeometry } from './utils/image-crop';
export {
  identifyItems,
  reconcileByIdentity,
} from './utils/collection-identity';
export type {
  CollectionIdentity,
  CollectionIdentityGetter,
  CollectionIdentityInput,
  CollectionIdentityOptions,
  CollectionIdentityWarning,
  CollectionIdentityWarningCode,
  CollectionIdentityWarningHandler,
  CollectionReconciliationContext,
  IdentifiedCollectionItem,
  ReconcileByIdentityOptions,
  ReconcileByIdentityResult,
} from './utils/collection-identity';
export {
  Q_MAP_DEFAULT_CLUSTER_GROUP,
  Q_MAP_MARKER_CALLOUT_PLACEMENTS,
  Q_MAP_MARKER_CALLOUT_STAT_LAYOUTS,
  Q_MAP_MARKER_CALLOUT_VISIBILITIES,
  Q_MAP_MARKER_KINDS,
  Q_MAP_MARKER_RINGS,
  Q_MAP_MARKER_SIZES,
  Q_MAP_MARKER_VARIANTS,
  Q_MAP_RASTER_TILE_LOADING_POLICIES,
} from './components/data-display/map/map.types';
export {
  getDataTableCellSlotName,
  getDataTableCellValue,
  getDataTableItemKey,
  getDataTableRowGutterSlotName,
} from './components/data-display/data-table/data-table-cell';
export type * from './components.d.ts';
export type {
  QCarouselAutoplayChangeDetail,
  QCarouselLayout,
  QCarouselSlideChangeDetail,
  QCarouselSnapAlignment,
  QCarouselTransition,
} from './components/content/carousel/carousel.types';
export type {
  DataTableCellContext,
  DataTableCellClassName,
  DataTableColumnSticky,
  DataTableItem,
  DataTableKey,
  DataTableRowAction,
  DataTableRowGroup,
  DataTableRowGrouper,
  DataTableRowGutter,
  DataTableSortDirection,
  DataTableSortMode,
  QDataTableRowActionDetail,
  QDataTableRowClickDetail,
  QDataTableSelectionChangeDetail,
  QDataTableSortChangeDetail,
  TableColumn,
} from './components/data-display/data-table/data-table.types';
export type {
  QMapBounds,
  QMapBoundsInput,
  QMapClusterSelectDetail,
  QMapClickDetail,
  QMapErrorCode,
  QMapErrorDetail,
  QMapGoogleMapType,
  QMapFitMarkersOptions,
  QMapMarker,
  QMapMarkerBadge,
  QMapMarkerCallout,
  QMapMarkerCalloutPlacement,
  QMapMarkerCalloutStat,
  QMapMarkerCalloutStatLayout,
  QMapMarkerCalloutVisibility,
  QMapMarkerId,
  QMapMarkerInput,
  QMapMarkerKind,
  QMapMarkerRing,
  QMapMarkerSelectDetail,
  QMapMarkerSize,
  QMapMarkerVariant,
  QMapMarkerVisibilityResult,
  QMapProvider,
  QMapRasterTileLoadingPolicy,
  QMapStatus,
  QMapStatusChangeDetail,
  QMapViewportRect,
} from './components/data-display/map/map.types';
export {
  configureQIcons,
  registerQIcons,
} from './components/media/icon/internals/registry';
export type {
  QIconAttributes,
  QIconConfiguration,
  QIconDefinition,
  QIconNode,
  QIconRegistry,
} from './components/media/icon/icon.types';
export type {
  NavbarItem,
  NavbarItemInput,
  NavbarSelectDetail,
  QNavbarAddonPlacement,
  QNavbarEdge,
  QNavbarMobileMode,
  QNavbarNavAlign,
  QNavbarNavCenterWithin,
  QNavbarTarget,
} from './components/layout/navbar/navbar.types';
export type { QTabsOrientation, QTabsSize, QTabsVariant, TabItem, TabItemInput } from './components/layout/tabs/tabs.types';
export { toast } from './components/communication/toast/toast-controller';
export type {
  QToastController,
  QToastId,
  QToastOptions,
  QToastPosition,
  QToastVariant,
} from './components/communication/toast/toast.types';

// Generic content component contracts (visual implementation is scaffolded).
export type { QBannerHeight, QBannerAlignment } from './components/content/banner/banner.types';
export type { QSectionLayout } from './components/layout/section/section.types';
export type { QMediaKind, QMediaLoading } from './components/media/media/media.types';
export type { QAccordionMode } from './components/data-display/accordion/accordion.types';
export type { QSpace, QSize, QControlSize, QInputWidth, QSurface, QPreset } from './theme/tokens';
