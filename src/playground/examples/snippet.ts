import { contracts, portableAsset, wrapTrigger, type ResolvedExample } from './example';
import { actions, installActions, stateFromEvent } from './interactions';

function scriptLiteral(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

let videoData: Promise<string> | undefined;

async function portableVideo(): Promise<string> {
  videoData ??= fetch('assets/reel-motion.webm').then(async response => {
    if (!response.ok) throw new Error('Video fixture unavailable');
    const bytes = new Uint8Array(await response.arrayBuffer());
    return 'data:video/webm;base64,' + btoa(String.fromCharCode(...bytes));
  }).catch(error => { videoData = undefined; throw error; });
  return videoData;
}

export async function snippet(example: ResolvedExample): Promise<string> {
  const { tag, name, props, content } = example;
  const element = document.createElement('template');
  // Inert template nodes keep serialization independent of component lifecycle and reflection.
  element.innerHTML = '<' + tag + '></' + tag + '>';
  const host = element.content.firstElementChild as HTMLElement;
  host.innerHTML = content;
  for (const child of host.querySelectorAll('[src], [href]')) {
    for (const key of ['src', 'href']) {
      const value = child.getAttribute(key);
      if (value) child.setAttribute(key, value === 'assets/reel-motion.webm' ? await portableVideo() : portableAsset(value));
    }
  }

  const setup: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (tag === 'q-map' && key === 'googleApiKey' && value) {
      setup.push('  // Supply your own browser-restricted Google Maps key here.');
      continue;
    }
    const attribute = ['style', 'dir'].includes(key) ? key : contracts[tag].attributes[key];
    if (attribute && typeof value !== 'object' && typeof value !== 'function') {
      host.setAttribute(attribute, value === true ? '' : portableAsset(String(value)));
    } else {
      const jsValue = typeof value === 'function' ? value.toString() :
        JSON.stringify(value, (_key, entry) => typeof entry === 'string' ? portableAsset(entry) : entry).replaceAll('<', '\\u003c');
      setup.push('  element[' + scriptLiteral(key) + '] = ' + jsValue + ';');
    }
  }

  const install = actions[tag];
  const controlled = contracts[tag].events.filter(event =>
    Object.keys(stateFromEvent(tag, event, { marker: {}, selectedKeys: [] })).length
  );
  const wrapped = wrapTrigger(host);
  if (!setup.length && !controlled.length && !install) return wrapped.outerHTML;

  const scope = document.createElement('section');
  if (install) host.dataset.example = name;
  scope.append(wrapped);

  const lines = ['<script>', '((scope) => {', '  const element = scope.querySelector(' + scriptLiteral(tag) + ');', '  customElements.whenDefined(' + scriptLiteral(tag) + ').then(async () => {'];
  lines.push(...setup.map(line => '  ' + line));
  if (controlled.length) {
    lines.push('    const changes = ' + stateFromEvent.toString() + ';',
      '    for (const name of ' + scriptLiteral(controlled) + ') {',
      '      element.addEventListener(name, event => {',
      '        if (event.target === element) Object.assign(element, changes(element.localName, name, event.detail));',
      '      });', '    }');
  }
  if (install) {
    lines.push('    await element.componentOnReady?.();', '    const controls = document.createElement("div");',
      '    scope.append(controls);', '    (' + installActions.toString() + ')(element, controls, ' + install.toString() + ');');
  }
  lines.push('  });', '})(document.currentScript.previousElementSibling);', '</script>');
  return scope.outerHTML + '\n' + lines.join('\n');
}
