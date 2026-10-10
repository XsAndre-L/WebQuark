import { Component, Event, EventEmitter, h, Prop, State, Watch } from '@stencil/core';
import { calculateImageCropGeometry, hasPartialImageCrop, isImageCropValid, type ImageCrop, type ImageCropBox } from '../../../utils/image-crop';

/**
 * Compare independently framed images by revealing Before from the left.
 * @part after-image - Complete After image, uniformly scaled inside its viewport.
 * @part before-image - Complete Before image, uniformly scaled inside its viewport.
 * @part after-layer - Full-frame After layer.
 * @part before-layer - Full-frame Before reveal plane.
 * @part after-viewport - Centered clip for the selected After region.
 * @part before-viewport - Centered clip for the selected Before region.
 */
@Component({ tag: 'q-image-comparison', styleUrl: 'image-comparison.css', shadow: true })
export class QImageComparison {
  /** Source of the image revealed on the left. */
  @Prop() beforeSrc: string = '';
  /** Source of the image revealed on the right. */
  @Prop() afterSrc: string = '';
  /** Caption for the left image. */
  @Prop() beforeLabel: string = 'Before';
  /** Caption for the right image. */
  @Prop() afterLabel: string = 'After';

  /** Source-percentage rectangle selected from Before; omitted means the full image. */
  @Prop() beforeCrop?: ImageCrop;
  /** Source-percentage rectangle selected from After; omitted means the full image. */
  @Prop() afterCrop?: ImageCrop;
  /** Positive frame width / height ratio. Omitted derives from partial After, then Before, otherwise 16 / 9; invalid values use 16 / 9. */
  @Prop() aspectRatio?: number;

  /** Percentage of Before revealed, clamped to 0–100. */
  @Prop({ mutable: true }) position: number = 50;

  /** Accessible description of the Before image. */
  @Prop() beforeAlt: string = '';
  /** Accessible description of the After image. */
  @Prop() afterAlt: string = '';
  /** Accessible name of the comparison control. */
  @Prop() ariaLabel: string = 'Image comparison';

  /** Emits the numeric reveal percentage continuously for user changes only. */
  @Event() qChange: EventEmitter<number>;

  @State() private beforeStatus: 'loading' | 'loaded' | 'error' = 'loading';
  @State() private afterStatus: 'loading' | 'loaded' | 'error' = 'loading';
  @State() private beforeDimensions?: { width: number; height: number };
  @State() private afterDimensions?: { width: number; height: number };
  private generation = 0;
  private frame?: HTMLDivElement;
  private range?: HTMLInputElement;
  private pointer?: { id: number; x: number; y: number; pending: boolean };

  componentWillLoad() {
    this.normalizePosition();
  }

  @Watch('position')
  normalizePosition() {
    const next = Number.isFinite(this.position) ? Math.max(0, Math.min(100, this.position)) : 50;
    if (next !== this.position) this.position = next;
  }

  @Watch('beforeSrc')
  @Watch('afterSrc')
  resetImages() {
    this.generation++;
    this.beforeStatus = 'loading';
    this.afterStatus = 'loading';
    this.beforeDimensions = undefined;
    this.afterDimensions = undefined;
    this.endPointer();
  }

  @Watch('beforeCrop')
  @Watch('afterCrop')
  @Watch('aspectRatio')
  resetGesture() {
    this.endPointer();
  }

  disconnectedCallback() {
    this.endPointer();
  }

  private get ready() {
    return !!this.beforeSrc && !!this.afterSrc
      && this.beforeStatus === 'loaded' && this.afterStatus === 'loaded'
      && !this.cropUnavailable;
  }

  private get cropUnavailable() {
    return (this.beforeCrop !== undefined && (!isImageCropValid(this.beforeCrop)
      || (this.beforeStatus === 'loaded' && !this.beforeDimensions)))
      || (this.afterCrop !== undefined && (!isImageCropValid(this.afterCrop)
        || (this.afterStatus === 'loaded' && !this.afterDimensions)));
  }

  private get frameRatio() {
    if (this.aspectRatio !== undefined) return Number.isFinite(this.aspectRatio) && this.aspectRatio > 0 ? this.aspectRatio : 16 / 9;
    const afterPartial = hasPartialImageCrop(this.afterCrop);
    const crop = afterPartial ? this.afterCrop : this.beforeCrop;
    const dimensions = afterPartial ? this.afterDimensions : this.beforeDimensions;
    return hasPartialImageCrop(crop) && dimensions
      ? calculateImageCropGeometry(dimensions.width, dimensions.height, crop)?.aspectRatio ?? 16 / 9
      : 16 / 9;
  }

  private imageResult(side: 'before' | 'after', generation: number, source: string, loaded: boolean, image?: HTMLImageElement) {
    if (generation !== this.generation || source !== (side === 'before' ? this.beforeSrc : this.afterSrc)) return;
    const dimensions = loaded && image && Number.isFinite(image.naturalWidth) && image.naturalWidth > 0
      && Number.isFinite(image.naturalHeight) && image.naturalHeight > 0
      ? { width: image.naturalWidth, height: image.naturalHeight } : undefined;
    if (side === 'before') {
      this.beforeDimensions = dimensions;
      this.beforeStatus = loaded ? 'loaded' : 'error';
    } else {
      this.afterDimensions = dimensions;
      this.afterStatus = loaded ? 'loaded' : 'error';
    }
    if (!loaded) this.endPointer();
  }

  private updatePosition(value: number) {
    if (!this.ready || !Number.isFinite(value)) return;
    const next = Math.max(0, Math.min(100, value));
    if (next === this.position) return;
    this.position = next;
    this.qChange.emit(next);
  }

  private moveTo(clientX: number) {
    const rect = this.frame!.getBoundingClientRect();
    if (rect.width > 0) this.updatePosition((clientX - rect.left) / rect.width * 100);
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (!this.ready || this.pointer || !event.isPrimary || event.button !== 0) return;
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, pending: event.pointerType === 'touch' };
    if (!this.pointer.pending) {
      this.range?.focus({ preventScroll: true });
      this.frame?.setPointerCapture(event.pointerId);
      this.moveTo(event.clientX);
      event.preventDefault();
    }
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.pointer || this.pointer.id !== event.pointerId) return;
    if (this.pointer.pending) {
      const x = Math.abs(event.clientX - this.pointer.x);
      const y = Math.abs(event.clientY - this.pointer.y);
      if (Math.max(x, y) < 8) return;
      if (y >= x) {
        this.endPointer();
        return;
      }
      this.pointer.pending = false;
      this.range?.focus({ preventScroll: true });
      this.frame?.setPointerCapture(event.pointerId);
    }
    this.moveTo(event.clientX);
  };

  private handlePointerEnd = (event: PointerEvent) => {
    if (this.pointer?.id === event.pointerId) this.endPointer();
  };

  private endPointer() {
    const id = this.pointer?.id;
    this.pointer = undefined;
    if (id !== undefined && this.frame?.hasPointerCapture(id)) this.frame.releasePointerCapture(id);
  }

  private boxStyle(box?: ImageCropBox) {
    return box && { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` };
  }

  private renderImage(side: 'before' | 'after', source: string, generation: number, ratio: number) {
    if (!source) return null;
    const crop = side === 'before' ? this.beforeCrop : this.afterCrop;
    const dimensions = side === 'before' ? this.beforeDimensions : this.afterDimensions;
    const geometry = hasPartialImageCrop(crop) && dimensions
      ? calculateImageCropGeometry(dimensions.width, dimensions.height, crop, ratio) : undefined;
    return (
      <div part={`${side}-layer`} class={{ layer: true, before: side === 'before' }}
        style={side === 'before' ? { clipPath: `inset(0 ${100 - this.position}% 0 0)` } : undefined}>
        <div part={`${side}-viewport`} class="viewport" style={this.boxStyle(geometry?.viewport)}>
          <img
            key={`${side}-${generation}`}
            part={`${side}-image`}
            class={{ image: true, cropped: !!geometry }}
            style={this.boxStyle(geometry?.image)}
            src={source}
            alt={side === 'before' ? this.beforeAlt : this.afterAlt}
            draggable={false}
            onLoad={event => this.imageResult(side, generation, source, true, event.currentTarget as HTMLImageElement)}
            onError={() => this.imageResult(side, generation, source, false)}
          />
        </div>
      </div>
    );
  }

  render() {
    const generation = this.generation;
    const beforeSrc = this.beforeSrc;
    const afterSrc = this.afterSrc;
    const ratio = this.frameRatio;
    const failed = !beforeSrc || !afterSrc || this.beforeStatus === 'error' || this.afterStatus === 'error' || this.cropUnavailable;
    return (
      <div
        part="frame"
        class={{ frame: true, ready: this.ready }}
        style={{ aspectRatio: String(ratio) }}
        ref={el => this.frame = el}
        onPointerDown={this.handlePointerDown}
        onPointerMove={this.handlePointerMove}
        onPointerUp={this.handlePointerEnd}
        onPointerCancel={this.handlePointerEnd}
        onLostPointerCapture={this.handlePointerEnd}
      >
        {this.renderImage('after', afterSrc, generation, ratio)}
        {this.renderImage('before', beforeSrc, generation, ratio)}
        {!this.ready && (
          <div part="status" class="status" role="status">
            {failed ? 'Comparison unavailable' : 'Loading images…'}
          </div>
        )}
        {this.ready && (
          <div class="decorations" aria-hidden="true">
            <span part="before-label" class="label before-label">{this.beforeLabel}</span>
            <span part="after-label" class="label after-label">{this.afterLabel}</span>
            <div part="divider" class="divider" style={{ left: `${this.position}%` }}>
              <span part="handle" class="handle">↔</span>
            </div>
          </div>
        )}
        <input
          part="control"
          class="control"
          ref={el => this.range = el}
          type="range"
          min="0"
          max="100"
          step="1"
          value={this.position}
          disabled={!this.ready}
          aria-label={this.ariaLabel || 'Image comparison'}
          aria-valuetext={`${Math.round(this.position)}% ${this.beforeLabel || 'Before'} revealed`}
          onInput={event => this.updatePosition(Number((event.target as HTMLInputElement).value))}
        />
      </div>
    );
  }
}
