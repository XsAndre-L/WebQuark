/** Native color inputs represent opaque RGB. Keep other CSS values in the text editor. */
export function convertToHex(value: string): string | null {
  const color = value.trim();
  if (/^#[a-f0-9]{6}$/i.test(color)) return color;
  if (/^#[a-f0-9]{3}$/i.test(color)) return '#' + [...color.slice(1)].map(channel => channel + channel).join('');
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (!rgb) return null;
  const channels = rgb.slice(1).map(Number);
  return channels.every(channel => channel <= 255)
    ? '#' + channels.map(channel => channel.toString(16).padStart(2, '0')).join('')
    : null;
}
