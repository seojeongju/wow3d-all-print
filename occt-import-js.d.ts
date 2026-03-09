declare module 'occt-import-js' {
  type InitArg = { locateFile?: (path: string) => string }
  type OcctModule = { ReadStepFile: (buffer: Uint8Array, params: unknown) => { meshes?: unknown[] } }
  const init: (arg?: InitArg) => Promise<OcctModule>
  export default init
}
