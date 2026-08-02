import { bookingReference, bucket, clean, database, ensureFleetSeeded, json } from "../../lib/backend";

const allowedLicenseTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  let uploadedKey = "";
  try {
    await ensureFleetSeeded();
    const form = await request.formData();
    const vehicleSlug = clean(form.get("vehicleSlug"), 80);
    const customerName = clean(form.get("customerName"), 120);
    const phone = clean(form.get("phone"), 30);
    const email = clean(form.get("email"), 160).toLowerCase();
    const pickupDate = clean(form.get("pickupDate"), 10);
    const returnDate = clean(form.get("returnDate"), 10);
    const pickupLocation = clean(form.get("pickupLocation"), 120);
    const license = form.get("license");

    if (!vehicleSlug || !customerName || !/^09\d{9}$/.test(phone.replace(/\s/g, "")) || !/^\S+@\S+\.\S+$/.test(email) || !pickupDate || !returnDate) {
      return json({ error: "Please provide complete and valid booking details." }, { status: 400 });
    }
    if (!(license instanceof File) || license.size === 0) return json({ error: "A driver’s license image or PDF is required." }, { status: 400 });
    if (!allowedLicenseTypes.has(license.type) || license.size > 5 * 1024 * 1024) return json({ error: "License file must be JPG, PNG, WebP, or PDF and no larger than 5 MB." }, { status: 400 });

    const pickup = new Date(`${pickupDate}T00:00:00Z`);
    const returned = new Date(`${returnDate}T00:00:00Z`);
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const rentalDays = Math.ceil((returned.getTime() - pickup.getTime()) / 86400000);
    if (!Number.isFinite(rentalDays) || rentalDays < 1 || pickup < today) return json({ error: "Choose a valid future pickup and return schedule." }, { status: 400 });

    const vehicle = await database().prepare("SELECT slug,name,rate,deposit,status FROM vehicles WHERE slug = ? AND active = 1").bind(vehicleSlug).first<{slug:string;name:string;rate:number;deposit:number;status:string}>();
    if (!vehicle || vehicle.status === "Maintenance") return json({ error: "This vehicle is not available for booking." }, { status: 409 });

    const conflict = await database().prepare(`SELECT reference FROM bookings WHERE vehicle_slug = ? AND status IN ('Pending','Confirmed','Active') AND pickup_date < ? AND return_date > ? LIMIT 1`).bind(vehicleSlug, returnDate, pickupDate).first();
    if (conflict) return json({ error: "This vehicle already has a booking during those dates. Please choose another schedule." }, { status: 409 });

    const reference = bookingReference();
    const safeExtension = license.type === "application/pdf" ? "pdf" : license.type.split("/")[1].replace("jpeg", "jpg");
    uploadedKey = `licenses/${reference}/${crypto.randomUUID()}.${safeExtension}`;
    await bucket().put(uploadedKey, await license.arrayBuffer(), { httpMetadata: { contentType: license.type }, customMetadata: { reference } });

    const now = new Date().toISOString();
    const totalAmount = rentalDays * vehicle.rate + vehicle.deposit;
    await database().prepare(`INSERT INTO bookings
      (reference,vehicle_slug,vehicle_name,customer_name,phone,email,pickup_date,return_date,pickup_location,rental_days,daily_rate,deposit,total_amount,status,verification_status,license_object_key,license_file_name,license_content_type,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(reference,vehicle.slug,vehicle.name,customerName,phone.replace(/\s/g,""),email,pickupDate,returnDate,pickupLocation,rentalDays,vehicle.rate,vehicle.deposit,totalAmount,"Pending","Review",uploadedKey,license.name.slice(0,160),license.type,now,now).run();
    return json({ reference, status: "Pending", totalAmount }, { status: 201 });
  } catch (error) {
    console.error("bookings.post", error);
    if (uploadedKey) await bucket().delete(uploadedKey).catch(() => undefined);
    return json({ error: "We could not save your booking. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reference = (url.searchParams.get("reference") || "").trim().toUpperCase().slice(0, 40);
    const phone = (url.searchParams.get("phone") || "").replace(/\s/g, "").slice(0, 20);
    if (!reference || !phone) return json({ error: "Booking reference and mobile number are required." }, { status: 400 });
    const booking = await database().prepare(`SELECT reference,vehicle_name,pickup_date,return_date,total_amount,status,verification_status,created_at FROM bookings WHERE reference = ? AND phone = ?`).bind(reference,phone).first();
    if (!booking) return json({ error: "No booking matched that reference and mobile number." }, { status: 404 });
    return json({ booking });
  } catch (error) {
    console.error("bookings.get", error);
    return json({ error: "Unable to check the booking right now." }, { status: 500 });
  }
}
