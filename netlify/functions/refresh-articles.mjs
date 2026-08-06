import { XMLParser } from "fast-xml-parser";
import { getStore } from "@netlify/blobs";

// Verified working RSS feeds (checked manually — IRS and FTB have no
// public feed, so they're handled as a static links block on the page
// instead of a live source here).
const FEEDS = [
  { name: "Tax Foundation", url: "https://taxfoundation.org/feed/" },
  {
    name: "Journal of Accountancy",
    url: "https://www.journalofaccountancy.com/feed/",
  },
  {
    name: "CPA Practice Advisor",
    url: "https://www.cpapracticeadvisor.com/feed/",
  },
  { name: "Kiplinger", url: "https://www.kiplinger.com/taxes/feed" },
];

const ITEMS_PER_FEED = 8;
const SUMMARY_MAX_LENGTH = 180;

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function textOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    return String(value["#text"]);
  }
  return "";
}

async function fetchFeed(source) {
  const res = await fetch(source.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AnneLiangCPA-ArticleBot/1.0)",
    },
  });
  if (!res.ok) throw new Error(`${source.name}: HTTP ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const json = parser.parse(xml);
  const items = json?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  return list.slice(0, ITEMS_PER_FEED).map((item) => ({
    title: stripHtml(textOf(item.title)),
    link: textOf(item.link),
    pubDate: item.pubDate || "",
    summary: truncate(stripHtml(item.description || ""), SUMMARY_MAX_LENGTH),
    source: source.name,
  }));
}

export default async () => {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const articles = [];
  const errors = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push(`${FEEDS[i].name}: ${result.reason?.message || "fetch failed"}`);
    }
  });

  articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const store = getStore("articles");
  await store.setJSON("latest", {
    updatedAt: new Date().toISOString(),
    articles,
    errors,
  });

  return new Response(
    JSON.stringify({ ok: true, count: articles.length, errors }),
    { headers: { "content-type": "application/json" } },
  );
};

export const config = {
  // Daily at 13:00 UTC (~9am ET) so content is fresh going into the day.
  schedule: "0 13 * * *",
};
