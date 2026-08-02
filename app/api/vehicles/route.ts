import { database, ensureFleetSeeded, json } from "../../lib/backend";

export async function GET() {
  try {
    await ensureFleetSeeded();
    const result = await database().prepare("SELECT * FROM vehicles WHERE active = 1 ORDER BY type DESC, rate ASC").all();
    return json({ vehicles: result.results });
  } catch (error) {
    console.error("vehicles.get", error);
    return json({ error: "Unable to load the fleet." }, { status: 500 });
  }
}
