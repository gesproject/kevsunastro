// Shared promise that resolves once Hero has loaded its frames and called
// ScrollTrigger.refresh(). Music and Shows await this before registering
// their own pinned ScrollTriggers so pin offsets are calculated against
// the final layout — not a layout that is still mid-load.

let resolve: () => void;

const promise: Promise<void> = new Promise<void>((res) => {
  resolve = res;
});

export function resolveHeroReady(): void {
  resolve();
}

export function waitForHeroReady(): Promise<void> {
  return promise;
}
