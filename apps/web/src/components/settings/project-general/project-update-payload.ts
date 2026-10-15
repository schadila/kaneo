import type {
  NormalizedProjectValues,
  ProjectFieldChanges,
} from "./project-form-values";

type ProjectSnapshot = {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  isPublic?: boolean | null;
};

// Eden fix: PUT /project/{id} replaces every field. Unchanged fields must come
// from the last *saved* state, not from the project object the page loaded —
// that object is not refreshed after a save, so a second edit used to write
// the first edit back to its old value ("sometimes it keeps my change,
// sometimes not"). isPublic comes from the freshly fetched project so the
// general page never reverts a visibility change made on another page.
export function buildProjectUpdate(
  project: ProjectSnapshot,
  lastSaved: NormalizedProjectValues | null,
  next: NormalizedProjectValues,
  changes: ProjectFieldChanges,
) {
  const base = lastSaved ?? {
    name: project.name,
    slug: project.slug,
    description: project.description ?? "",
    icon: project.icon || "Layout",
  };
  return {
    name: changes.name ? next.name : base.name,
    slug: changes.slug ? next.slug : base.slug,
    description: changes.description ? next.description : base.description,
    icon: changes.icon ? next.icon : base.icon,
    isPublic: Boolean(project.isPublic),
  };
}
