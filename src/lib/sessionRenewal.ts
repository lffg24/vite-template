// Renewal is bounded by server policy and only runs after user activity.
export function startSessionRenewal(seconds: number, renew: () => Promise<void>) {
  const interval = Math.max(30_000, seconds * 1000);
  let nextAttempt = Date.now() + interval;
  let failures = 0;
  let active = false;
  let pending = false;
  let stopped = false;
  const tick = () => {
    if (stopped || pending || !active || document.visibilityState === "hidden" || Date.now() < nextAttempt) return;
    nextAttempt = Date.now() + interval;
    active = false;
    pending = true;
    void renew().then(() => { failures = 0; }).catch(() => {
      active = true;
      failures += 1;
      if (failures <= 2) nextAttempt = Date.now() + Math.min(60_000, interval);
    }).finally(() => { pending = false; });
  };
  const activity = () => { active = true; tick(); };
  const events = ["pointerdown", "keydown", "input"] as const;
  events.forEach((event) => window.addEventListener(event, activity, { passive: true }));
  document.addEventListener("visibilitychange", tick);
  const timer = window.setInterval(tick, Math.min(interval, 60_000));
  return () => {
    stopped = true;
    window.clearInterval(timer);
    events.forEach((event) => window.removeEventListener(event, activity));
    document.removeEventListener("visibilitychange", tick);
  };
}
