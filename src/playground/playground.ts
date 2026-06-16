import { fetchComponentSpec } from './state';
import './components/playground-header/playground-header';
import './components/playground-sidebar/playground-sidebar';
import './components/sandbox-viewport/sandbox-viewport';
import './components/playground-event-log/playground-event-log';
import './components/playground-code-preview/playground-code-preview';
import './components/properties-panel/properties-panel';
import './components/theme-designer/theme-designer';

// Bootstrapping: fetch initial default component specification
fetchComponentSpec('q-button');
