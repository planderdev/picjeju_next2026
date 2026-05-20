export const runtime = "nodejs";

const PICKJEJU_CATEGORIES = {
  "jeju-life-news": [
    "jeju-news",
    "youth-support",
    "jeju-jobs"
  ],
  "community-tip": [
    "community-tip"
  ],
  "picjeju-friends": [
    "picjeju-friends"
  ],
  "community-event": [
    "community-event"
  ],
  market: [
    "talent-class",
    "giveaway",
    "sale"
  ],
  "point-exchange": [
    "point-buy",
    "point-sell",
    "point-done"
  ]
};

const PRIMARY_CATEGORY_ALIASES = {
  event: "community-event",
  community: "jeju-life-news",
  "board-news": "jeju-life-news",
  "community-friends": "picjeju-friends",
  "board-market": "market",
  "pickpoint-exchange": "point-exchange",
  "point-market": "point-exchange",
  point: "point-exchange"
};

const CATEGORY_ALIASES = {
  "board-news": "jeju-news",
  "youth-program": "youth-support",
  jobs: "jeju-jobs",
  tip: "community-tip",
  "picjeju-event": "community-event",
  event: "community-event",
  "community-friends": "picjeju-friends",
  friends: "picjeju-friends",
  "board-market": "sale",
  "market-sale": "sale",
  sharing: "giveaway",
  sell: "sale",
  "point-exchange": "point-buy",
  buy: "point-buy",
  "point-buy": "point-buy",
  "point-purchase": "point-buy",
  "point-wanted": "point-buy",
  "point-sale": "point-sell",
  "point-sell": "point-sell",
  done: "point-done",
  complete: "point-done",
  completed: "point-done",
  "point-done": "point-done",
  "trade-done": "point-done"
};

const POINT_EXCHANGE_CATEGORY_ALIASES = {
  "point-exchange": "point-buy",
  buy: "point-buy",
  sell: "point-sell",
  done: "point-done",
  complete: "point-done",
  completed: "point-done"
};

function normalizePrimaryCategory(value) {
  const key = String(value || "").trim();
  return PRIMARY_CATEGORY_ALIASES[key] || key;
}

function normalizeCategory(value, primaryValue = "") {
  const key = String(value || "").trim();
  if (primaryValue === "point-exchange") {
    return POINT_EXCHANGE_CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key] || key;
  }
  return CATEGORY_ALIASES[key] || key;
}

function findPrimaryBySubCategory(subCategory) {
  return Object.entries(PICKJEJU_CATEGORIES).find(([, items]) => items.includes(subCategory))?.[0] || "";
}

export async function POST(request) {
  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const requestedPrimaryCategory = normalizePrimaryCategory(formData.get("primaryCategory"));
  const subCategory = normalizeCategory(formData.get("subCategory") || formData.get("category"), requestedPrimaryCategory);
  const primaryCategory = findPrimaryBySubCategory(subCategory) || requestedPrimaryCategory;
  const category = subCategory;
  const content = String(formData.get("content") || "").trim();

  if (!title || !primaryCategory || !subCategory || !content) {
    return Response.json(
      { ok: false, message: "Required fields are missing." },
      { status: 400 }
    );
  }

  if (!PICKJEJU_CATEGORIES[primaryCategory]?.includes(subCategory)) {
    return Response.json(
      { ok: false, message: "Invalid category selection." },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    id: Date.now(),
    title,
    primaryCategory,
    subCategory,
    category
  });
}
