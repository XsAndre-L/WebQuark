import { actionsAI } from './actions-a-i';
import { actionsLZ } from './actions-l-z';

export type DemoAction = (label: string, run: () => unknown) => void;
export type InstallActions = (element: HTMLElement, add: DemoAction) => void;
export const actions: Partial<Record<string, InstallActions>> = { ...actionsAI, ...actionsLZ };

// These functions also run in copied examples. Keep their dependencies explicit.
export function stateFromEvent(tag: string, name: string, detail: any): Record<string, any> {
  if (name === 'qClose' && ['q-dialog', 'q-sidepanel'].includes(tag)) return { open: false };
  if (name === 'qCollapsedChange') return { collapsed: detail.collapsed };
  if (name === 'qValuesChange') return { values: detail };
  if (name === 'qPageChange') return { page: detail };
  if (name === 'qSelect' && ['q-navbar', 'q-sidepanel'].includes(tag)) return { value: detail.value };
  if (name === 'qSelectionChange') return { selectedKeys: detail.selectedKeys };
  if (name === 'qSearch' && tag === 'q-data-table') return { searchValue: detail };
  if (name === 'qSortChange') return { sortColumn: detail.columnKey, sortDirection: detail.direction };
  if (name === 'qMarkerSelect') return { selectedMarkerId: detail.marker.id };
  if (name === 'qChange' && tag === 'q-image-comparison') return { position: detail };
  if (name === 'qChange' && tag === 'q-toggle') return { checked: detail };
  if ((name === 'qChange' || name === 'qInput') && ['q-input', 'q-textarea', 'q-syntax-box', 'q-slider', 'q-dropdown', 'q-radio-group', 'q-quantity-selector', 'q-tabs'].includes(tag)) return { value: detail };
  return {};
}

export function installActions(el: HTMLElement, container: HTMLElement, install: InstallActions) {
  const output = document.createElement('output');
  install(el, (label, run) => {
    const button = document.createElement('q-button');
    button.setAttribute('type', 'button');
    button.setAttribute('size', 'sm');
    button.setAttribute('variant', 'secondary');
    button.textContent = label;
    button.onclick = async () => {
      try {
        const result = await run();
        output.textContent = result === undefined ? label : label + ': ' + JSON.stringify(result);
      } catch (error) {
        output.textContent = label + ': ' + String(error);
      }
    };
    container.append(button);
  });
  if (container.childElementCount) container.append(output);
}
