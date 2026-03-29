import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { emitAdminEvent } from "@/src/lib/events";
import { ensureSupportTables, getOrCreateSupportConversation } from "@/src/lib/support";

const sendSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

const editSchema = z.object({
  id: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    await ensureSupportTables();

    const conversationResult = await query(
      `SELECT id, user_id, status, last_message_at, created_at, updated_at
       FROM support_conversations
       WHERE user_id = $1
       LIMIT 1`,
      [user.userId]
    );

    if (conversationResult.rows.length === 0) {
      return ok({ conversation: null, messages: [] });
    }

    const conversation = conversationResult.rows[0];

    await query(
      `UPDATE support_messages
       SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_role = 'admin' AND is_read = FALSE`,
      [conversation.id]
    );

    const messages = await query(
      `SELECT id, conversation_id, sender_role, sender_user_id, body, is_read, created_at
       FROM support_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    return ok({ conversation, messages: messages.rows });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[support GET]", e);
    return fail("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const conversation = await getOrCreateSupportConversation(user.userId);

    const inserted = await query(
      `INSERT INTO support_messages (id, conversation_id, sender_role, sender_user_id, body, is_read)
       VALUES ($1, $2, 'user', $3, $4, FALSE)
       RETURNING id, conversation_id, sender_role, sender_user_id, body, is_read, created_at`,
      [randomUUID(), conversation.id, user.userId, parsed.data.message]
    );

    await query(
      `UPDATE support_conversations
       SET last_message_at = NOW(), updated_at = NOW(), status = 'open'
       WHERE id = $1`,
      [conversation.id]
    );

    emitAdminEvent({ type: "support", action: "updated" });
    return ok({ conversationId: conversation.id, message: inserted.rows[0] }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[support POST]", e);
    return fail("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const parsed = editSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    await ensureSupportTables();

    const updated = await query(
      `UPDATE support_messages sm
       SET body = $1
       FROM support_conversations sc
       WHERE sm.id = $2
         AND sm.conversation_id = sc.id
         AND sc.user_id = $3
         AND sm.sender_role = 'user'
         AND sm.sender_user_id = $3
       RETURNING sm.id, sm.conversation_id, sm.sender_role, sm.sender_user_id, sm.body, sm.is_read, sm.created_at`,
      [parsed.data.message, parsed.data.id, user.userId]
    );

    if (updated.rows.length === 0) return fail("Message not found", 404);

    emitAdminEvent({ type: "support", action: "updated" });
    return ok({ message: updated.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[support PATCH]", e);
    return fail("Internal server error", 500);
  }
}
