// pages/api/vehicle.js
// Next.js API route that proxies the upstream vehicle info API
// and replaces telegram_user & telegram_channel with @MessiTrace_Networks

export default async function handler(req, res) {
  try {
    // allow simple CORS (for testing from browser)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Accept GET param "vehicle"
    const vehicle = (req.query.vehicle || "").toString().trim();
    if (!vehicle) {
      return res.status(400).json({
        ok: false,
        error: "Missing 'vehicle' query parameter. Example: /api/vehicle?vehicle=GJ05CK7832"
      });
    }

    const upstreamBase = "https://z.taitaninfo.workers.dev/";
    const upstreamUrl = `${upstreamBase}?vehicle=${encodeURIComponent(vehicle)}`;

    const upstreamResp = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Vehicle-Proxy/1.0 (+https://vercel.com)"
      }
    });

    // If upstream not OK, forward text for debugging
    const upstreamText = await upstreamResp.text();
    if (!upstreamResp.ok) {
      return res.status(502).json({
        ok: false,
        error: "Upstream fetch failed",
        upstream_status: upstreamResp.status,
        upstream_body: upstreamText
      });
    }

    // Try parse JSON
    let data;
    try {
      data = JSON.parse(upstreamText);
    } catch (parseErr) {
      return res.status(502).json({
        ok: false,
        error: "Failed to parse upstream JSON",
        upstream_body: upstreamText
      });
    }

    // Replace top-level telegram fields (or add if missing)
    const newUser = "@MessiTrace_Networks";
    data.telegram_user = newUser;
    data.telegram_channel = newUser;

    // Also attempt to replace nested fields if upstream puts them inside api_response
    if (data.api_response && typeof data.api_response === "object") {
      if ("telegram_user" in data.api_response) data.api_response.telegram_user = newUser;
      if ("telegram_channel" in data.api_response) data.api_response.telegram_channel = newUser;
    }

    // Return modified JSON
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(data);

  } catch (err) {
    console.error("vehicle proxy error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error", details: String(err) });
  }
}
