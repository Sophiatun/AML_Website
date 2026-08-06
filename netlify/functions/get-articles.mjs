import { getStore } from "@netlify/blobs";

export default async () => {
  const store = getStore("articles");
  const data = await store.get("latest", { type: "json" });

  const body = data || {
    updatedAt: null,
    articles: [],
    errors: ["Articles haven't been fetched yet — check back soon."],
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
    },
  });
};

export const config = {
  path: "/api/articles",
};
