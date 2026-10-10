import {
  AfterContentInit,
  ContentChildren,
  Directive,
  DoCheck,
  ElementRef,
  EmbeddedViewRef,
  Input,
  OnDestroy,
  QueryList,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {
  getDataTableCellSlotName,
  getDataTableCellValue,
  getDataTableItemKey,
  identifyItems,
  reconcileByIdentity,
  type DataTableCellContext,
  type TableColumn,
} from '@webquark/browser';

export interface QDataTableCellContext<T = any> extends DataTableCellContext<T> {
  $implicit: T;
}

@Directive({
  selector: 'ng-template[qTableCell]',
  standalone: true,
})
export class QDataTableCellDef<T = any> {
  @Input() qTableCell = '';

  constructor(
    readonly templateRef: TemplateRef<QDataTableCellContext<T>>,
    readonly viewContainer: ViewContainerRef,
  ) {}

  static ngTemplateContextGuard<T>(
    _directive: QDataTableCellDef<T>,
    context: unknown,
  ): context is QDataTableCellContext<T> {
    return true;
  }
}

@Directive({
  selector: 'q-data-table',
  standalone: true,
})
export class QDataTableCellOutlet implements AfterContentInit, DoCheck, OnDestroy {
  @ContentChildren(QDataTableCellDef, { descendants: true })
  private cellDefinitions!: QueryList<QDataTableCellDef>;

  private readonly host: QDataTableHost;
  private renderedCells = new Map<string, RenderedAngularCell>();
  private definitionsSubscription?: { unsubscribe(): void };
  private contentInitialized = false;
  private lastItems: unknown;
  private lastColumns: unknown;
  private lastKeyField?: string;
  private lastDefinitions = '';

  constructor(elementRef: ElementRef<QDataTableHost>) {
    this.host = elementRef.nativeElement;
  }

  ngAfterContentInit(): void {
    this.contentInitialized = true;
    this.definitionsSubscription = this.cellDefinitions.changes.subscribe(() => {
      this.lastDefinitions = '';
      this.syncCells();
    });
    this.syncCells();
  }

  ngDoCheck(): void {
    if (this.contentInitialized) {
      this.syncCells();
    }
  }

  ngOnDestroy(): void {
    this.definitionsSubscription?.unsubscribe();
    this.destroyAllCells();
  }

  private syncCells(): void {
    const items = this.host.items;
    const columns = this.host.columns;
    const keyField = this.host.keyField || 'id';
    const definitions = this.definitionSignature();

    if (
      items === this.lastItems &&
      columns === this.lastColumns &&
      keyField === this.lastKeyField &&
      definitions === this.lastDefinitions
    ) {
      return;
    }

    this.lastItems = items;
    this.lastColumns = columns;
    this.lastKeyField = keyField;
    this.lastDefinitions = definitions;
    this.reconcileCells(parseArray(items), parseColumns(columns), keyField);
  }

  private reconcileCells(items: unknown[], columns: TableColumn[], keyField: string): void {
    const cells = this.getCellDescriptors(items, columns, keyField);
    const result = reconcileByIdentity({
      current: this.renderedCells,
      incoming: cells,
      identify: cell => cell.slotName,
      warningContext: 'q-data-table Angular rich cells',
      create: cell => this.createCell(cell),
      update: (renderedCell, cell) => this.updateCell(renderedCell, cell),
      remove: renderedCell => this.destroyCell(renderedCell),
    });

    this.renderedCells = result.byIdentity;
  }

  private getCellDescriptors(
    items: unknown[],
    columns: TableColumn[],
    keyField: string,
  ): AngularCellDescriptor[] {
    const definitions = this.getDefinitionsByColumn();
    const identifiedColumns = identifyItems(
      columns,
      column => column.key,
      { warningContext: 'q-data-table Angular columns' },
    );
    const identifiedRows = identifyItems(
      items,
      (row, rowIndex) =>
        getDataTableItemKey(row, rowIndex, keyField),
      { warningContext: 'q-data-table Angular rows' },
    );
    const cells: AngularCellDescriptor[] = [];

    for (const columnEntry of identifiedColumns) {
      const column = columnEntry.item;
      const definition = definitions.get(column.key);
      if (!definition) continue;

      for (const rowEntry of identifiedRows) {
        const row = rowEntry.item;
        const rowIndex = rowEntry.index;

        cells.push({
          definition,
          slotName: getDataTableCellSlotName(
            columnEntry.identity,
            rowEntry.identity,
          ),
          column,
          columnKey: column.key,
          context: {
            $implicit: row,
            row,
            value: getDataTableCellValue(row, column.key),
            rowIndex,
            column,
          },
        });
      }
    }

    return cells;
  }

  private getDefinitionsByColumn(): Map<string, QDataTableCellDef> {
    const definitions = Array.from(this.cellDefinitions).filter(
      definition => definition.qTableCell.trim().length > 0,
    );
    const identifiedDefinitions = identifyItems(
      definitions,
      definition => definition.qTableCell.trim(),
      { warningContext: 'q-data-table Angular cell definitions' },
    );
    const definitionsByColumn = new Map<string, QDataTableCellDef>();

    for (const entry of identifiedDefinitions) {
      if (!entry.usesFallback) {
        definitionsByColumn.set(entry.item.qTableCell.trim(), entry.item);
      }
    }

    return definitionsByColumn;
  }

  private createCell(cell: AngularCellDescriptor): RenderedAngularCell {
    const wrapper = this.host.ownerDocument.createElement('span');
    const view = cell.definition.viewContainer.createEmbeddedView(
      cell.definition.templateRef,
      cell.context,
    );

    this.updateWrapper(wrapper, cell);
    this.attachViewNodes(wrapper, view);
    this.host.appendChild(wrapper);

    return {
      definition: cell.definition,
      view,
      wrapper,
    };
  }

  private updateCell(
    renderedCell: RenderedAngularCell,
    cell: AngularCellDescriptor,
  ): void {
    if (renderedCell.definition !== cell.definition) {
      this.destroyView(renderedCell.view);
      renderedCell.wrapper.replaceChildren();
      renderedCell.view =
        cell.definition.viewContainer.createEmbeddedView(
          cell.definition.templateRef,
          cell.context,
        );
      renderedCell.definition = cell.definition;
      this.attachViewNodes(renderedCell.wrapper, renderedCell.view);
    } else {
      Object.assign(renderedCell.view.context, cell.context);
      renderedCell.view.detectChanges();
    }

    this.updateWrapper(renderedCell.wrapper, cell);
  }

  private updateWrapper(
    wrapper: HTMLSpanElement,
    cell: AngularCellDescriptor,
  ): void {
    wrapper.setAttribute('slot', cell.slotName);
    wrapper.dataset.qDataTableCell = cell.columnKey;
    wrapper.style.display = 'contents';
  }

  private attachViewNodes(
    wrapper: HTMLSpanElement,
    view: EmbeddedViewRef<QDataTableCellContext>,
  ): void {
    for (const node of view.rootNodes) {
      wrapper.appendChild(node);
    }
  }

  private destroyCell(cell: RenderedAngularCell): void {
    this.destroyView(cell.view);
    cell.wrapper.remove();
  }

  private destroyView(
    view: EmbeddedViewRef<QDataTableCellContext>,
  ): void {
    if (!view.destroyed) {
      view.destroy();
    }
  }

  private destroyAllCells(): void {
    for (const cell of this.renderedCells.values()) {
      this.destroyCell(cell);
    }
    this.renderedCells.clear();
  }

  private definitionSignature(): string {
    return this.cellDefinitions.map(definition => definition.qTableCell).join('|');
  }
}

interface QDataTableHost extends HTMLElement {
  items?: unknown[] | string;
  columns?: TableColumn[] | string;
  keyField?: string;
}

interface RenderedAngularCell {
  definition: QDataTableCellDef;
  view: EmbeddedViewRef<QDataTableCellContext>;
  wrapper: HTMLSpanElement;
}

interface AngularCellDescriptor {
  definition: QDataTableCellDef;
  slotName: string;
  column: TableColumn;
  columnKey: string;
  context: QDataTableCellContext;
}

function parseArray(value: unknown[] | string | undefined): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseColumns(value: TableColumn[] | string | undefined): TableColumn[] {
  return parseArray(value) as TableColumn[];
}
