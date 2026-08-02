"use client";

import { useEffect, useMemo, useState } from "react";

type Vehicle = {
  slug: string;
  name: string;
  type: "Motorcycle" | "Car";
  image: string;
  year: number;
  transmission: string;
  seats: number;
  rate: number;
  deposit: number;
  plate: string;
  tag: string;
  status: string;
};

const fallbackVehicles: Vehicle[] = [
  { slug: "honda-beat-110", name: "Honda Beat 110", type: "Motorcycle", image: "/fleet/beat.jpg", year: 2024, transmission: "Automatic", seats: 2, rate: 450, deposit: 1500, plate: "0•• ••21", tag: "City favorite", status: "Available" },
  { slug: "honda-click-125i", name: "Honda Click 125i", type: "Motorcycle", image: "/fleet/click.jpg", year: 2024, transmission: "Automatic", seats: 2, rate: 500, deposit: 1500, plate: "0•• ••48", tag: "Best value", status: "Available" },
  { slug: "yamaha-mio-i125", name: "Yamaha Mio i125", type: "Motorcycle", image: "/fleet/mio.jpg", year: 2023, transmission: "Automatic", seats: 2, rate: 500, deposit: 1500, plate: "0•• ••72", tag: "Easy ride", status: "Available" },
  { slug: "honda-xrm-125-fi", name: "Honda XRM 125 FI", type: "Motorcycle", image: "/fleet/xrm.jpg", year: 2024, transmission: "Semi-auto", seats: 2, rate: 550, deposit: 1800, plate: "0•• ••16", tag: "All-road", status: "Available" },
  { slug: "suzuki-burgman-street", name: "Suzuki Burgman Street", type: "Motorcycle", image: "/fleet/burgman.jpg", year: 2024, transmission: "Automatic", seats: 2, rate: 650, deposit: 2000, plate: "0•• ••33", tag: "Comfort ride", status: "Available" },
  { slug: "yamaha-nmax", name: "Yamaha NMAX", type: "Motorcycle", image: "/fleet/nmax.jpg", year: 2025, transmission: "Automatic", seats: 2, rate: 900, deposit: 3000, plate: "0•• ••89", tag: "Premium", status: "Available" },
  { slug: "toyota-wigo", name: "Toyota Wigo", type: "Car", image: "/fleet/wigo.jpg", year: 2023, transmission: "Automatic", seats: 5, rate: 1800, deposit: 5000, plate: "G•• ••18", tag: "City compact", status: "Available" },
  { slug: "mitsubishi-mirage", name: "Mitsubishi Mirage", type: "Car", image: "/fleet/mirage.jpg", year: 2024, transmission: "Automatic", seats: 5, rate: 2000, deposit: 5000, plate: "G•• ••54", tag: "Fuel saver", status: "Available" },
  { slug: "toyota-vios", name: "Toyota Vios", type: "Car", image: "/fleet/vios.jpg", year: 2024, transmission: "Automatic", seats: 5, rate: 2300, deposit: 6000, plate: "G•• ••72", tag: "Most booked", status: "Available" },
  { slug: "honda-city", name: "Honda City", type: "Car", image: "/fleet/honda-city.jpg", year: 2024, transmission: "Automatic", seats: 5, rate: 2600, deposit: 7000, plate: "G•• ••36", tag: "Executive", status: "Available" },
  { slug: "toyota-innova", name: "Toyota Innova", type: "Car", image: "/fleet/innova.jpg", year: 2023, transmission: "Automatic", seats: 8, rate: 3500, deposit: 10000, plate: "G•• ••94", tag: "Family choice", status: "Available" },
  { slug: "toyota-fortuner", name: "Toyota Fortuner", type: "Car", image: "/fleet/fortuner.jpg", year: 2024, transmission: "Automatic", seats: 7, rate: 5000, deposit: 15000, plate: "G•• ••07", tag: "Premium SUV", status: "Available" },
];

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const messengerUrl = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL || "https://m.me/";

function Logo() {
  return <a className="logo" href="#home" aria-label="DashMoto home"><span className="logo-mark">D</span><span>DASH<span>MOTO</span><small>CAR RENTAL</small></span></a>;
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(fallbackVehicles);
  const [category, setCategory] = useState<"All" | "Motorcycle" | "Car">("All");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [pickup, setPickup] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const filtered = useMemo(() => vehicles.filter(v =>
    (category === "All" || v.type === category) && v.name.toLowerCase().includes(search.toLowerCase())
  ), [category, search, vehicles]);

  const days = pickup && returnDate ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickup).getTime()) / 86400000)) : 1;

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  useEffect(() => {
    fetch("/api/vehicles").then(response => response.ok ? response.json() : Promise.reject()).then(data => {
      if (Array.isArray(data.vehicles) && data.vehicles.length) setVehicles(data.vehicles);
    }).catch(() => undefined);
  }, []);

  function beginBooking(vehicle: Vehicle) {
    setSelected(vehicle);
    setNotice("");
    setBookingSubmitted(false);
  }

  function closeBooking() {
    setSelected(null);
    setNotice("");
    setBookingSubmitted(false);
  }

  async function submitBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true); setNotice("");
    const data = new FormData(e.currentTarget);
    data.set("vehicleSlug", selected.slug); data.set("pickupDate", pickup); data.set("returnDate", returnDate);
    try {
      const response = await fetch("/api/bookings", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Booking could not be submitted.");
      setBookingSubmitted(true);
      setNotice(`Booking request ${result.reference} received. Save this reference and your mobile number to track it below.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Booking could not be submitted."); }
    finally { setSubmitting(false); }
  }

  return (
    <main>
      <header className="topbar">
        <div className="nav-wrap">
          <Logo />
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
          <nav className={menuOpen ? "nav open" : "nav"} onClick={() => setMenuOpen(false)}>
            <a href="#home">Home</a><a href="#rentals">Rentals</a><a href="#about">About</a><a href="#policy">Policies</a><a href="#contact">Contact</a>
            <a className="nav-link-accent" href="#bookings">My bookings</a>
          </nav>
          <a className="button button-small header-cta" href="#rentals">Book a vehicle</a>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span /> Cebu City vehicle rental</div>
            <h1>Ride or drive<br /><em>with confidence.</em></h1>
            <p>Reliable motorcycles and cars for your commute, business trip, family getaway, or Cebu adventure—at clear daily rates with no surprise fees.</p>
            <div className="hero-actions">
              <a className="button" href="#rentals">Explore the fleet <span>→</span></a>
              <a className="text-link" href={messengerUrl} target="_blank" rel="noreferrer"><span className="messenger-dot">✦</span> Message us</a>
            </div>
            <div className="trust-row">
              <div><strong>12</strong><span>Ready vehicles</span></div>
              <div><strong>₱450</strong><span>Rates from / day</span></div>
              <div><strong>7 days</strong><span>Customer support</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="availability-pill"><span /> Available today</div>
            <img src="/fleet/fortuner.jpg" alt="White Toyota Fortuner available for rent" />
            <div className="hero-price"><small>Premium SUV from</small><strong>₱5,000 <span>/ day</span></strong></div>
            <div className="mini-card"><img src="/fleet/nmax.jpg" alt="Yamaha NMAX" /><span><small>Need something nimble?</small><strong>Yamaha NMAX</strong></span></div>
          </div>
        </div>
      </section>

      <section className="quick-book" aria-label="Quick availability search">
        <div><label>Pickup date</label><input type="date" value={pickup} onChange={e => setPickup(e.target.value)} /></div>
        <div><label>Return date</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
        <div><label>Vehicle type</label><select value={category} onChange={e => setCategory(e.target.value as typeof category)}><option>All</option><option>Motorcycle</option><option>Car</option></select></div>
        <a className="button" href="#rentals">Check availability →</a>
      </section>

      <section className="section rentals" id="rentals">
        <div className="section-heading">
          <div><span className="kicker">Choose your ride</span><h2>A fleet for every kind of trip.</h2></div>
          <p>From quick city errands to weekend family trips, every unit is inspected, cleaned, and ready for the road.</p>
        </div>
        <div className="filter-bar">
          <div className="tabs" role="tablist">
            {(["All", "Motorcycle", "Car"] as const).map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c === "All" ? "All vehicles" : `${c}s`}</button>)}
          </div>
          <label className="search"><span>⌕</span><input placeholder="Search model..." value={search} onChange={e => setSearch(e.target.value)} /></label>
        </div>
        <div className="vehicle-grid">
          {filtered.map(v => <article className="vehicle-card" key={v.name}>
            <div className="vehicle-image"><span className="tag">{v.tag}</span><span className="available">● {v.status}</span><img src={v.image} alt={`${v.name} rental vehicle`} /></div>
            <div className="vehicle-body">
              <div className="vehicle-title"><div><small>{v.type} · {v.year}</small><h3>{v.name}</h3></div><div className="rate"><strong>{peso.format(v.rate)}</strong><small>/ day</small></div></div>
              <div className="specs"><span>⚙ {v.transmission}</span><span>♙ {v.seats} seats</span><span>◈ Gasoline</span></div>
              <div className="card-footer"><span>Deposit {peso.format(v.deposit)}</span><button disabled={v.status === "Maintenance"} onClick={() => beginBooking(v)}>{v.status === "Maintenance" ? "Unavailable" : "Book now →"}</button></div>
            </div>
          </article>)}
        </div>
      </section>

      <section className="dark-section" id="about">
        <div className="dark-inner">
          <div className="story-image"><img src="/fleet/click.jpg" alt="Honda Click motorcycle from the DashMoto fleet" /><div className="story-badge"><strong>Local.</strong><span>Simple. Dependable.</span></div></div>
          <div className="story-copy"><span className="kicker">Built for Cebu roads</span><h2>Your trusted ride,<br />without the runaround.</h2><p>DASHMOTO and Car Rental is a Cebu City-based service committed to convenient, trusted, and affordable transportation. We make it easy to compare units, choose a schedule, submit requirements, and get clear confirmation from a real person.</p>
            <div className="promise-grid"><div><b>01</b><h3>Transparent rates</h3><p>Clear daily pricing, deposits, and possible fees before you confirm.</p></div><div><b>02</b><h3>Road-ready units</h3><p>Every vehicle is checked and prepared before customer pickup.</p></div><div><b>03</b><h3>Secure verification</h3><p>Your license and personal details are used only for the rental process.</p></div><div><b>04</b><h3>Responsive support</h3><p>Reach us by Messenger, phone, or email when you need help.</p></div></div>
          </div>
        </div>
      </section>

      <section className="section process">
        <div className="section-heading"><div><span className="kicker">Simple from start to finish</span><h2>Your keys in four steps.</h2></div></div>
        <div className="steps"><div><b>01</b><h3>Choose</h3><p>Compare vehicles, rates, and features.</p></div><div><b>02</b><h3>Schedule</h3><p>Select your pickup and return dates.</p></div><div><b>03</b><h3>Verify</h3><p>Submit your valid driver’s license securely.</p></div><div><b>04</b><h3>Go</h3><p>Get confirmed, pick up, and enjoy the ride.</p></div></div>
      </section>

      <section className="policy-section" id="policy">
        <div><span className="kicker">Know before you go</span><h2>Clear policies.<br />No surprises.</h2><p>Bookings are confirmed after document verification and required payment. Only approved, licensed drivers may operate the vehicle. Return it at the agreed time, place, fuel level, and condition.</p><a href="#contact" className="text-link">Ask about a policy →</a></div>
        <div className="policy-list"><details open><summary>Driver & document requirements <span>−</span></summary><p>Present a valid license appropriate for the chosen vehicle, accurate contact details, and any required secondary ID.</p></details><details><summary>Payment & security deposit <span>+</span></summary><p>Required payments and deposits must be completed before release. Refundable balances are processed after return inspection.</p></details><details><summary>Pickup, fuel & returns <span>+</span></summary><p>Inspect the unit with staff and return it on time at the agreed fuel level. Approved extensions must be requested in advance.</p></details><details><summary>Cancellation & rescheduling <span>+</span></summary><p>Charges depend on notice period and booking conditions. Contact our team as early as possible.</p></details></div>
      </section>

      <section className="section booking-summary" id="bookings">
        <div><span className="kicker">My bookings</span><h2>Keep every trip on track.</h2><p>Use your booking reference to check verification, payment, pickup, and return status. New requests start as <strong>Pending</strong> until our team reviews them.</p></div>
        <form onSubmit={async e => { e.preventDefault(); setNotice(""); const data = new FormData(e.currentTarget); try { const response = await fetch(`/api/bookings?reference=${encodeURIComponent(String(data.get("reference")))}&phone=${encodeURIComponent(String(data.get("phone")))}`); const result = await response.json(); if (!response.ok) throw new Error(result.error); setNotice(`${result.booking.reference}: ${result.booking.vehicle_name}, ${result.booking.pickup_date} to ${result.booking.return_date}. Status: ${result.booking.status}; verification: ${result.booking.verification_status}.`); } catch (error) { setNotice(error instanceof Error ? error.message : "Booking not found."); } }}><label>Booking reference<input name="reference" placeholder="e.g. DM-2026-AB12CD34" required /></label><label>Mobile number<input name="phone" placeholder="09XX XXX XXXX" required /></label><button className="button">Find booking</button>{notice && <p className="inline-notice">{notice}</p>}</form>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy"><span className="kicker">Let’s get you moving</span><h2>Have questions?<br />Talk to us.</h2><p>Our team can help you choose a vehicle, confirm requirements, or assist with an active rental.</p><div className="contact-lines"><a href="tel:09974174617">☎ <span><small>Call or text</small>0997 417 4617</span></a><a href="mailto:dashchar924@gmail.com">✉ <span><small>Email us</small>dashchar924@gmail.com</span></a><p>⌖ <span><small>Visit us</small>Cebu City, Philippines</span></p></div></div>
        <form className="contact-form" onSubmit={async e => { e.preventDefault(); setNotice(""); const form = e.currentTarget; const data = Object.fromEntries(new FormData(form)); try { const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setNotice("Thanks! Your inquiry was sent to the DashMoto team."); form.reset(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to send your inquiry."); } }}><div className="field-row"><label>Name<input name="name" required placeholder="Your complete name" /></label><label>Mobile number<input name="phone" required placeholder="09XX XXX XXXX" /></label></div><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>How can we help?<textarea name="message" required rows={4} placeholder="Tell us the vehicle and dates you have in mind..." /></label><button className="button">Send inquiry →</button>{notice && <p className="inline-notice">{notice}</p>}</form>
      </section>

      <footer><div><Logo /><p>Reliable rides. Clear terms. Real support.</p></div><div><h3>Explore</h3><a href="#rentals">Motorcycles</a><a href="#rentals">Cars</a><a href="#policy">Rental policies</a></div><div><h3>Contact</h3><a href="tel:09974174617">0997 417 4617</a><a href="mailto:dashchar924@gmail.com">dashchar924@gmail.com</a><span>Cebu City, Philippines</span></div><div><h3>Business hours</h3><span>Mon–Sat: 7:00 AM–7:00 PM</span><span>Sunday: By appointment</span><a href="/admin">Admin login</a></div><p className="copyright">© 2026 DASHMOTO and Car Rental. All rights reserved.</p></footer>

      <a className="floating-message" href={messengerUrl} target="_blank" rel="noreferrer" aria-label="Message DashMoto on Messenger">✦</a>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && closeBooking()}>
        <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <button className="close" onClick={closeBooking} aria-label="Close booking form">×</button>
          <div className="modal-vehicle"><img src={selected.image} alt={selected.name} /><div><small>{selected.type}</small><h2 id="booking-title">Reserve {selected.name}</h2><p>{peso.format(selected.rate)} per day · {peso.format(selected.deposit)} refundable deposit</p></div></div>
          {bookingSubmitted ? <div className="success"><span>✓</span><h3>Request submitted</h3><p>{notice}</p><button className="button" onClick={closeBooking}>Done</button></div> : <form onSubmit={submitBooking}>
            <div className="step-label">Booking request <span>Secure verification follows</span></div>
            <div className="field-row"><label>Pickup date<input required type="date" value={pickup} onChange={e => setPickup(e.target.value)} /></label><label>Return date<input required type="date" value={returnDate} min={pickup} onChange={e => setReturnDate(e.target.value)} /></label></div>
            <div className="field-row"><label>Complete name<input name="customerName" required placeholder="Juan Dela Cruz" /></label><label>Mobile number<input name="phone" required inputMode="tel" pattern="09[0-9 ]{9,13}" placeholder="09XX XXX XXXX" /></label></div>
            <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
            <label>Pickup location<select name="pickupLocation"><option>Cebu City office</option><option>Delivery within Cebu City</option><option>Other (confirm with staff)</option></select></label>
            <label>Driver’s license (private upload)<input name="license" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" /><small>JPG, PNG, WebP, or PDF; maximum 5 MB. Only authorized staff can access this document.</small></label>
            <label className="consent"><input type="checkbox" required /> <span>I confirm my information is accurate and agree to the rental policies and secure processing of my details.</span></label>
            <div className="price-box"><span>{days} rental day{days > 1 ? "s" : ""} × {peso.format(selected.rate)}<strong>{peso.format(days * selected.rate)}</strong></span><span>Refundable security deposit<strong>{peso.format(selected.deposit)}</strong></span><span className="total">Estimated due<strong>{peso.format(days * selected.rate + selected.deposit)}</strong></span></div>
            {notice && <p className="inline-notice">{notice}</p>}<button className="button full" disabled={submitting}>{submitting ? "Saving securely…" : "Submit booking request →"}</button><p className="privacy-note">You’ll receive a reference number. Booking is subject to availability, license verification, and staff confirmation.</p>
          </form>}
        </section>
      </div>}
    </main>
  );
}
