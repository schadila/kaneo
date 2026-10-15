import { describe, expect, it } from "vite-plus/test";
import { getProjectFieldChanges } from "./project-form-values";
import { buildProjectUpdate } from "./project-update-payload";

const loaded = {
  name: "Old name",
  slug: "OLD",
  description: "Old description",
  icon: "Layout",
  isPublic: false,
};

describe("buildProjectUpdate", () => {
  it("keeps an earlier saved change when another field is edited later", () => {
    // 1st save: name changed.
    const afterFirst = { ...loaded, name: "New name" };
    // 2nd edit: description changed; `loaded` is still the stale page data.
    const next = { ...afterFirst, description: "New description" };
    const payload = buildProjectUpdate(
      loaded,
      afterFirst,
      next,
      getProjectFieldChanges(afterFirst, next),
    );
    expect(payload.name).toBe("New name");
    expect(payload.description).toBe("New description");
  });

  it("sends the visibility of the freshly loaded project", () => {
    const saved = { name: "A", slug: "A", description: "", icon: "Layout" };
    const next = { ...saved, name: "B" };
    expect(
      buildProjectUpdate(
        { ...loaded, isPublic: true },
        saved,
        next,
        getProjectFieldChanges(saved, next),
      ).isPublic,
    ).toBe(true);
  });

  it("falls back to the project before the first save", () => {
    const next = {
      name: "Old name",
      slug: "OLD",
      description: "Old description",
      icon: "Star",
    };
    expect(
      buildProjectUpdate(
        loaded,
        null,
        next,
        getProjectFieldChanges(null, next),
      ),
    ).toEqual({ ...next, isPublic: false });
  });
});
