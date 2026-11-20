# Slider

**Working preview:** Run `bun start` at the repository root, open the [playground](http://localhost:3333) and select **Forms & inputs → Slider**.

A single-value numeric input in the Inputs category. Uses a native range control for pointer, touch, arrow-key, Home and End interactions.

```html
<q-slider min="1" max="10"></q-slider>
<q-slider label="Gap" min="4" max="40" value="16" suffix="px"></q-slider>
```

Only min and max are needed. The initial value defaults to min; step defaults to 1. Optional value, label, aria-label, suffix, show-value, disabled and name configure presentation and forms. Values are clamped and snapped to steps relative to min. Invalid bounds default to 0/100; a maximum below minimum collapses the range at minimum. Invalid steps fall back to 1.

qInput emits a number during interaction; qChange emits a number on commit. Programmatic updates do not emit user events. Native form submission, reset, disabled fieldsets and WebQuark form adapters are supported.

The original XDeck slim track, glowing round thumb, hover enlargement and value badge are retained. Theme through q-font-family, q-fg-base and q-color-primary. Optional CSS properties --q-slider-track-color, --q-slider-thumb-color and --q-slider-thumb-hover-color allow application overrides. Parts: label, value, input. Keep application-specific theme overrides outside the library.
