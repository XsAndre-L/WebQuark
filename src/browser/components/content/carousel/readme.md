# q-carousel



## Transitions

`transition="slide"` retains native horizontal scrolling. `crossfade` and `instant`
show one full-width slide at a time, using the tallest item's height. Arrows, dots,
`repeat`, `slideTo()` and `qSlideChange` work across all modes.

`transitionDuration` defaults to 500 milliseconds and controls only crossfade.
Instant has no animation; slide timing remains browser-controlled. Reduced motion
disables fading. Overlay modes support horizontal touch swipes and arrow keys;
vertical page scrolling and nested interactive controls retain their behavior.
Inactive overlay slides are inert and hidden from assistive technology. Authored
attributes are restored when leaving overlay mode or disconnecting. Consumers
remain responsible for pausing media in inactive slides. Optional built-in autoplay
owns scheduling and its pause/resume policy.

## Layout and controls

`layout="strip"` preserves natural-width items, spacing tokens and native horizontal
scrolling. `layout="slideshow"` defaults to full-width slides with zero viewport gap
and padding. Explicit item widths and per-instance CSS tokens remain available.
Overlay transitions still use the tallest slide's height.

Omitted `showArrows` and `showIndicators` resolve to disabled for strips and enabled
for navigable slideshows. Explicit `false` overrides the preset. These properties
now return `undefined` when omitted, rather than `false`; their strip rendering
remains unchanged. A single fitting slide has no unnecessary navigation controls.

```html
<q-carousel layout="slideshow" aria-label="Featured products">
  <article>First product</article>
  <article>Second product</article>
</q-carousel>
```

Controls expose `previous-button`, `next-button`, `indicator`, `rotation-button`
and `controls` parts. The `viewport` part names the slide surface. Arrow and indicator sizes
retain their existing theme tokens and active-pill styling; indicators wrap to
the available container width. Coarse-pointer/no-hover inputs keep arrows
visible without identifying a particular device.

## Video timing

`slideTiming="fixedInterval"` preserves interval rotation. With `finishVideos`,
the consumer registers each selected slide using `setSlidePlayback(element, key,
mode)`: `completion` for a video, `interval` for images, text or failed playback.
Use a new key for each visit or responsive source change. Report video completion
through `completeSlide(key)`; stale and duplicate completions are ignored.

Use `qPlaybackChange.detail.playing` to pause/resume the selected video. Consumers
restart video media on a new visit, preserve position on Pause/Play, and disable
native looping. `autoplayAdvanceSuspended` holds advancement for image loading
without suspending media playback. A single registered video supports Play/Pause
and explicit replay through a new `qSlideChange` visit after completion.

`rotationPlacement="overlay"` moves the existing playback button outside the
indicator/extra-controls panel. The panel is hidden when neither has content.
The default placement remains `controls`.

## Focus and slide accessibility

Slideshow navigation uses buttons instead of an additional viewport tab stop.
If arrows and indicators are explicitly disabled, the viewport remains reachable
for arrow-key navigation. Native strips retain keyboard scrolling when their
content overflows, including one oversized item. Viewport fallback focus uses a
plain outline; focus never changes its corner radius or adds a shadow frame.

Inactive slideshow slides are inert and hidden from assistive technology in every
transition mode. Native strip items retain their authored accessibility state.
Focus moves to a navigation action before an active slide becomes inert; the
programmatic viewport fallback remains available when no actions exist.

## Optional autoplay

Autoplay is off by default. Enable it explicitly; `autoplayInterval` defaults to
5000 milliseconds and uses that value for non-finite or non-positive inputs.
`repeat` is independent and defaults to false. Non-repeating playback stops at the
last slide; an explicit `play()` request restarts completed playback at the first.

The built-in playback button precedes slide content in the tab order.
`autoplayBehavior="pauseOnInteraction"` is the default: focus, pointer/click
interaction and manual navigation pause until explicitly restarted; hover
suspends playback temporarily. `autoplayBehavior="continuous"` ignores those
interaction pauses, including keyboard navigation. Use `repeat` to keep rotating
after the last slide. This setting does not enable autoplay by itself.

Explicit `pause()` and the playback button always stop rotation, in either mode.
Document visibility and `autoplaySuspended` still temporarily suspend playback
without changing the button's requested action. Changing behavior does not undo
an explicit pause. External shared content must honor the same behavior instead
of unconditionally calling `pause()` or binding hover to `autoplaySuspended`.

Prefer the default for slides containing interactive content: continuous rotation
can move focus to navigation when the focused slide becomes inactive. Keep the
playback button accessible so visitors can stop motion before exploring a slide.

Reduced motion prevents automatic startup and auto-pauses when the preference
changes; a user can explicitly request playback. Fading and smooth scrolling
remain disabled while reduced motion is active.

`qAutoplayChange` reports `{ playing: boolean }` for actual rotation, including
suspension. The button label follows persistent run intent instead. Empty or
non-navigable content never runs a timer; requested/paused intent survives
same-instance content updates. `slideTo()` remains programmatic and does not
implicitly pause playback. `play()` and `pause()` return promises; timers and
listeners are cleaned up on disconnection.

<!-- Auto Generated Below -->


## Overview

A carousel with sliding, crossfade or instant transitions and shared navigation.

## Properties

| Property                   | Attribute                    | Description                                                                          | Type                                     | Default                |
| -------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------- |
| `ariaLabel`                | `aria-label`                 | Accessible name forwarded to the slide viewport.                                     | `string`                                 | `'Carousel content'`   |
| `autoplay`                 | `autoplay`                   | Enables rotation with the configured interaction behavior.                           | `boolean`                                | `false`                |
| `autoplayAdvanceSuspended` | `autoplay-advance-suspended` | Holds advancement for loading without pausing the active media.                      | `boolean`                                | `false`                |
| `autoplayBehavior`         | `autoplay-behavior`          | Continuous rotation ignores hover and interaction; explicit pause remains available. | `"continuous" \| "pauseOnInteraction"`   | `'pauseOnInteraction'` |
| `autoplayInterval`         | `autoplay-interval`          | Finite positive interval in milliseconds; invalid values use 5000.                   | `number`                                 | `5000`                 |
| `autoplaySuspended`        | `autoplay-suspended`         | Temporarily suspends requested playback without changing the button action.          | `boolean`                                | `false`                |
| `itemWidth`                | `item-width`                 | `auto` preserves each slotted item's natural width.                                  | `string`                                 | `'auto'`               |
| `layout`                   | `layout`                     | Slideshow provides full-width slides with no default viewport inset or gap.          | `"slideshow" \| "strip"`                 | `'strip'`              |
| `repeat`                   | `repeat`                     | Wraps arrow and programmatic navigation at either end.                               | `boolean`                                | `false`                |
| `rotationPlacement`        | `rotation-placement`         | Overlay keeps playback separate from the indicators/extra-controls panel.            | `"controls" \| "overlay"`                | `'controls'`           |
| `showArrows`               | `show-arrows`                | Omitted controls are enabled for navigable slideshows and disabled for strips.       | `boolean`                                | `undefined`            |
| `showIndicators`           | `show-indicators`            | Shows clickable slide indicator dots when the carousel can scroll.                   | `boolean`                                | `undefined`            |
| `slideTiming`              | `slide-timing`               | Finish-videos delegates each active visit's timing to setSlidePlayback().            | `"finishVideos" \| "fixedInterval"`      | `'fixedInterval'`      |
| `snapAlignment`            | `snap-alignment`             |                                                                                      | `"center" \| "end" \| "none" \| "start"` | `'start'`              |
| `transition`               | `transition`                 | Animation used when selecting a slide. Overlay modes show one full-width item.       | `"crossfade" \| "instant" \| "slide"`    | `'slide'`              |
| `transitionDuration`       | `transition-duration`        | Crossfade duration in milliseconds; native sliding keeps browser-controlled timing.  | `number`                                 | `500`                  |


## Events

| Event             | Description                                                                      | Type                                         |
| ----------------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| `qAutoplayChange` | Actual running state, including temporary suspension.                            | `CustomEvent<QCarouselAutoplayChangeDetail>` |
| `qPlaybackChange` | Playback intent and eligibility, independent of an image-readiness advance hold. | `CustomEvent<QCarouselPlaybackChangeDetail>` |
| `qSlideChange`    |                                                                                  | `CustomEvent<QCarouselSlideChangeDetail>`    |


## Methods

### `completeSlide(key: string) => Promise<void>`

Completes the registered visit; stale or duplicate media events are ignored.

#### Parameters

| Name  | Type     | Description |
| ----- | -------- | ----------- |
| `key` | `string` |             |

#### Returns

Type: `Promise<void>`



### `pause() => Promise<void>`

Stops rotation until play() or the playback control explicitly restarts it.

#### Returns

Type: `Promise<void>`



### `play() => Promise<void>`

Requests rotation when enabled; completed non-repeating playback restarts at the first slide.

#### Returns

Type: `Promise<void>`



### `setSlidePlayback(element: HTMLElement, key: string, mode: "interval" | "completion") => Promise<void>`

Registers timing for the current slide and responsive-media visit only.

#### Parameters

| Name      | Type                         | Description |
| --------- | ---------------------------- | ----------- |
| `element` | `HTMLElement`                |             |
| `key`     | `string`                     |             |
| `mode`    | `"interval" \| "completion"` |             |

#### Returns

Type: `Promise<void>`



### `slideTo(index: number) => Promise<void>`

Scrolls the carousel to a zero-based slide index.

#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `index` | `number` |             |

#### Returns

Type: `Promise<void>`



### `updateLimits() => Promise<void>`

Recalculates slide offsets, scroll bounds, and navigation states.

#### Returns

Type: `Promise<void>`




## Slots

| Slot               | Description                                    |
| ------------------ | ---------------------------------------------- |
|                    | Carousel slide content.                        |
| `"controls-extra"` | Additional content below the slide indicators. |


## Shadow Parts

| Part                | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `"controls"`        | Container shared by indicators and additional controls. |
| `"indicator"`       | Each slide indicator button.                            |
| `"next-button"`     | Next slide control.                                     |
| `"previous-button"` | Previous slide control.                                 |
| `"rotation-button"` | Playback intent control.                                |
| `"viewport"`        | Slide viewport.                                         |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
