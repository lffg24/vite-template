import "@testing-library/jest-dom";
import RO from "resize-observer-polyfill";
(globalThis as any).ResizeObserver ||= RO;
