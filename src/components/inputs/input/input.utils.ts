export function hasAssignedSlotContent(slot: HTMLSlotElement): boolean {
  return slot.assignedNodes({ flatten: true }).length > 0;
}
