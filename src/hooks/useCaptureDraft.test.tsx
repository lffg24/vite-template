import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCaptureDraft } from "./useCaptureDraft";
import { DRAFT_PREFIX, clearCaptureDrafts, readCaptureDraft, writeCaptureDraft } from "@/lib/captureDraft";
const key = `${DRAFT_PREFIX}t:u:e:a:i`;
const base = { answers: {} };
const changed = { answers: { 1: "Siempre" } };
beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

it("flushes the last edit before session exit, even before debounce", () => {
  const { result, rerender, unmount } = renderHook(({ value }) => useCaptureDraft(key, value), { initialProps: { value: base } });
  act(() => { result.current.restore(key, base); });
  rerender({ value: changed });
  act(() => { window.dispatchEvent(new Event("abril360:before-session-exit")); });
  expect(readCaptureDraft(key, base)).toEqual(changed);
  unmount();
});
it("does not copy previous answers into an instrument still loading", () => {
  const { result, rerender, unmount } = renderHook(({ scope, value }) => useCaptureDraft(scope, value), { initialProps: { scope: key, value: base } });
  act(() => { result.current.restore(key, base); });
  rerender({ scope: `${key}:next`, value: changed });
  act(() => { vi.advanceTimersByTime(500); });
  expect(readCaptureDraft(`${key}:next`, base)).toBeNull();
  unmount();
});
it("does not recreate a draft after save or explicit logout", () => {
  const { result, rerender, unmount } = renderHook(({ value }) => useCaptureDraft(key, value), { initialProps: { value: base } });
  act(() => { result.current.restore(key, base); });
  rerender({ value: changed });
  act(() => { result.current.acknowledge(key, changed); vi.advanceTimersByTime(500); });
  expect(sessionStorage.getItem(key)).toBeNull();
  rerender({ value: { answers: { 2: "Nunca" } } });
  act(() => { window.dispatchEvent(new Event("abril360:explicit-logout")); clearCaptureDrafts(); });
  unmount();
  expect(sessionStorage.getItem(key)).toBeNull();
});
it("discards the local draft for a finalized instrument", () => {
  writeCaptureDraft(key, base, changed);
  const { result, unmount } = renderHook(() => useCaptureDraft(key, changed));
  act(() => { expect(result.current.restore(key, base, true)).toEqual(base); vi.advanceTimersByTime(500); });
  expect(sessionStorage.getItem(key)).toBeNull();
  unmount();
});
