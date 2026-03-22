// ─── Family Messaging ─────────────────────────────────────────────────────────
// Private family-only messaging. Kids can only message within family spaces.
// No external messaging. Notifications are kind and non-alarming.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

// ── Conversations ─────────────────────────────────────────────────────────────

// GET /api/family-messages/conversations
router.get("/conversations", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();

  const conversations = await sql`
    SELECT fc.*, 
           (SELECT fm.content FROM platform_family_messages fm 
            WHERE fm.conversation_id = fc.id 
            ORDER BY fm.created_at DESC LIMIT 1) AS last_message,
           (SELECT fm.created_at FROM platform_family_messages fm 
            WHERE fm.conversation_id = fc.id 
            ORDER BY fm.created_at DESC LIMIT 1) AS last_message_at,
           (SELECT COUNT(*) FROM platform_family_messages fm
            WHERE fm.conversation_id = fc.id AND NOT (${userId} = ANY(fm.read_by)))::int AS unread_count
    FROM platform_family_conversations fc
    WHERE ${userId} = ANY(fc.participant_ids)
    ORDER BY last_message_at DESC NULLS LAST, fc.created_at DESC
  `;
  res.json({ conversations });
});

// POST /api/family-messages/conversations
// Body: { participantIds: string[], name?: string, type?: 'direct'|'group' }
router.post("/conversations", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { participantIds, name, type } = req.body as {
    participantIds?: string[];
    name?: string;
    type?: string;
  };

  if (!participantIds?.length) {
    res.status(400).json({ error: "participantIds is required" });
    return;
  }

  // Always include the sender
  const allParticipants = [...new Set([userId, ...participantIds])];

  // Verify all participants are family members (family safety rule)
  const sql = getSql();
  const members = await sql`
    SELECT id, role FROM users
    WHERE id = ANY(${allParticipants})
      AND role IN ('family_adult', 'family_child', 'admin', 'founder')
  `;
  if (members.length !== allParticipants.length) {
    res.status(403).json({ error: "Messages can only be sent to family members" });
    return;
  }

  const [convo] = await sql`
    INSERT INTO platform_family_conversations
      (name, type, participant_ids, created_by)
    VALUES
      (${name ?? null}, ${type ?? "direct"}, ${allParticipants}, ${userId})
    RETURNING *
  `;
  res.json({ conversation: convo });
});

// ── Messages ──────────────────────────────────────────────────────────────────

// GET /api/family-messages/:conversationId/messages?limit=30
router.get("/:conversationId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { conversationId } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 30), 100);
  const sql = getSql();

  // Verify access
  const [convo] = await sql`
    SELECT * FROM platform_family_conversations
    WHERE id = ${conversationId} AND ${userId} = ANY(participant_ids)
  `;
  if (!convo) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const messages = await sql`
    SELECT fm.*, fi.display_name AS sender_name, fi.avatar_emoji AS sender_emoji
    FROM platform_family_messages fm
    LEFT JOIN platform_family_identities fi ON fi.user_id = fm.sender_id
    WHERE fm.conversation_id = ${conversationId}
    ORDER BY fm.created_at DESC
    LIMIT ${limit}
  `;

  // Mark as read
  await sql`
    UPDATE platform_family_messages
    SET read_by = array_append(read_by, ${userId})
    WHERE conversation_id = ${conversationId}
      AND NOT (${userId} = ANY(read_by))
  `;

  res.json({ messages: messages.reverse() });
});

// POST /api/family-messages/:conversationId/messages
// Body: { content: string }
router.post("/:conversationId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { conversationId } = req.params;
  const { content } = req.body as { content?: string };

  if (!content?.trim() || content.trim().length > 2000) {
    res.status(400).json({ error: "Message must be between 1 and 2000 characters" });
    return;
  }

  const sql = getSql();
  const [convo] = await sql`
    SELECT * FROM platform_family_conversations
    WHERE id = ${conversationId} AND ${userId} = ANY(participant_ids)
  `;
  if (!convo) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const [message] = await sql`
    INSERT INTO platform_family_messages
      (conversation_id, sender_id, content, read_by)
    VALUES
      (${conversationId}, ${userId}, ${content.trim()}, ${[userId]})
    RETURNING *
  `;

  // Update conversation timestamp
  await sql`
    UPDATE platform_family_conversations SET updated_at = NOW() WHERE id = ${conversationId}
  `;

  res.json({ message });
});

// GET /api/family-messages/unread-count
router.get("/unread-count", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ count: 0 });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const [row] = await sql`
    SELECT COUNT(*)::int AS count FROM platform_family_messages fm
    JOIN platform_family_conversations fc ON fc.id = fm.conversation_id
    WHERE ${userId} = ANY(fc.participant_ids) AND NOT (${userId} = ANY(fm.read_by))
  `;
  res.json({ count: row?.count ?? 0 });
});

export default router;
