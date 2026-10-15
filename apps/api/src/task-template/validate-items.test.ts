import { describe, expect, it } from "vite-plus/test";
import { templateItemsProblem } from "./validate-items";

describe("templateItemsProblem", () => {
  it("accepts main tasks with subtasks pointing back", () => {
    expect(
      templateItemsProblem([
        { parentIndex: null },
        { parentIndex: 0 },
        { parentIndex: 0 },
        {},
        { parentIndex: 3 },
      ]),
    ).toBeNull();
  });

  it("rejects forward or self references", () => {
    expect(templateItemsProblem([{ parentIndex: 0 }])?.index).toBe(0);
    expect(templateItemsProblem([{}, { parentIndex: 2 }, {}])?.index).toBe(1);
  });

  it("rejects a second level", () => {
    expect(
      templateItemsProblem([{}, { parentIndex: 0 }, { parentIndex: 1 }])
        ?.message,
    ).toBe("Subtasks cannot have subtasks");
  });
});
