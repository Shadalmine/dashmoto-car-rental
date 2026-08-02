import { adminEmail, allowedAdmin, database, json } from "../../../lib/backend";

export async function GET(request: Request) {
  const email = adminEmail(request);
  if (!allowedAdmin(email)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [bookings, vehicles, messages] = await Promise.all([
      database().prepare("SELECT reference,customer_name,phone,email,vehicle_name,pickup_date,return_date,total_amount,status,verification_status,created_at FROM bookings ORDER BY created_at DESC LIMIT 250").all(),
      database().prepare("SELECT slug,name,type,image,rate,deposit,status,active FROM vehicles ORDER BY type DESC,rate ASC").all(),
      database().prepare("SELECT COUNT(*) AS count FROM messages WHERE status = 'Unread'").first<{count:number}>(),
    ]);
    return json({ bookings: bookings.results, vehicles: vehicles.results, unreadMessages: messages?.count ?? 0 });
  } catch (error) {
    console.error("admin.bookings.get", error);
    return json({ error: "Unable to load admin data." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const email = adminEmail(request);
  if (!allowedAdmin(email)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { reference?: string; status?: string };
    const allowed = new Set(["Pending","Confirmed","Active","Completed","Rejected","Cancelled"]);
    if (!body.reference || !body.status || !allowed.has(body.status)) return json({ error: "Invalid update." }, { status: 400 });
    const current = await database().prepare("SELECT status FROM bookings WHERE reference = ?").bind(body.reference).first<{status:string}>();
    if (!current) return json({ error: "Booking not found." }, { status: 404 });
    const now = new Date().toISOString();
    await database().batch([
      database().prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE reference = ?").bind(body.status,now,body.reference),
      database().prepare("INSERT INTO audit_logs (id,actor_email,action,entity_type,entity_id,detail,created_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),email,"booking.status_changed","booking",body.reference,`${current.status} → ${body.status}`,now),
    ]);
    return json({ ok: true, status: body.status });
  } catch (error) {
    console.error("admin.bookings.patch", error);
    return json({ error: "Unable to update the booking." }, { status: 500 });
  }
}
