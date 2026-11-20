type ExampleActions = (element: HTMLElement, add: (label: string, run: () => unknown) => void) => void;

// Also embedded as plain JavaScript in the corresponding standalone example.
const fieldActions: ExampleActions = (element, add) => {
  const form = document.createElement('form');
  element.before(form);
  form.append(element);

  const field = element as HTMLElement & {
    focusElement?: () => Promise<void>;
    checkValidity?: () => Promise<boolean>;
    reportValidity?: () => Promise<boolean>;
    adjustHeight?: () => Promise<void>;
    scrollToBottom?: () => Promise<void>;
    toggle?: () => Promise<void>;
  };

  if (field.focusElement) add('Focus field', () => field.focusElement!());
  if (field.adjustHeight) add('Adjust height', () => field.adjustHeight!());
  if (field.scrollToBottom) add('Scroll to bottom', () => field.scrollToBottom!());
  if (field.toggle) add('Toggle', () => field.toggle!());
  if (field.checkValidity) add('Check validity', () => field.checkValidity!());
  if (field.reportValidity) add('Report validity', () => field.reportValidity!());

  let submitted: Record<string, FormDataEntryValue> | undefined;
  form.addEventListener('submit', event => {
    event.preventDefault();
    submitted = Object.fromEntries(new FormData(form));
  });
  add('Submit form', () => {
    submitted = undefined;
    form.requestSubmit();
    return submitted ?? 'Validation prevented submission';
  });
  add('Reset form', () => form.reset());
};

export const actionsLZ: Record<string, ExampleActions> = {
  'q-alert': (element, add) => {
    const container = document.createElement('div');
    element.before(container);
    container.append(element);
    element.addEventListener('qDismiss', () => { container.hidden = true; });
    add('Restore alert', () => { container.hidden = false; });
  },

  'q-map': (element, add) => {
    const map = element as HTMLQMapElement;
    add('Fit all markers', () => map.fitMarkers({padding: 20, maxZoom: 14}));
    add('Reveal selected or first marker', () => {
      const markers = typeof map.markers === 'string' ? JSON.parse(map.markers) : map.markers;
      const markerId = map.selectedMarkerId ?? markers?.[0]?.id;
      if (markerId === undefined) return 'Add a marker first';

      const region = element.getBoundingClientRect();
      const overlay = document.createElement('span');
      overlay.textContent = 'Map legend';
      Object.assign(overlay.style, {
        position: 'fixed', top: region.top + 'px', left: region.left + 'px',
        background: 'Canvas', color: 'CanvasText', padding: '1rem', zIndex: '1',
      });
      element.after(overlay);
      return map.ensureMarkerVisible(markerId, [overlay.getBoundingClientRect()]).finally(() => overlay.remove());
    });
  },

  'q-pagination': (element) => {
    const pagination = element as HTMLQPaginationElement;
    const list = document.createElement('ol');
    list.setAttribute('aria-label', 'Visible records');
    element.after(list);

    const render = (page: number) => {
      const total = Math.max(0, Math.floor(pagination.totalItems));
      const size = Math.max(1, Math.floor(pagination.pageSize));
      const lastPage = Math.max(1, Math.ceil(total / size));
      const start = (Math.max(1, Math.min(lastPage, Math.floor(page))) - 1) * size;
      const count = Math.min(size, total - start, 50);
      list.start = start + 1;
      list.replaceChildren();
      for (let index = 0; index < count; index++) {
        const row = document.createElement('li');
        row.textContent = 'Record ' + (start + index + 1);
        list.append(row);
      }
      if (Math.min(size, total - start) > count) {
        const more = document.createElement('li');
        more.textContent = 'Showing the first 50 records on this page';
        list.append(more);
      }
    };
    render(pagination.page);
    pagination.addEventListener('qPageChange', event => render(event.detail));
  },

  'q-radio-group': fieldActions,

  'q-scrollable': (element, add) => {
    const scrollable = element as HTMLQScrollableElement;
    if (scrollable.target === '[data-playground-scroll-target]') {
      const viewport = document.createElement('div');
      viewport.id = 'scroll-target-' + crypto.randomUUID();
      viewport.style.cssText = 'height:150px;overflow:auto';
      viewport.tabIndex = 0;
      viewport.setAttribute('aria-label', 'External scroll target');
      const content = document.createElement('p');
      content.style.minHeight = '360px';
      content.textContent = 'Scroll this external region to see its native scrollbar.';
      viewport.append(content);
      element.before(viewport);
      scrollable.target = '#' + viewport.id;
      return;
    }
    add('Scroll to 60px', () => scrollable.scrollToPosition(60));
    add('Scroll to bottom', () => scrollable.scrollToBottom());
  },

  'q-sidepanel': (element, add) => {
    const panel = element as HTMLQSidepanelElement;
    if (panel.variant === 'drawer') {
      add('Open drawer', () => { panel.open = true; });
      add('Close drawer', () => { panel.open = false; });
      panel.addEventListener('click', event => {
        if (event.composedPath().some(node => node instanceof HTMLElement && node.hasAttribute('data-close-drawer'))) panel.open = false;
      });
    } else if (panel.collapsible) {
      add('Toggle collapsed state', () => {
        panel.collapsed = !panel.collapsed;
        return panel.collapsed;
      });
    }
  },

  'q-slider': fieldActions,
  'q-syntax-box': fieldActions,
  'q-syntax-view': fieldActions,

  'q-tabs': (element) => {
    const tabs = element as HTMLQTabsElement;
    const items: unknown = typeof tabs.items === 'string' ? JSON.parse(tabs.items) : tabs.items;
    if (!Array.isArray(items)) return;

    const group = document.createElement('div');
    const prefix = 'example-' + crypto.randomUUID();
    const panels = new Map<string, HTMLElement>();
    tabs.items = items.flatMap((input, index) => {
      const candidate = typeof input === 'string' ? {label: input, value: input} : input;
      if (typeof candidate?.label !== 'string' || typeof candidate?.value !== 'string') return [];
      const item = {...candidate, label: candidate.label.trim(), value: candidate.value.trim()};
      if (!item.label || !item.value) return [];
      const tabId = item.tabId ?? prefix + '-tab-' + index;
      const panelId = item.panelId ?? prefix + '-panel-' + index;
      const panel = document.createElement('div');
      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-label', item.label);
      panel.tabIndex = 0;
      panel.textContent = item.label + ' content';
      panels.set(item.value, panel);
      group.append(panel);
      return [{...item, tabId, panelId}];
    });
    const show = (value: string) => {
      for (const [key, panel] of panels) panel.hidden = key !== value;
    };
    const enabled = tabs.items.filter(item => typeof item !== 'string' && !item.disabled);
    const selected = enabled.find(item => typeof item !== 'string' && item.value === tabs.value) ?? enabled[0];
    show(selected && typeof selected !== 'string' ? selected.value : '');
    element.after(group);
    tabs.addEventListener('qChange', event => show(event.detail));
  },

  'q-textarea': fieldActions,

  'q-toast': (element, add) => {
    const toast = element as HTMLQToastElement;
    const editor = document.createElement('q-panel');
    editor.setAttribute('aria-label', 'Toast content');
    editor.setAttribute('padding', 'sm');

    const heading = document.createElement('strong');
    heading.slot = 'header';
    heading.textContent = 'Toast content';

    const fields = document.createElement('q-grid');
    fields.setAttribute('min-item-width', '13rem');
    fields.setAttribute('gap', 'sm');
    editor.append(heading, fields);

    const input = (label: string, value: string, type: 'text' | 'number' = 'text') => {
      const control = document.createElement('q-input');
      control.setAttribute('label', label);
      control.setAttribute('type', type);
      control.setAttribute('value', value);
      fields.append(control);
      return control;
    };
    const title = input('Title', 'Document updated');
    const description = input('Description', 'Your changes were saved.');
    const persistent = element.dataset.example === 'Persistent notifications';
    const duration = input('Duration in ms (blank for default)', persistent ? '0' : '', 'number');
    duration.setAttribute('min', '0');
    const dismissible = document.createElement('q-toggle');
    dismissible.setAttribute('type', 'checkbox');
    dismissible.setAttribute('label', 'Dismissible');
    dismissible.setAttribute('checked', '');
    fields.append(dismissible);
    element.after(editor);

    let lastId: string | undefined;
    for (const variant of ['info', 'success', 'warning', 'danger', 'error'] as const) {
      add('Show ' + variant, async () => {
        lastId = await toast[variant](title.value, description.value, {
          duration: duration.value === '' ? undefined : Number(duration.value),
          dismissible: dismissible.checked,
        });
        return lastId;
      });
    }
    if (element.dataset.example === 'Queue with one visible toast') {
      add('Queue three notifications', async () => {
        const ids: string[] = [];
        for (let number = 1; number <= 3; number++) {
          lastId = await toast.info('Item ' + number, 'Dismiss to reveal the next item.', {duration: 0});
          ids.push(lastId);
        }
        return ids;
      });
    }
    add('Dismiss last toast', () => lastId ? toast.dismiss(lastId) : false);
    add('Clear queue', () => toast.clear());
  },

  'q-toggle': fieldActions,

  'q-toolbar': (element) => {
    if (!(element as HTMLQToolbarElement).sticky) return;
    const viewport = document.createElement('div');
    viewport.style.cssText = 'height:180px;overflow:auto;width:100%';
    viewport.setAttribute('aria-label', 'Scrollable toolbar example');
    viewport.tabIndex = 0;
    element.before(viewport);
    const content = document.createElement('p');
    content.style.minHeight = '480px';
    content.textContent = 'Scroll to inspect the sticky toolbar.';
    viewport.append(element, content);
  },
};
