import { adminEmail, allowedAdmin, database, json } from "../../../lib/backend";

export async function PATCH(request: Request) {
  const email = adminEmail(request);
  if (!allowedAdmin(email)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { slug?: string; status?: string; rate?: number; active?: boolean };
    const statuses = new Set(["Available","Reserved","Rented","Maintenance"]);
    if (!body.slug || (body.status && !statuses.has(body.status))) return json({ error: "Invalid vehicle update." }, { status: 400 });
    const vehicle = await database().prepare("SELECT name,status,rate,active FROM vehicles WHERE slug = ?").bind(body.slug).first<{name:string;status:string;rate:number;active:number}>();
    if (!vehicle) return json({ error: "Vehicle not found." }, { status: 404 });
    const status = body.status || vehicle.status;
    const rate = Number.isFinite(body.rate) && Number(body.rate) > 0 ? Math.round(Number(body.rate)) : vehicle.rate;
    const active = typeof body.active === "boolean" ? Number(body.active) : vehicle.active;
    const now = new Date().toISOString();
    await database().batch([
      database().prepare("UPDATE vehicles SET status = ?, rate = ?, active = ?, updated_at = ? WHERE slug = ?").bind(status,rate,active,now,body.slug),
      database().prepare("INSERT INTO audit_logs (id,actor_email,action,entity_type,entity_id,detail,created_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),email,"vehicle.updated","vehicle",body.slug,`${vehicle.name}: ${status}, ₱${rate}/day`,now),
    ]);
    return json({ ok: true, status, rate, active });
  } catch (error) {
    console.error("admin.vehicles.patch", error);
    return json({ error: "Unable to update the vehicle." }, { status: 500 });
  }
}
