export const switchHelpText = `wq-switch — run inside the consuming project

  setup [--source <path>] Create configuration and package scripts (also: wq-setup)
  local                  Build all packages and activate local snapshots
  build                  Build all packages; refresh snapshots if already local
  npm                    Restore original installed packages (no upgrade)
  check                  Verify the native-content.css export before bundling
  status                 Inspect actual package connections
`;

export const setupHelpText = `wq-setup [--source <path>]
Reuses workspace configuration or creates .webquark/.webquark.json; adds wq-sandbox/wq-switch/wq-check scripts in the consuming project.`;
