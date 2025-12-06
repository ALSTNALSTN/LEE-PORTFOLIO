// api/crypto.js
// 시총 상위 15개 코인: 가격·변동률·거래량

export default async function handler(req, res) {
  try {
    const url =
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false";

    const resp = await fetch(url, {
      headers: {
        // 무료 플랜 보호를 위해 UA 정도만 지정
        "User-Agent": "MaterialStudio-Portfolio/1.0",
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      res
        .status(502)
        .json({ error: "coingecko error", status: resp.status, body: txt });
      return;
    }

    const json = await resp.json();
    const out = json.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      priceUsd: c.current_price,
      change24h: c.price_change_percentage_24h,
      volume24h: c.total_volume,
      marketCap: c.market_cap,
    }));

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(out);
  } catch (err) {
    console.error("crypto error", err);
    res
      .status(500)
      .json({ error: "internal error", detail: String(err && err.message) });
  }
}
