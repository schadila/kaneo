import { describe, expect, it } from "vite-plus/test";
import { dropZoneAt } from "./drop-zone";

describe("dropZoneAt", () => {
  const rect = { top: 100, height: 28 };

  it("splits a row into before, inside and after", () => {
    expect(dropZoneAt(102, rect)).toBe("before");
    expect(dropZoneAt(114, rect)).toBe("inside");
    expect(dropZoneAt(126, rect)).toBe("after");
  });
});
