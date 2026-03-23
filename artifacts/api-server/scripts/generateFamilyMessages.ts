/**
 * generateFamilyMessages.ts
 * One-time script: generates secure shareable message tokens in the DB.
 * Run from api-server dir: npx tsx scripts/generateFamilyMessages.ts
 */

import { db, documents } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const DOCTYPE     = "shareable_msg";
const SYSTEM_USER = "system";
const BASE_URL    = process.env["PUBLIC_URL"] ?? "https://createai.digital";

interface FamilyContact {
  slug:      string;
  name:      string;
  firstName: string;
  subject:   string;
  message:   string;
}

const FAMILY_CONTACTS: FamilyContact[] = [
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
  console.log("🌿 CreateAI Brain — Family Message Token Generator");
  console.log("=".repeat(60));

  const results: Array<{ name: string; link: string; isNew: boolean }> = [];

  for (const contact of FAMILY_CONTACTS) {
    // Check for existing token (idempotent)
    const existing = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId,  SYSTEM_USER),
          eq(documents.docType, DOCTYPE),
          eq(documents.tags,    contact.slug),
        ),
      )
      .limit(1);

    let token: string;
    let isNew = false;

    if (existing.length > 0) {
      const parsed = JSON.parse(existing[0].body as string);
      token = parsed.token as string;
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

      await db.insert(documents).values({
        userId:    SYSTEM_USER,
        projectId: token,
        title:     contact.name,
        body:      payload,
        docType:   DOCTYPE,
        tags:      contact.slug,
      });

      console.log(`✅ Created token for ${contact.name}`);
    }

    results.push({
      name:  contact.name,
      link:  `${BASE_URL}/msg/${token}`,
      isNew,
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("DELIVERY REPORT — SHAREABLE FAMILY LINKS");
  console.log("=".repeat(60));

  for (const r of results) {
    const status = r.isNew ? "✅ NEW" : "♻️  EXISTING";
    console.log(`\n👤 ${r.name} [${status}]`);
    console.log(`   ${r.link}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`🌐 Master page: ${BASE_URL}/family-portal-intro`);
  console.log("=".repeat(60));
  console.log("\nAll links are public — share via text, email, or any channel.\n");

  process.exit(0);
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
