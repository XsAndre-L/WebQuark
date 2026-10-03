import type { QIconDefinition } from '../icon.types';

export const RESOURCE_ICON: QIconDefinition = {
  size: 24,
  node: [
    ['defs', {}, [
      ['linearGradient', { id: 'paint', x1: '0', x2: '1' }, [
        ['stop', { offset: '0', 'stop-color': '#246' }],
        ['stop', { offset: '1', 'stop-color': '#acf' }],
      ]],
      ['mask', { id: 'cutout' }, [['rect', { width: '24', height: '24', fill: 'white' }]]],
      ['clipPath', { id: 'clip' }, [['circle', { cx: '12', cy: '12', r: '11' }]]],
      ['symbol', { id: 'shape', viewBox: '0 0 24 24' }, [['path', { d: 'M2 2h20v20H2Z' }]]],
    ]],
    ['g', { mask: 'url(#cutout)', 'clip-path': 'url(#clip)' }, [
      ['use', { href: '#shape', fill: 'url(#paint)' }],
    ]],
  ],
};

export const RESOURCE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="paint" x1="0" x2="1"><stop offset="0" stop-color="#246"/><stop offset="1" stop-color="#acf"/></linearGradient>
    <mask id="cutout"><rect width="24" height="24" fill="white"/></mask>
    <clipPath id="clip"><circle cx="12" cy="12" r="11"/></clipPath>
    <symbol id="shape" viewBox="0 0 24 24"><path d="M2 2h20v20H2Z"/></symbol>
  </defs>
  <g mask="url(#cutout)" clip-path="url(#clip)"><use xlink:href="#shape" fill="url(#paint)"/></g>
</svg>`;

// Deliberately inert: rejection is asserted through DOM/fallback, never execution.
export const REJECTED_SVGS = [
  ['malformed XML', '<svg><path></svg>'],
  ['incomplete element', '<svg><script type="application/json">{"blocked":true}'],
  ['unsupported script', '<svg><script type="application/json">{}</script></svg>'],
  ['foreign content', '<svg><foreignObject/></svg>'],
  ['navigation', '<svg><a href="#marker"/></svg>'],
  ['animation', '<svg><animate attributeName="opacity" values="1;0"/></svg>'],
  ['event attribute', '<svg onload=""><path d="M1 1"/></svg>'],
  ['inline style', '<svg><path style="fill:red" d="M1 1"/></svg>'],
  ['external paint', '<svg><path fill="url(https://example.invalid/paint)" d="M1 1"/></svg>'],
  ['external use', '<svg><use href="https://example.invalid/shape.svg#x"/></svg>'],
  ['wrong namespace', '<svg xmlns="urn:unsupported"><path/></svg>'],
  ['namespace reset', '<svg xmlns="http://www.w3.org/2000/svg"><path xmlns=""/></svg>'],
  ['unknown prefixed namespace', '<svg xmlns:z="urn:unsupported"><z:path/></svg>'],
  ['entity declaration', '<!DOCTYPE svg [<!ENTITY x "inert">]><svg/>'],
  ['stylesheet instruction', '<?xml-stylesheet href="https://example.invalid/style"?><svg/>'],
  ['text-bearing content', '<svg><path>unsupported text</path></svg>'],
  ['unresolved reference', '<svg><use href="#missing"/></svg>'],
  ['cyclic reference', '<svg><defs><symbol id="loop"><use href="#loop"/></symbol></defs></svg>'],
] as const;
