import { Router } from "express";
import { pool } from "../db/postgres.js";
import { redis } from "../db/redis.js";
import crypto from "crypto";

const router = Router();

// Record the clicks silently in the background
async function recordClick(slug, req) {
  try {
    // Hash the ip from raw IP
    const ipHash = crypto.createHash("sha256").update(req.ip).digest("hex");

    const referrer = req.headers["referer"] ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    await pool.query(
      `INSERT INTO clicks (slug, ip_hash, referrer, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [slug, ipHash, referrer, userAgent],
    );

    console.log(`Click recorded for ${slug}`);
  } catch (err) {
    console.error("Click tracking record", err.message);
  }
}

router.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  // Stage 1 Look up slug in DB
  try {
    // Check redis first
    const cached = await redis.get(`slug:${slug}`);

    if (cached) {
      console.log(`Cache HIT for ${slug}`);

      //Fire and Forget -- don't await
      setImmediate(() => recordClick(slug, req));

      return res.redirect(302, cached);
    }

    console.log(`Cache MISS for ${slug} — going to DB`);

    // Cache missess --> Going to DB
    const result = await pool.query(
      `SELECT long_url, expires_at, is_active FROM urls WHERE slug = $1`,
      [slug],
    );

    // Stage 2 Not found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    const url = result.rows[0];

    // Stage 3 Check if deactivated
    if (!url.is_active) {
      return res.status(410).json({ error: "This link has been deactivated" });
    }

    // Stage 4 Check if it expired
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ error: "This Link has expired" });
    }

    // Save to redis
    await redis.setex(`slug:${slug}`, 86400, url.long_url);

    // Fire and Forget -- don't await
    setImmediate(() => recordClick(slug, req));

    // Stage 5 Redirect
    return res.redirect(302, url.long_url);
  } catch (err) {
    console.error("Redirect error:", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
