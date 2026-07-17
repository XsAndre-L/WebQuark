import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

/**
 * Controlled pagination for client-side or server-side collections.
 * Consumers own the current page and update `page` after `qPageChange`.
 * @part container - Outer pagination navigation.
 * @part summary - Visible item-range summary.
 * @part controls - Previous/page-count/next control group.
 * @part previous-button - Native previous-page button.
 * @part page-count - Current page and total page count.
 * @part next-button - Native next-page button.
 */
@Component({
  tag: 'q-pagination',
  styleUrl: 'pagination.css',
  shadow: true,
})
export class QPagination {
  // ======== [1] STENCIL API (Props, Events, AttachInternals, Elements) =========

  /** One-based current page. Out-of-range values are clamped for display and emitted navigation. */
  @Prop() page: number = 1;

  /** Number of items per page. Non-positive or non-finite values fall back to 1. */
  @Prop({ attribute: 'page-size' }) pageSize: number = 10;

  /** Total number of items in the collection. Negative or non-finite values are treated as zero. */
  @Prop({ attribute: 'total-items' }) totalItems: number = 0;

  /** Noun used in the visible range summary, for example "users" or "templates". */
  @Prop({ attribute: 'item-label' }) itemLabel: string = 'items';

  /** Accessible name for the pagination navigation landmark. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'Pagination';

  /** Hides the item-range summary while retaining the page controls. */
  @Prop({ attribute: 'show-summary' }) showSummary: boolean = true;

  /** Disables both navigation buttons. */
  @Prop({ reflect: true }) disabled: boolean = false;

  /** Emitted with a requested one-based page. The component does not mutate `page`. */
  @Event() qPageChange!: EventEmitter<number>;

  // =================== [5] EVENT HANDLERS & INTERNAL METHODS ===================

  private get normalizedPageSize(): number {
    return positiveInteger(this.pageSize, 1);
  }

  private get normalizedTotalItems(): number {
    return nonNegativeInteger(this.totalItems);
  }

  private get pageCount(): number {
    return Math.max(
      1,
      Math.ceil(this.normalizedTotalItems / this.normalizedPageSize),
    );
  }

  private get currentPage(): number {
    return Math.min(positiveInteger(this.page, 1), this.pageCount);
  }

  private requestPage(page: number): void {
    const requestedPage = Math.min(Math.max(page, 1), this.pageCount);

    if (!this.disabled && requestedPage !== this.currentPage) {
      this.qPageChange.emit(requestedPage);
    }
  }

  // ===================== [6] RENDER (Visual Template Only) =====================

  render() {
    const page = this.currentPage;
    const pageCount = this.pageCount;
    const totalItems = this.normalizedTotalItems;
    const pageSize = this.normalizedPageSize;
    const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = Math.min(page * pageSize, totalItems);
    const itemLabel = this.itemLabel.trim() || 'items';
    const previousDisabled = this.disabled || totalItems === 0 || page <= 1;
    const nextDisabled = this.disabled || totalItems === 0 || page >= pageCount;

    return (
      <nav
        class="pagination"
        part="container"
        aria-label={this.ariaLabel.trim() || 'Pagination'}
      >
        {this.showSummary && (
          <span class="summary" part="summary" aria-live="polite">
            Showing {pageStart}-{pageEnd} of {totalItems} {itemLabel}
          </span>
        )}

        <div class="controls" part="controls">
          <button
            class="page-button"
            part="previous-button"
            type="button"
            disabled={previousDisabled}
            aria-label="Previous page"
            onClick={() => this.requestPage(page - 1)}
          >
            Previous
          </button>
          <span
            class="page-count"
            part="page-count"
            aria-label={`Page ${page} of ${pageCount}`}
          >
            {page} / {pageCount}
          </span>
          <button
            class="page-button"
            part="next-button"
            type="button"
            disabled={nextDisabled}
            aria-label="Next page"
            onClick={() => this.requestPage(page + 1)}
          >
            Next
          </button>
        </div>
      </nav>
    );
  }
}

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
