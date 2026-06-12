import { fetchComponentSpec } from './state.js';
import './components/playground-header/playground-header.js';
import './components/playground-sidebar/playground-sidebar.js';
import './components/playground-stage/playground-stage.js';
import './components/playground-event-log/playground-event-log.js';
import './components/playground-code-preview/playground-code-preview.js';
import './components/playground-knobs/playground-knobs.js';
import './components/playground-theme-designer/playground-theme-designer.js';

// Bootstrapping: fetch initial default component specification
fetchComponentSpec('q-button');
