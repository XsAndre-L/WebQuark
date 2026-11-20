import { applyExample, contracts, wrapTrigger, type ResolvedExample } from './example';
import { actions, installActions, stateFromEvent } from './interactions';

export interface ExampleEvent {
  source: string;
  name: string;
  detail: unknown;
}

export function mountExample(stage: HTMLElement, controls: HTMLElement, initial: ResolvedExample,
  log: (event: ExampleEvent) => void, change?: (key: string, value: unknown) => void) {
  let example = initial;
  let host: HTMLElement | undefined;
  let mounted = false;
  let disposed = false;
  const owner = stage.ownerDocument.createElement('div');
  owner.className = 'example-fixture';

  function synchronize(key: string, value: unknown) {
    if (host && !Object.is(Reflect.get(host, key), value)) Reflect.set(host, key, value);
    change?.(key, value);
  }

  async function mount() {
    await customElements.whenDefined(initial.tag);
    if (disposed) return;
    const element = document.createElement(example.tag);
    host = element;
    applyExample(element, example);
    const source = example.tag + ' · ' + example.name;
    for (const name of contracts[example.tag].events) {
      element.addEventListener(name, raw => {
        if (raw.target !== element || disposed || host !== element) return;
        const detail = (raw as CustomEvent).detail;
        log({ source, name, detail });
        for (const [key, value] of Object.entries(stateFromEvent(example.tag, name, detail))) synchronize(key, value);
      });
    }

    owner.replaceChildren(wrapTrigger(element));
    stage.replaceChildren(owner);
    mounted = true;
    await (element as any).componentOnReady?.();
    if (disposed || element !== host) return;

    const setup = actions[example.tag];
    if (setup) {
      installActions(element, controls, (el, add) => setup(el, (label, run) => add(label, async () => {
        const result = await run();
        if (!disposed && host === element) {
          if (['q-dialog', 'q-sidepanel'].includes(el.localName)) synchronize('open', Reflect.get(el, 'open'));
          log({ source, name: label, detail: result });
        }
        return result;
      })));
    }
    controls.hidden = !controls.childElementCount;
  }

  void mount();
  return {
    update(next: ResolvedExample) {
      const previous = example;
      example = next;
      if (!mounted || !host) return;
      const keys = new Set([...Object.keys(previous.props), ...Object.keys(next.props)]);
      const setupProps = ['slideTiming', 'showSearch', 'sortMode', 'items', 'externalSearch', 'options',
        'variant', 'type', 'mode', 'pageSize', 'totalItems', 'page', 'value', 'collapsible', 'target', 'sticky'];
      const recreate = [...keys].some(key => !(key in next.props) ||
        (setupProps.includes(key) && !Object.is(next.props[key], previous.props[key]) && !Object.is(next.props[key], Reflect.get(host!, key))));
      if (recreate || (previous.content !== next.content && actions[next.tag])) {
        mounted = false;
        host = undefined;
        controls.replaceChildren();
        stage.replaceChildren();
        void mount();
      } else applyExample(host, next, previous);
    },
    dispose() {
      disposed = true;
      stage.replaceChildren();
      controls.replaceChildren();
    },
  };
}
