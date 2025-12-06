// api/fx.js
// KRW 기준 주요 통화 환율 (ExchangeRate.host 무료 API 사용)

export default async function handler(req, res) {
  try {
    const apiUrl =
      "https://api.exchangerate.host/latest?base=KRW&symbols=USD,EUR,CHF,JPY,CNY";

    const resp = await fetch(apiUrl);
    if (!resp.ok) {
      const txt = await resp.text();
      res
        .status(502)
        .json({ error: "fx provider error", status: resp.status, body: txt });
      return;
    }

    const json = await resp.json();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    res.status(200).json({
      base: json.base,
      date: json.date,
      rates: json.rates,
    });
  } catch (err) {
    console.error("fx error", err);
    res
      .status(500)
      .json({ error: "internal error", detail: String(err && err.message) });
  }
}
