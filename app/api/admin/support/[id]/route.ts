import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { ensureSupportTables } from "@/src/lib/support";
import { emitAdminEvent } from "@/src/lib/events";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

const replySchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export async function GET(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, "admin");
    await ensureSupportTables();
    const { id } = await params;

    const conversationResult = await query(
      `SELECT
         c.id,
         c.user_id,
         c.status,
         c.last_message_at,
         c.created_at,
         u.name AS user_name,
         u.email AS user_email
       FROM support_conversations c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1
       LIMIT 1`,
      [id]
    );

    if (conversationResult.rows.length === 0) {
      return fail("Conversation not found", 404);
    }

    await query(
      `UPDATE support_messages
       SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_role = 'user' AND is_read = FALSE`,
      [id]
    );

    const messages = await query(
      `SELECT id, conversation_id, sender_role, sender_user_id, body, is_read, created_at
       FROM support_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return ok({ conversation: conversationResult.rows[0], messages: messages.rows });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/support/:id GET]", e);
    return fail("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    await ensureSupportTables();
    const { id } = await params;
    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const conversationResult = await query(
      `SELECT id FROM support_conversations WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (conversationResult.rows.length === 0) {
      return fail("Conversation not found", 404);
    }

    const inserted = await query(
      `INSERT INTO support_messages (id, conversation_id, sender_role, sender_user_id, body, is_read)
       VALUES ($1, $2, 'admin', $3, $4, FALSE)
       RETURNING id, conversation_id, sender_role, sender_user_id, body, is_read, created_at`,
      [randomUUID(), id, admin.userId, parsed.data.message]
    );

    await query(
      `UPDATE support_conversations
       SET last_message_at = NOW(), updated_at = NOW(), status = 'open'
       WHERE id = $1`,
      [id]
    );

    emitAdminEvent({ type: "support", action: "updated" });
    void logAction({ admin, action: "reply", entity: "support_conversation", entityId: id, details: { message: parsed.data.message } });
    return ok({ message: inserted.rows[0] }, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/support/:id POST]", e);
    return fail("Internal server error", 500);
  }
}
