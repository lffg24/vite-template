import { afterEach, describe, expect, it, vi } from "vitest";
import { startSessionRenewal } from "./sessionRenewal";
describe("activity-based renewal", () => {
  afterEach(() => vi.useRealTimers());
  it("does not poll the server while idle and batches activity", async () => {
    vi.useFakeTimers();
    const renew = vi.fn().mockResolvedValue(undefined);
    const stop = startSessionRenewal(1800, renew);
    await vi.advanceTimersByTimeAsync(3600_000);
    expect(renew).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("input"));
    for (let i = 0; i < 200; i++) window.dispatchEvent(new Event("keydown"));
    expect(renew).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1800_000);
    expect(renew).toHaveBeenCalledTimes(2);
    stop();
    window.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(3600_000);
    expect(renew).toHaveBeenCalledTimes(2);
  });
  it("retries a temporary outage twice without a request storm", async () => {
    vi.useFakeTimers();
    const renew = vi.fn().mockRejectedValue(new Error("offline"));
    const stop = startSessionRenewal(1800, renew);
    window.dispatchEvent(new Event("input"));
    await vi.advanceTimersByTimeAsync(1800_000);
    expect(renew).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(renew).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(renew).toHaveBeenCalledTimes(3);
    stop();
  });
});
