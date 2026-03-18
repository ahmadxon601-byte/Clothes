import { query } from "./db";
import { JwtPayload } from "./jwt";

export interface LogActionParams {
  admin: JwtPayload;
  action: string;       // e.g. "approve", "reject", "delete", "update", "create", "promote"
  entity: string;       // e.g. "seller_request", "product", "store", "user", "order", "banner"
  entityId?: string;
  details?: Record<string, unknown>;
}

/** Fire-and-forget: insert a row into audit_logs. Never throws. */
export async function logAction({
  admin,
  action,
  entity,
  entityId,
  details,
}: LogActionParams): Promise<void> {
  try {
    // Try to get admin name from DB (JWT only has userId/email/role)
    const nameResult = await query(
      "SELECT name FROM users WHERE id = $1 LIMIT 1",
      [admin.userId]
    );
    const adminName = nameResult.rows[0]?.name ?? admin.email;

    // Uses existing audit_logs table schema:
    // operation=action, tableName=entity, entityId=entityId,
    // newData=details, performedByUsername=adminName, admin_uuid=admin.userId
    await query(
      `INSERT INTO audit_logs (operation, "tableName", "entityId", "newData", "performedByUsername", admin_uuid)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        action,
        entity,
        entityId ?? null,
        details ? JSON.stringify(details) : null,
        adminName,
        admin.userId,
      ]
    );
  } catch {
    // audit logging must never break the main request
  }
}
