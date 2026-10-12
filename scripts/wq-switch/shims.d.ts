declare module 'cmd-shim' {
  export default function cmdShim(from: string, to: string): Promise<void>;
}
declare module 'read-cmd-shim' {
  const readCmdShim: { sync(file: string): string };
  export default readCmdShim;
}
