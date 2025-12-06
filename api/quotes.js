// api/quotes.js
// 예: /api/quotes?symbols=NVDA,MSFT,AAPL

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const symbolsParam = url.searchParams.get("symbols");
    if (!symbolsParam) {
      res.status(400).json({ error: "symbols query parameter is required" });
      return;
    }

    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!symbols.length) {
      res.status(400).json({ error: "no symbols provided" });
      return;
    }

    const yahooUrl =
      "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" +
      encodeURIComponent(symbols.join(","));

    const resp = await fetch(yahooUrl);
    if (!resp.ok) {
      const txt = await resp.text();
      res
        .status(502)
        .json({ error: "yahoo request failed", status: resp.status, body: txt });
      return;
    }

    const json = await resp.json();
    const results = json?.quoteResponse?.result || [];

    const map = {};
    for (const q of results) {
      map[q.symbol] = {
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
      };
    }

    // Yahoo가 못 찾은 심볼도 기본값 넣기
    for (const s of symbols) {
      if (!map[s]) {
        map[s] = { price: null, change: null, changePercent: null };
      }
    }

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=45");
    res.status(200).json(map);
  } catch (err) {
    console.error("quotes error", err);
    res
      .status(500)
      .json({ error: "internal error", detail: String(err && err.message) });
  }
}
