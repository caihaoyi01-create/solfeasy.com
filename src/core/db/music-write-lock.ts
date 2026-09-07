// Keep local SQLite writes from synchronously waiting for a transaction whose
// next awaited operation still needs the JavaScript event loop. Database
// transactions remain responsible for atomicity across separate server workers.
let musicWriteQueue: Promise<void> = Promise.resolve();
export function withMusicWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = musicWriteQueue.then(operation, operation);
  musicWriteQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
