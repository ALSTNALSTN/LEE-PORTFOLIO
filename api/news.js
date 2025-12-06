// api/news.js
// 예: /api/news?symbol=NVDA
// Finnhub company-news 사용 (최근 10일)

const FINNHUB_KEY = process.env.FINNHUB_KEY;

export default async function handler(req, res) {
  if (!FINNHUB_KEY) {
    res.status(500).json({ error: "FINNHUB_KEY is not configured" });
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const symbol = url.searchParams.get("symbol") || "NVDA";

    // from~to: 최근 10일
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const fromDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const apiUrl =
      "https://finnhub.io/api/v1/company-news?" +
      `symbol=${encodeURIComponent(symbol)}` +
      `&from=${fromDate}&to=${to}` +
      `&token=${encodeURIComponent(FINNHUB_KEY)}`;

    const resp = await fetch(apiUrl);
    if (!resp.ok) {
      const txt = await resp.text();
      res
        .status(502)
        .json({ error: "finnhub error", status: resp.status, body: txt });
      return;
    }

    const json = await resp.json();
    // headline, url, source, datetime 정도만 전달
    const out = (json || [])
      .filter((n) => n.headline && n.url)
      .map((n) => ({
        headline: n.headline,
        url: n.url,
        source: n.source,
        datetime: n.datetime, // unix(sec)
      }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(out);
  } catch (err) {
    console.error("news error", err);
    res
      .status(500)
      .json({ error: "internal error", detail: String(err && err.message) });
  }
}
