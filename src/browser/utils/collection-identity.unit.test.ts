import { describe, expect, it, vi } from 'vitest';
import {
  identifyItems,
  reconcileByIdentity,
  type CollectionIdentity,
  type CollectionIdentityWarning,
} from './collection-identity';

interface TestItem {
  id: CollectionIdentity;
  label: string;
}

interface TestResource {
  id: CollectionIdentity;
  label: string;
}

describe('Collection Identity', () => {
  it('creates stable, type-safe keys without mutating the input', () => {
    const stringItem: TestItem = { id: '1', label: 'String' };
    const numberItem: TestItem = { id: 1, label: 'Number' };
    const items = [stringItem, numberItem] as const;

    const result = identifyItems(items, item => item.id);

    expect(result.map(entry => entry.key)).toEqual(['string:1', 'number:1']);
    expect(result.map(entry => entry.item)).toEqual(items);
    expect(result[0].item).toBe(stringItem);
    expect(result[1].item).toBe(numberItem);
    expect(items).toEqual([stringItem, numberItem]);
  });

  it('warns and assigns unique fallback keys to invalid and duplicate identities', () => {
    const warnings: CollectionIdentityWarning[] = [];
    const items = [
      { id: 'same' },
      { id: 'same' },
      { id: null },
      { id: { nested: true } },
    ];

    const result = identifyItems(
      items,
      item => item.id as unknown as CollectionIdentity,
      { onWarning: warning => warnings.push(warning) },
    );

    expect(result.map(entry => entry.key)).toEqual([
      'string:same',
      'fallback:1',
      'fallback:2',
      'fallback:3',
    ]);
    expect(new Set(result.map(entry => entry.key)).size).toBe(items.length);
    expect(warnings.map(warning => warning.code)).toEqual([
      'duplicate-identity',
      'missing-identity',
      'invalid-identity',
    ]);
  });

  it('reuses, updates, creates, removes, and reorders resources by identity', () => {
    const create = vi.fn(
      (item: TestItem): TestResource => ({
        id: item.id,
        label: item.label,
      }),
    );
    const update = vi.fn(
      (resource: TestResource, item: TestItem): void => {
        resource.label = item.label;
      },
    );
    const remove = vi.fn();

    const first = reconcileByIdentity<TestItem, TestResource>({
      current: new Map(),
      incoming: [
        { id: 'A', label: 'Alpha' },
        { id: 'B', label: 'Bravo' },
        { id: 'C', label: 'Charlie' },
      ],
      identify: item => item.id,
      create,
      update,
      remove,
    });

    const resourceA = first.byIdentity.get('string:A');
    const resourceC = first.byIdentity.get('string:C');
    create.mockClear();
    update.mockClear();
    remove.mockClear();

    const second = reconcileByIdentity<TestItem, TestResource>({
      current: first.byIdentity,
      incoming: [
        { id: 'C', label: 'Charlie updated' },
        { id: 'A', label: 'Alpha' },
        { id: 'D', label: 'Delta' },
      ],
      identify: item => item.id,
      create,
      update,
      remove,
    });

    expect(second.ordered[0]).toBe(resourceC);
    expect(second.ordered[1]).toBe(resourceA);
    expect(second.ordered.map(resource => resource.id)).toEqual([
      'C',
      'A',
      'D',
    ]);
    expect(resourceC?.label).toBe('Charlie updated');
    expect(create).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledOnce();
    expect(remove.mock.calls[0][1]).toBe('string:B');
    expect(first.byIdentity.has('string:B')).toBe(true);
  });

  it('does not recreate an unchanged identity', () => {
    const resource = { id: 7, label: 'Before' };
    const create = vi.fn();
    const update = vi.fn(
      (current: TestResource, item: TestItem): void => {
        current.label = item.label;
      },
    );

    const result = reconcileByIdentity<TestItem, TestResource>({
      current: new Map([['number:7', resource]]),
      incoming: [{ id: 7, label: 'After' }],
      identify: item => item.id,
      create,
      update,
    });

    expect(result.ordered[0]).toBe(resource);
    expect(resource.label).toBe('After');
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnce();
  });
});
