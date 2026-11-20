export function loadFormatter(language: string): Promise<(code: string) => Promise<string>>;
export function formatSource(code: string, language: string): Promise<string>;
