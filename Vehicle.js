// pages/api/vehicle.js  OR  api/vehicle.js (choose one of these two locations)
export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const vehicle = (req.query.vehicle || "").toString().trim();
    if (!vehicle) return res.status(400).json({ ok:false, error: "Missing 'vehicle' query param" });

    const upstreamUrl = `https://z.taitaninfo.workers.dev/?vehicle=${encodeURIComponent(vehicle)}`;
    const upstreamResp = await fetch(upstreamUrl, { headers: { "User-Agent": "Vehicle-Proxy/1.0" } });

    const text = await upstreamResp.text();
    if (!upstreamResp.ok) {
      return res.status(502).json({ ok:false, error:"Upstream failed", status: upstreamResp.status, body: text });
    }

    let data;
    try { data = JSON.parse(text); } catch(e) {
      return res.status(502).json({ ok:false, error:"Upstream JSON parse error", body: text });
    }

    const newUser = "@MessiTrace_Networks";
    data.telegram_user = newUser;
    data.telegram_channel = newUser;
    if (data.api_response && typeof data.api_response === "object") {
      if ("telegram_user" in data.api_response) data.api_response.telegram_user = newUser;
      if ("telegram_channel" in data.api_response) data.api_response.telegram_channel = newUser;
    }

    res.setHeader("Content-Type","application/json");
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, error: String(err) });
  }
}
