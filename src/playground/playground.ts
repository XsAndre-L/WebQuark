import { fetchComponentSpec } from './state';
import './components/playground-header/playground-header';
import './components/playground-sidebar/playground-sidebar';
import './components/sandbox-viewport/sandbox-viewport';
import './components/properties-panel/properties-panel';
import './components/theme-designer/theme-designer';

// Bootstrapping: fetch initial default component specification
fetchComponentSpec('q-button');
