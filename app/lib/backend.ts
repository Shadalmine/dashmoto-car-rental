declare global {
  // The Worker entry sets these bindings for the request before Vinext handles it.
  var __DASHMOTO_ENV__: { DB?: D1Database; BUCKET?: R2Bucket } | undefined;
}

export type VehicleRecord = {
  slug: string; name: string; type: "Motorcycle" | "Car"; image: string; year: number;
  transmission: string; seats: number; rate: number; deposit: number; plate: string;
  tag: string; status: string; active: number;
};

const fleet: Omit<VehicleRecord, "status" | "active">[] = [
  { slug: "honda-beat-110", name: "Honda Beat 110", type: "Motorcycle", image: "/fleet/beat.jpg", year: 2024, transmission: "Automatic", seats: 2, rate: 450, deposit: 1500, plate: "0•• ••21", tag: "City favorite" },
  { slug: "honda-click-125i", name: "Honda Click 125i", type: "Motorcycle", image: "/fleet/click.jpg", year: 2024, transmission: "Automatic", seats: 2, rate: 500, deposit: 1500, plate: "0•• ••48", tag: "Best value" },
  { slug: "yamaha-mio-i125", name: "Yamaha Mio i125", type: "Motorcycle", image: "/fleet/mio.jpg", year: 2023, transmission: "Automatic", seats: 2, rate: 500, deposit: 1500, plate: "0•• ••72", tag: "Easy ride" },
  { slug: "honda-xrm-125-fi", name: "Honda XRM 125 FI", type: "Motorcycle", image: "/fleet/xrm.jpg", year: 2024, transmission: "Semi-auto", seats: 2, rate: 550, deposit: 1800, plate: "0•• ••16", tag: "All-road" },
  { slug: "suzuki-burgman-street", name: "Suzuki Burgman Street", type: "Motorcycle", image: "/fleet/burgman.jpg", year: 2024, transmission: "Automatic", seats: 2, rate: 650, deposit: 2000, plate: "0•• ••33", tag: "Comfort ride" },
  { slug: "yamaha-nmax", name: "Yamaha NMAX", type: "Motorcycle", image: "/fleet/nmax.jpg", year: 2025, transmission: "Automatic", seats: 2, rate: 900, deposit: 3000, plate: "0•• ••89", tag: "Premium" },
  { slug: "toyota-wigo", name: "Toyota Wigo", type: "Car", image: "/fleet/wigo.jpg", year: 2023, transmission: "Automatic", seats: 5, rate: 1800, deposit: 5000, plate: "G•• ••18", tag: "City compact" },
  { slug: "mitsubishi-mirage", name: "Mitsubishi Mirage", type: "Car", image: "/fleet/mirage.jpg", year: 2024, transmission: "Automatic", seats: 5, rate: 2000, deposit: 5000, plate: "G•• ••54", tag: "Fuel saver" },
  { slug: "toyota-vios", name: "Toyota Vios", type: "Car", image: "/fleet/vios.jpg", year: 2024, transmission: "Automatic", seats: 5, rate: 2300, deposit: 6000, plate: "G•• ••72", tag: "Most booked" },
  { slug: "honda-city", name: "Honda City", type: "Car", image: "/fleet/honda-city.jpg", year: 2024, transmission: "Automatic", seats: 5, rate: 2600, deposit: 7000, plate: "G•• ••36", tag: "Executive" },
  { slug: "toyota-innova", name: "Toyota Innova", type: "Car", image: "/fleet/innova.jpg", year: 2023, transmission: "Automatic", seats: 8, rate: 3500, deposit: 10000, plate: "G•• ••94", tag: "Family choice" },
  { slug: "toyota-fortuner", name: "Toyota Fortuner", type: "Car", image: "/fleet/fortuner.jpg", year: 2024, transmission: "Automatic", seats: 7, rate: 5000, deposit: 15000, plate: "G•• ••07", tag: "Premium SUV" },
];

export function database(): D1Database {
  const db = globalThis.__DASHMOTO_ENV__?.DB;
  if (!db) throw new Error("Database binding is unavailable");
  return db;
}

export function bucket(): R2Bucket {
  const storage = globalThis.__DASHMOTO_ENV__?.BUCKET;
  if (!storage) throw new Error("Private storage binding is unavailable");
  return storage;
}

export async function ensureFleetSeeded() {
  const db = database();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM vehicles").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;
  const now = new Date().toISOString();
  await db.batch(fleet.map(v => db.prepare(`INSERT OR IGNORE INTO vehicles
    (slug,name,type,image,year,transmission,seats,rate,deposit,plate,tag,status,active,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(v.slug,v.name,v.type,v.image,v.year,v.transmission,v.seats,v.rate,v.deposit,v.plate,v.tag,"Available",1,now,now)));
}

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init.headers || {}) } });
}

export function clean(value: FormDataEntryValue | null, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

export function bookingReference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const random = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `DM-${new Date().getFullYear()}-${stamp}${random}`;
}

export function allowedAdmin(email: string | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "dashchar924@gmail.com").split(",").map(v => v.trim().toLowerCase()).includes(email.toLowerCase());
}

export function adminEmail(request: Request) {
  return request.headers.get("oai-authenticated-user-email");
}
