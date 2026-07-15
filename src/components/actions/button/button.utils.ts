export interface ButtonAccessibleNameState {
  ariaLabel?: string | null;
  iconOnly?: boolean;
  hasVisibleText: boolean;
  hasIcon: boolean;
  hasWarned?: boolean;
}

export function shouldWarnForMissingButtonAccessibleName(state: ButtonAccessibleNameState): boolean {
  if (state.hasWarned) return false;
  if (state.ariaLabel?.trim()) return false;
  if (state.iconOnly === true) return true;
  return !state.hasVisibleText && state.hasIcon;
}
