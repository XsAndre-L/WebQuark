type ExampleActions = (element: HTMLElement, add: (label: string, run: () => unknown) => void) => void;

// Each handler is also serialized into the corresponding standalone example.
export const actionsAI: Record<string, ExampleActions> = {
  'q-avatar': (element, add) => {
    const avatar = element as HTMLQAvatarElement;
    add('Load local image', () => { avatar.src = 'assets/comparison-before.svg'; });
    add('Show failed-image fallback', () => { avatar.src = 'assets/unavailable-avatar.svg'; });
  },

  'q-carousel': (element, add) => {
    const carousel = element as HTMLQCarouselElement;
    add('First slide', () => carousel.slideTo(0));
    add('Play', () => carousel.play());
    add('Pause', () => carousel.pause());
    add('Recalculate slide bounds', () => carousel.updateLimits());

    if (carousel.slideTiming === 'finishVideos') {
      let visit = 0;
      let currentKey = '';
      const registerVisit = (slide: HTMLElement) => {
        currentKey = 'slide-visit-' + ++visit;
        return carousel.setSlidePlayback(slide, currentKey, 'completion');
      };
      carousel.addEventListener('qSlideChange', event => {
        if (event.target === carousel) void registerVisit(event.detail.element);
      });
      add('Finish current slide', async () => {
        const firstSlide = Array.from(carousel.children).find(child => !child.hasAttribute('slot'));
        if (!currentKey && firstSlide instanceof HTMLElement) await registerVisit(firstSlide);
        if (currentKey) await carousel.completeSlide(currentKey);
      });
    }
  },

  'q-chip': (element) => {
    const chip = element as HTMLQChipElement;
    chip.addEventListener('qClick', () => {
      if (chip.clickable && chip.variant === 'filter' && !chip.href) chip.selected = !chip.selected;
    });
  },

  'q-data-table': (element) => {
    const table = element as HTMLQDataTableElement;
    if (!table.showSearch && table.sortMode !== 'external') return;

    const allRows = Array.isArray(table.items)
      ? table.items.filter((row): row is Record<string, unknown> => row !== null && typeof row === 'object')
      : [];
    const updateRows = () => {
      const term = (table.searchValue || '').toLowerCase();
      const rows = allRows.filter(row =>
        Object.values(row).some(value => String(value).toLowerCase().includes(term))
      );
      const {sortColumn, sortDirection} = table;
      if (table.sortMode === 'external' && sortColumn && sortDirection) {
        rows.sort((a, b) => {
          const result = String(a[sortColumn] ?? '').localeCompare(String(b[sortColumn] ?? ''), undefined, {numeric: true});
          return sortDirection === 'asc' ? result : -result;
        });
      }
      table.items = rows;
    };
    table.addEventListener('qSearch', event => {
      if (event.target === table) updateRows();
    });
    table.addEventListener('qSortChange', event => {
      if (event.target === table && table.sortMode === 'external') updateRows();
    });
  },

  'q-dialog': (element, add) => {
    const dialog = element as HTMLQDialogElement;
    add('Open dialog', () => dialog.show());
    add('Close dialog', () => dialog.close());
    add('Confirm', () => dialog.confirm());
    add('Cancel', () => dialog.cancel());
    element.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
  },

  'q-dropdown': (element, add) => {
    const dropdown = element as HTMLQDropdownElement;
    add('Focus', () => dropdown.focusElement());
    add('Check validity', () => dropdown.checkValidity());
    add('Report validity', () => dropdown.reportValidity());

    if (dropdown.externalSearch) {
      const initial = Array.isArray(dropdown.options) ? dropdown.options : [];
      const projects = initial.some(option => typeof option === 'object' && option.value === 'project-1');
      const options = projects
        ? Array.from({length: 30}, (_, i) => ({value: 'project-' + (i + 1), label: 'Project ' + (i + 1)}))
        : initial;
      const pageSize = 10;
      let term = '';
      let limit = pageSize;

      const updateOptions = () => {
        const matches = options.filter(option => {
          const label = typeof option === 'string' ? option : option.label;
          return String(label).toLowerCase().includes(term);
        });
        dropdown.options = matches.slice(0, limit);
        dropdown.hasMore = matches.length > limit;
      };
      dropdown.addEventListener('qSearch', event => {
        term = event.detail.toLowerCase();
        limit = pageSize;
        updateOptions();
      });
      dropdown.addEventListener('qLoadMore', () => {
        limit += pageSize;
        updateOptions();
      });
      updateOptions();
    }
  },

  'q-form': (element, add) => {
    const form = element as HTMLQFormElement;
    add('Read values', () => form.getValues());
    add('Set example value', async () => {
      const field = form.querySelector<HTMLElement>('q-input[name], input[name]');
      const name = field?.getAttribute('name');
      if (name) await form.setValues({[name]: 'Maya'});
      return form.getValues();
    });
    add('Check validity', () => form.checkValidity());
    add('Report validity', () => form.reportValidity());
    add('Submit', () => form.submitForm());
    add('Reset', () => form.resetForm());
  },

  'q-input': (element, add) => {
    const input = element as HTMLQInputElement;
    add('Focus', () => input.focusElement());
    add('Clear', () => input.clearValue());
    add('Check validity', () => input.checkValidity());
    add('Report validity', () => input.reportValidity());
  },
};
