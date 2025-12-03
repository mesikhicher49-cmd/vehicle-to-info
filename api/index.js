// api/index.js
export default async function handler(req, res) {
  const REMOTE_BASE =
    process.env.REMOTE_API_BASE ||
    "https://z.taitaninfo.workers.dev";

  try {
    const upstreamUrl = new URL(REMOTE_BASE);

    // rc -> vehicle
    const { rc, ...restQuery } = req.query || {};

    if (rc) {
      if (Array.isArray(rc)) {
        upstreamUrl.searchParams.set("vehicle", rc[rc.length - 1]);
      } else {
        upstreamUrl.searchParams.set("vehicle", rc);
      }
    }

    // baaki query as-is
    Object.entries(restQuery).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((val) => upstreamUrl.searchParams.append(k, val));
      } else {
        upstreamUrl.searchParams.append(k, v);
      }
    });

    const r = await fetch(upstreamUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/plain, */*",
      },
    });

    const text = await r.text();

    let payload;
    try {
      payload = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: "Upstream returned invalid JSON",
        upstreamStatus: r.status,
        preview: text.slice(0, 2000),
      });
    }

    // ❌ saare dev/credit fields hata do
    delete payload.developer;
    delete payload.brand;
    delete payload.developer_message;
    delete payload.developer_tag;
    delete payload.credit_by;
    delete payload.powered_by;
    delete payload.telegram_user;
    delete payload.telegram_channel;

    // ✅ sirf ye 2 fields add karo
    payload.telegram_user = "@rkmod_x";
    payload.telegram_channel = "@VanshEarningKing";

    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
      }
