/**
 * generateFamilyMessages.mjs
 * Generates secure shareable message tokens for all family contacts
 * and stores them directly in the database.
 * Run: node scripts/generateFamilyMessages.mjs
 */

import { createRequire } from "module";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BASE_URL    = "https://createai.digital";
const DOCTYPE     = "shareable_msg";
const SYSTEM_USER = "system";

const FAMILY_CONTACTS = [
  {
    slug:      "nathan-carolina",
    name:      "Nathan & Carolina",
    firstName: "Nathan",
    subject:   "Proud of You & Excited for Family Adventures!",
    message: [
      "Hi Nathan and Carolina,",
      "",
      "I'm so proud of both of you! I can't wait to travel together and create amazing memories as a family.",
      "",
      "Wink wink 😄",
      "",
      "All my love,",
      "Mom (Sara)",
    ].join("\n"),
  },
  {
    slug:      "nolan",
    name:      "Nolan Ryan Stadler",
    firstName: "Nolan",
    subject:   "Excited for Family Fun!",
    message: [
      "Hi Nolan,",
      "",
      "You have such a brilliant heart and I can't wait to see all the wonderful things we do together.",
      "",
      "All my love,",
      "Mom (Sara)",
    ].join("\n"),
  },
  {
    slug:      "dennis",
    name:      "Dennis Stadler",
    firstName: "Dennis",
    subject:   "Family Love & Connection",
    message: [
      "Hi Dennis,",
      "",
      "Just wanted to reach out and tell you how much you mean to our family.",
      "I'm so excited for everything we're building together — so much good is ahead.",
      "",
      "With love,",
      "Sara",
    ].join("\n"),
  },
];

async function run() {
  const results = [];

  for (const contact of FAMILY_CONTACTS) {
    // Check if already exists
    const existing = await pool.query(
      `SELECT body FROM documents WHERE user_id = $1 AND doc_type = $2 AND tags = $3 LIMIT 1`,
      [SYSTEM_USER, DOCTYPE, contact.slug],
    );

    let token;
    let isNew = false;

    if (existing.rows.length > 0) {
      const parsed = JSON.parse(existing.rows[0].body);
      token = parsed.token;
      console.log(`♻️  Reusing token for ${contact.name}`);
    } else {
      token = crypto.randomBytes(32).toString("hex");
      isNew = true;

      const payload = JSON.stringify({
        token,
        slug:      contact.slug,
        name:      contact.name,
        firstName: contact.firstName,
        subject:   contact.subject,
        message:   contact.message,
        createdAt: new Date().toISOString(),
      });

      await pool.query(
        `INSERT INTO documents (user_id, project_id, title, body, doc_type, tags)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [SYSTEM_USER, token, contact.name, payload, DOCTYPE, contact.slug],
      );
      console.log(`✅ Generated token for ${contact.name}`);
    }

    results.push({
      name: contact.name,
      slug: contact.slug,
      isNew,
      token,
      link: `${BASE_URL}/msg/${token}`,
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log("DELIVERY REPORT — SHAREABLE FAMILY MESSAGE LINKS");
  console.log("=".repeat(70));

  for (const r of results) {
    console.log(`\n👤 ${r.name}`);
    console.log(`   Link: ${r.link}`);
    console.log(`   Status: ${r.isNew ? "✅ New — stored in DB" : "♻️  Existing token reused"}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log(`🌐 Master Share Page: ${BASE_URL}/family-portal-intro`);
  console.log("=".repeat(70));
  console.log("\nAll links are LIVE and PUBLIC — no login required.");
  console.log("Share via iMessage, WhatsApp, email, or any channel.\n");

  await pool.end();
}

run().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
