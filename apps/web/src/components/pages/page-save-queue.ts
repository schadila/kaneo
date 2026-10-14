import { createDescriptionSaveQueue } from "@/lib/description-save-queue";

// Same debounce/coalescing as task descriptions, keyed by page id.
export const pageSaveQueue = createDescriptionSaveQueue();
