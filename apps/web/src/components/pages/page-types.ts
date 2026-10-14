import type listPages from "@/fetchers/page/list-pages";
import type getPage from "@/fetchers/page/get-page";

export type PageListItem = Awaited<ReturnType<typeof listPages>>[number];

export type PageDetail = Awaited<ReturnType<typeof getPage>>;
