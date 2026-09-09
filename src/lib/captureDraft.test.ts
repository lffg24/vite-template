import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { clearCaptureDrafts, DRAFT_PREFIX, readCaptureDraft, writeCaptureDraft } from "./captureDraft";
const baseline = { answers: {}, conditionalAnswers: {}, observaciones: "" };
const value = { ...baseline, answers: { 1: "Siempre" } };
const key = `${DRAFT_PREFIX}tenant:user:employee:app:instrument`;
describe("temporary capture drafts", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.useRealTimers());
  it("recovers exact answers only in the same user and instrument scope", () => {
    writeCaptureDraft(key, baseline, value);
    expect(readCaptureDraft(key, baseline)).toEqual(value);
    expect(readCaptureDraft(`${key}:another-user`, baseline)).toBeNull();
  });
  it("does not override newer server data", () => {
    writeCaptureDraft(key, baseline, value);
    expect(readCaptureDraft(key, { ...baseline, answers: { 2: "Nunca" } })).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
  });
  it("expires after 24 hours", () => {
    vi.useFakeTimers();
    writeCaptureDraft(key, baseline, value);
    vi.advanceTimersByTime(24 * 3600 * 1000);
    expect(readCaptureDraft(key, baseline)).toBeNull();
  });
  it("removes acknowledged data without removing unrelated storage", () => {
    sessionStorage.setItem("unrelated", "keep");
    writeCaptureDraft(key, baseline, value);
    writeCaptureDraft(key, value, value);
    expect(sessionStorage.getItem(key)).toBeNull();
    writeCaptureDraft(key, baseline, value);
    clearCaptureDrafts();
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
  it("bounds storage and tolerates corrupted records", () => {
    for (let i = 0; i < 30; i++) writeCaptureDraft(`${key}:${i}`, baseline, value);
    expect(Object.keys(sessionStorage)).toHaveLength(12);
    sessionStorage.setItem(key, "bad json");
    expect(readCaptureDraft(key, baseline)).toBeNull();
  });
  it("reports disabled storage without crashing the form", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(writeCaptureDraft(key, baseline, value)).toBe(false);
    spy.mockRestore();
  });
});
