# CMS component scaffolding

The generic shells are q-banner, q-section, q-media and q-accordion. They expose typed properties and slots only; layout, media playback and accordion behavior are deliberately unfinished.

The existing Stencil configuration discovers these source components and generates Angular/React proxies on the next build. Generated wrappers are ignored in this repository. No build, package release or tests were run for this scaffold.

WebAppStack currently consumes its installed @webquark/angular package for QButton, QIcon, QLink, QCard and QCarousel. Its CMS adapters continue using native media and disclosure markup until these new primitives are implemented and released. No imports of unpublished components have been added to the application.

CMS data, variant restrictions, Markdown handling and Strapi mappings remain in the application-side CMS adapter library.
