export const PROP_GROUPS = [
  'content-data-identity',
  'appearance-layout',
  'features-behavior',
  'configuration-constraints',
  'state-status',
  'validation-feedback',
  'platform-external-integration',
  'accessibility',
] as const;

export type PropGroup = (typeof PROP_GROUPS)[number];

export interface ClassificationEntry {
  group: PropGroup;
  props: readonly string[];
}

export interface ClassificationOverride {
  scope: string;
  prop: string;
  group: PropGroup;
}

export interface RelationshipCluster {
  id: string;
  scope: string;
  props: readonly string[];
}

export interface MixinFactoryConfig {
  name: string;
  file: string;
}

export interface NamedSection {
  name: string;
  marker: string;
  props: readonly string[];
}

export interface NamedSectionConfig {
  scope: string;
  sections: readonly NamedSection[];
}

export interface PropOrderConfig {
  groups: readonly PropGroup[];
  classifications: readonly ClassificationEntry[];
  overrides: readonly ClassificationOverride[];
  clusters: readonly RelationshipCluster[];
  mixinFactories: readonly MixinFactoryConfig[];
  namedSections: readonly NamedSectionConfig[];
}

export const DEFAULT_CLASSIFICATIONS: readonly ClassificationEntry[] = [
  {
    group: 'content-data-identity',
    props: [
      'attribution',
      'brand',
      'cancelLabel',
      'code',
      'columns',
      'confirmLabel',
      'content',
      'dialogTitle',
      'heading',
      'icon',
      'itemLabel',
      'items',
      'keyField',
      'label',
      'logoSrc',
      'markers',
      'message',
      'options',
      'placeholder',
      'searchPlaceholder',
      'src',
      'toolbarTitle',
      'totalItems',
      'value',
    ],
  },
  {
    group: 'appearance-layout',
    props: [
      'backdropEffect',
      'bordered',
      'collapseControlAppearance',
      'collapseControlPosition',
      'color',
      'compact',
      'edge',
      'elevation',
      'expand',
      'fullHeight',
      'glass',
      'height',
      'itemWidth',
      'layout',
      'lift',
      'lineStyle',
      'maxHeight',
      'noBorders',
      'orientation',
      'padding',
      'panelSize',
      'position',
      'shape',
      'side',
      'size',
      'snapAlignment',
      'sticky',
      'stickyFooter',
      'stickyHeader',
      'stretch',
      'tone',
      'transparent',
      'underline',
      'variant',
    ],
  },
  {
    group: 'features-behavior',
    props: [
      'accordion',
      'autoGrow',
      'autoHide',
      'clearable',
      'clickable',
      'closeOnEsc',
      'closeOnOverlayClick',
      'clusterMarkers',
      'collapsible',
      'collapseControl',
      'collapseMode',
      'copyable',
      'dismissible',
      'editable',
      'enterBehavior',
      'external',
      'externalSearch',
      'iconOnly',
      'interactive',
      'lightbox',
      'mobileMode',
      'mode',
      'nativeOnMobile',
      'preventDefault',
      'removable',
      'repeat',
      'resizeMode',
      'rowActions',
      'rowClickable',
      'rowGroup',
      'scrollable',
      'searchable',
      'selectable',
      'showArrows',
      'showCancel',
      'showConfirm',
      'showIndicators',
      'showSearch',
      'showSummary',
      'showToolbar',
      'sortable',
      'video',
      'zoomControls',
    ],
  },
  {
    group: 'configuration-constraints',
    props: [
      'centerLatitude',
      'centerLongitude',
      'clusterMaxZoom',
      'clusterMinPoints',
      'clusterRadius',
      'collisionPadding',
      'delay',
      'fetchTimeout',
      'language',
      'maxBounds',
      'maxBoundsViscosity',
      'maxZoom',
      'minZoom',
      'pageSize',
      'placement',
      'rows',
      'sortMode',
      'tilePreloadBuffer',
      'vectorPadding',
      'zoom',
    ],
  },
  {
    group: 'state-status',
    props: [
      'activeValue',
      'checked',
      'collapsed',
      'disabled',
      'expanded',
      'hasMore',
      'highlighted',
      'indeterminate',
      'loading',
      'open',
      'page',
      'searchValue',
      'selected',
      'selectedKeys',
      'selectedMarkerId',
      'sortColumn',
      'sortDirection',
      'status',
    ],
  },
  {
    group: 'validation-feedback',
    props: ['error', 'errorMessage', 'max', 'min', 'noValidate', 'required', 'step'],
  },
  {
    group: 'platform-external-integration',
    props: [
      'action',
      'attributionUrl',
      'autocomplete',
      'brandHref',
      'download',
      'enctype',
      'googleApiKey',
      'googleMapType',
      'href',
      'lib',
      'libVersion',
      'localPath',
      'mailto',
      'method',
      'name',
      'provider',
      'rel',
      'target',
      'tel',
      'tileUrl',
      'type',
      'url',
      'vectorStyleUrl',
    ],
  },
  {
    group: 'accessibility',
    props: [
      'alt',
      'announcement',
      'ariaLabel',
      'ariaValueText',
      'closeLabel',
      'collapseLabel',
      'dismissLabel',
      'logoAlt',
      'mobileLabel',
    ],
  },
];

export const DEFAULT_PROP_ORDER_CONFIG: PropOrderConfig = {
  groups: PROP_GROUPS,
  classifications: DEFAULT_CLASSIFICATIONS,
  overrides: [
    { scope: 'q-icon', prop: 'name', group: 'content-data-identity' },
    { scope: 'q-icon', prop: 'label', group: 'accessibility' },
    { scope: 'q-scrollable', prop: 'target', group: 'configuration-constraints' },
    { scope: 'q-toggle', prop: 'type', group: 'features-behavior' },
  ],
  mixinFactories: [
    { name: 'withActionProps', file: 'src/components/actions/action.props.ts' },
    { name: 'withActionLabel', file: 'src/components/actions/action.props.ts' },
  ],
  clusters: [
    { id: 'action-navigation', scope: 'withActionProps', props: ['href', 'rel', 'download'] },
    { id: 'button-icon-accessibility', scope: 'q-button', props: ['icon', 'iconOnly', 'ariaLabel'] },
    { id: 'button-navigation', scope: 'q-button', props: ['href', 'target', 'rel', 'download', 'type'] },
    { id: 'chip-navigation', scope: 'q-chip', props: ['href', 'target', 'rel', 'download'] },
    { id: 'chip-interaction', scope: 'q-chip', props: ['clickable', 'removable'] },
    {
      id: 'link-navigation',
      scope: 'q-link',
      props: ['href', 'url', 'mailto', 'tel', 'target', 'rel', 'download', 'external'],
    },
    { id: 'alert-dismissal', scope: 'q-alert', props: ['dismissible', 'dismissLabel'] },
    { id: 'table-data', scope: 'q-data-table', props: ['columns', 'items', 'keyField'] },
    { id: 'table-row-interaction', scope: 'q-data-table', props: ['rowGroup', 'rowActions', 'rowClickable'] },
    { id: 'table-selection', scope: 'q-data-table', props: ['selectable', 'selectedKeys'] },
    {
      id: 'table-sorting',
      scope: 'q-data-table',
      props: ['sortable', 'sortMode', 'sortColumn', 'sortDirection'],
    },
    { id: 'table-toolbar', scope: 'q-data-table', props: ['showToolbar', 'toolbarTitle', 'ariaLabel'] },
    {
      id: 'table-search',
      scope: 'q-data-table',
      props: ['showSearch', 'searchPlaceholder', 'searchValue'],
    },
    { id: 'map-tiles', scope: 'q-map', props: ['tileUrl', 'tilePreloadBuffer'] },
    { id: 'map-vector', scope: 'q-map', props: ['vectorStyleUrl', 'vectorPadding'] },
    { id: 'map-google', scope: 'q-map', props: ['googleApiKey', 'googleMapType'] },
    { id: 'map-attribution', scope: 'q-map', props: ['attribution', 'attributionUrl'] },
    { id: 'map-center', scope: 'q-map', props: ['centerLatitude', 'centerLongitude'] },
    { id: 'map-zoom', scope: 'q-map', props: ['zoom', 'zoomControls', 'minZoom', 'maxZoom'] },
    { id: 'map-bounds', scope: 'q-map', props: ['maxBounds', 'maxBoundsViscosity'] },
    {
      id: 'map-clustering',
      scope: 'q-map',
      props: ['clusterMarkers', 'clusterRadius', 'clusterMinPoints', 'clusterMaxZoom'],
    },
    { id: 'pagination-page', scope: 'q-pagination', props: ['page', 'pageSize', 'totalItems'] },
    { id: 'pagination-summary', scope: 'q-pagination', props: ['showSummary', 'itemLabel'] },
    { id: 'syntax-value', scope: 'q-syntax-box', props: ['code', 'value'] },
    { id: 'syntax-heading', scope: 'q-syntax-box', props: ['heading', 'ariaLabel'] },
    { id: 'syntax-editing', scope: 'q-syntax-box', props: ['editable', 'name', 'required'] },
    {
      id: 'progress-value',
      scope: 'q-progress',
      props: ['value', 'label', 'indeterminate', 'ariaValueText'],
    },
    { id: 'dropdown-value', scope: 'q-dropdown', props: ['options', 'value'] },
    { id: 'dropdown-label', scope: 'q-dropdown', props: ['label', 'ariaLabel'] },
    { id: 'dropdown-placement', scope: 'q-dropdown', props: ['placement', 'collisionPadding'] },
    {
      id: 'dropdown-search',
      scope: 'q-dropdown',
      props: ['searchable', 'externalSearch', 'hasMore', 'loading'],
    },
    { id: 'input-label', scope: 'q-input', props: ['label', 'ariaLabel'] },
    { id: 'input-number', scope: 'q-input', props: ['type', 'min', 'max', 'step'] },
    { id: 'input-error', scope: 'q-input', props: ['error', 'errorMessage'] },
    { id: 'quantity-value', scope: 'q-quantity-selector', props: ['value', 'min', 'max', 'step'] },
    { id: 'textarea-label', scope: 'q-textarea', props: ['label', 'ariaLabel'] },
    { id: 'textarea-sizing', scope: 'q-textarea', props: ['rows', 'autoGrow', 'resizeMode'] },
    { id: 'textarea-error', scope: 'q-textarea', props: ['error', 'errorMessage'] },
    { id: 'carousel-sizing', scope: 'q-carousel', props: ['snapAlignment', 'itemWidth'] },
    {
      id: 'carousel-controls',
      scope: 'q-carousel',
      props: ['showArrows', 'showIndicators', 'repeat'],
    },
    {
      id: 'form-native',
      scope: 'q-form',
      props: ['action', 'method', 'autocomplete', 'enctype', 'target'],
    },
    { id: 'navbar-brand', scope: 'q-navbar', props: ['brand', 'logoSrc', 'logoAlt', 'brandHref'] },
    { id: 'navbar-items', scope: 'q-navbar', props: ['items', 'activeValue'] },
    { id: 'navbar-mobile', scope: 'q-navbar', props: ['mobileMode', 'mobileLabel'] },
    { id: 'navbar-edge', scope: 'q-navbar', props: ['edge', 'sticky'] },
    { id: 'navbar-surface', scope: 'q-navbar', props: ['compact', 'transparent', 'bordered'] },
    {
      id: 'panel-scrolling',
      scope: 'q-panel',
      props: ['scrollable', 'stickyHeader', 'stickyFooter'],
    },
    { id: 'scrollable-size', scope: 'q-scrollable', props: ['height', 'maxHeight'] },
    {
      id: 'scrollable-mode',
      scope: 'q-scrollable',
      props: ['mode', 'target', 'nativeOnMobile', 'autoHide'],
    },
    { id: 'sidepanel-drawer', scope: 'q-sidepanel', props: ['open', 'side', 'panelSize'] },
    {
      id: 'sidepanel-navigation',
      scope: 'q-sidepanel',
      props: ['items', 'value', 'mode', 'expanded', 'accordion'],
    },
    {
      id: 'sidepanel-collapse',
      scope: 'q-sidepanel',
      props: [
        'collapsible',
        'collapsed',
        'collapseControl',
        'collapseControlAppearance',
        'collapseControlPosition',
        'collapseMode',
        'collapseLabel',
      ],
    },
    { id: 'tabs-value', scope: 'q-tabs', props: ['items', 'value'] },
    {
      id: 'tabs-appearance',
      scope: 'q-tabs',
      props: ['orientation', 'size', 'variant', 'stretch'],
    },
    { id: 'toolbar-edge', scope: 'q-toolbar', props: ['edge', 'sticky'] },
    { id: 'toolbar-surface', scope: 'q-toolbar', props: ['compact', 'transparent', 'bordered'] },
    {
      id: 'icon-source',
      scope: 'q-icon',
      props: ['name', 'lib', 'localPath', 'libVersion', 'fetchTimeout'],
    },
    { id: 'thumbnail-content', scope: 'q-thumbnail', props: ['src', 'video', 'label', 'alt'] },
    { id: 'dialog-title', scope: 'q-dialog', props: ['dialogTitle', 'ariaLabel'] },
    { id: 'dialog-close', scope: 'q-dialog', props: ['closeOnEsc', 'closeOnOverlayClick'] },
    { id: 'dialog-cancel', scope: 'q-dialog', props: ['showCancel', 'cancelLabel'] },
    { id: 'dialog-confirm', scope: 'q-dialog', props: ['showConfirm', 'confirmLabel', 'loading'] },
  ],
  namedSections: [
    {
      scope: 'q-sidepanel',
      sections: [
        { name: 'Shared', marker: 'Shared', props: ['variant'] },
        { name: 'Drawer', marker: 'Drawer-mode props', props: ['open', 'side', 'panelSize'] },
        {
          name: 'Navigation',
          marker: 'Nav-mode props',
          props: [
            'items',
            'ariaLabel',
            'value',
            'mode',
            'expanded',
            'accordion',
            'collapsible',
            'collapsed',
            'collapseControl',
            'collapseControlAppearance',
            'collapseControlPosition',
            'collapseMode',
            'collapseLabel',
          ],
        },
      ],
    },
  ],
};
