import {
  DEFAULT_PROP_ORDER_CONFIG as order,
  type PropGroup,
} from '../../../../scripts/component-prop-order/config';

const categoryLabels: Record<PropGroup | 'other', string> = {
  'content-data': 'Content & data',
  'style-layout': 'Style & layout',
  behavior: 'Behavior',
  settings: 'Settings',
  state: 'State',
  validation: 'Validation',
  'html-integrations': 'HTML & integrations',
  accessibility: 'Accessibility',
  other: 'Other',
};

const defaultGroups = new Map(
  order.classifications.flatMap(({ group, props }) => props.map(prop => [prop, group] as const)),
);

export function getPropertySections(tag: string, propertyNames: string[]) {
  const groups = new Map(defaultGroups);
  for (const override of order.overrides) {
    if (override.scope === tag) groups.set(override.prop, override.group);
  }
  const clusters = order.clusters.filter(cluster => cluster.scope === tag);

  function categorize(names: string[]) {
    const remaining = new Set(names);
    const categories = new Map<PropGroup | 'other', string[]>();
    for (const group of order.groups) categories.set(group, []);
    categories.set('other', []);

    for (const name of names) {
      if (!remaining.has(name)) continue;
      const related = clusters.find(cluster => cluster.props.includes(name))?.props ?? [name];
      const group = groups.get(related[0]) ?? 'other';
      const members = related.filter(prop => remaining.delete(prop));
      categories.get(group)!.push(...members);
    }

    return Array.from(categories)
      .filter(([, props]) => props.length > 0)
      .map(([group, props]) => ({ label: categoryLabels[group], props }));
  }

  const remaining = new Set(propertyNames);
  const sections: { name?: string; categories: ReturnType<typeof categorize> }[] = [];
  const namedSections = order.namedSections.find(section => section.scope === tag);
  for (const section of namedSections?.sections ?? []) {
    const properties = section.props.filter(prop => remaining.delete(prop));
    if (properties.length) sections.push({ name: section.name, categories: categorize(properties) });
  }
  if (remaining.size) sections.push({ categories: categorize([...remaining]) });
  return sections;
}
