import { client } from "@kaneo/libs";
import { HttpError } from "@/lib/http-error";

async function listRecentPages() {
  const response = await client.page.recent.$get();

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json();
}

export default listRecentPages;
