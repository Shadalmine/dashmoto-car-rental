import { clean, database, json } from "../../lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, string>;
    const name = clean(body.name, 120), phone = clean(body.phone, 30), email = clean(body.email, 160).toLowerCase(), message = clean(body.message, 2000);
    if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email) || !message) return json({ error: "Please complete every contact field." }, { status: 400 });
    await database().prepare("INSERT INTO messages (id,name,phone,email,message,status,created_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),name,phone,email,message,"Unread",new Date().toISOString()).run();
    return json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("messages.post", error);
    return json({ error: "Unable to send your inquiry right now." }, { status: 500 });
  }
}
