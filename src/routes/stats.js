import { Router } from "express";
import { pool } from "../db/postgres.js";

const router = Router();

router.get("/stats/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    // Check the slug exist
    const urlResults = await pool.query(
      `SELECT slug, long_url, created_at FROM urls where slug = $1`,
      [slug],
    );

    if (urlResults.rows.length === 0) {
      return res.status(404).json({ error: "Slug not found" });
    }

    const urlDate = urlResults.rows[0];

    // Total click results
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM clicks where slug = $1`,
      [slug],
    );

    // Clicks grouped by referrer
    const referrerResult = await pool.query(
      `SELECT referrer, COUNT(*) as count
             FROM clicks
             WHERE slug = $1
             GROUP BY referrer
             ORDER BY count DESC
            `,
      [slug],
    );

    // Clicks grouped by date
    const dateResult = await pool.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as count
             FROM clicks
             WHERE slug = $1
             GROUP BY DATE(clicked_at)
             ORDER BY date DESC
            `,
      [slug],
    );

    return res.json({
      slug: urlDate.slug,
      long_url: urlDate.long_url,
      created_at: urlDate.created_at,
      total_clicks: parseInt(totalResult.rows[0].total),
      clicks_by_referrer: referrerResult.rows,
      clicks_by_dates: dateResult.rows,
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
