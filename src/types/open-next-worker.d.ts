declare module '*.open-next/worker.js' {
  const worker: ExportedHandler<CloudflareEnv>
  export default worker
}
