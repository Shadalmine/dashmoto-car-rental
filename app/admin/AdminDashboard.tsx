"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import Link from "next/link";

type BookingStatus = "Pending" | "Confirmed" | "Active" | "Completed" | "Rejected";
type NavKey = "Dashboard" | "Bookings" | "Customers" | "Vehicles" | "Rentals" | "Messages" | "Payments" | "Reports" | "Audit logs" | "Staff & roles" | "Policies" | "Settings";

type Booking = {
  ref: string;
  customer: string;
  phone: string;
  vehicle: string;
  schedule: string;
  amount: number;
  status: BookingStatus;
  verification: "Verified" | "Review" | "Incomplete";
};

const initialBookings: Booking[] = [];

type FleetItem = { slug: string; name: string; type: string; image: string; rate: number; deposit: number; status: string; active: number };

const nav: { label: NavKey; icon: string }[] = [
  { label: "Dashboard", icon: "▦" }, { label: "Bookings", icon: "◫" }, { label: "Customers", icon: "♙" },
  { label: "Vehicles", icon: "◇" }, { label: "Rentals", icon: "↗" }, { label: "Messages", icon: "✉" },
  { label: "Payments", icon: "₱" }, { label: "Reports", icon: "↗" }, { label: "Audit logs", icon: "≡" },
  { label: "Staff & roles", icon: "♧" }, { label: "Policies", icon: "§" }, { label: "Settings", icon: "⚙" },
];

const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export default function AdminDashboard({ user, signOutPath }: { user: ChatGPTUser; signOutPath: string }) {
  const [active, setActive] = useState<NavKey>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookings, setBookings] = useState(initialBookings);
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const filteredBookings = useMemo(() => bookings.filter((booking) =>
    `${booking.ref} ${booking.customer} ${booking.vehicle} ${booking.status}`.toLowerCase().includes(search.toLowerCase())
  ), [bookings, search]);

  useEffect(() => {
    fetch("/api/admin/bookings").then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setBookings((data.bookings || []).map((item: Record<string, string | number>) => ({ ref: item.reference, customer: item.customer_name, phone: String(item.phone), vehicle: item.vehicle_name, schedule: `${item.pickup_date}–${item.return_date}`, amount: Number(item.total_amount), status: item.status, verification: item.verification_status })));
      setFleet(data.vehicles || []); setUnreadMessages(Number(data.unreadMessages || 0));
    }).catch(error => setToast(error instanceof Error ? error.message : "Unable to load admin data.")).finally(() => setLoading(false));
  }, []);

  async function moveBooking(ref: string, status: BookingStatus) {
    const response = await fetch("/api/admin/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: ref, status }) });
    const result = await response.json();
    if (!response.ok) { setToast(result.error || "Update failed."); return; }
    setBookings(current => current.map(item => item.ref === ref ? { ...item, status } : item));
    setToast(`${ref} updated to ${status}.`);
    window.setTimeout(() => setToast(""), 4200);
  }

  async function updateVehicle(slug: string, status: string) {
    const response = await fetch("/api/admin/vehicles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, status }) });
    const result = await response.json();
    if (!response.ok) { setToast(result.error || "Vehicle update failed."); return; }
    setFleet(current => current.map(item => item.slug === slug ? { ...item, status } : item));
    setToast(`Vehicle status updated to ${status}.`); window.setTimeout(() => setToast(""), 4200);
  }

  const counts = {
    total: fleet.length,
    available: fleet.filter(item => item.status === "Available").length,
    reserved: fleet.filter(item => item.status === "Reserved").length,
    active: bookings.filter(item => item.status === "Active").length,
    pending: bookings.filter(item => item.status === "Pending").length,
  };

  return (
    <main className="admin-shell">
      <aside className={sidebarOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <Link className="admin-brand" href="/">
          <span className="admin-brand-mark">D</span>
          <span>DASH<strong>MOTO</strong><small>ADMIN PORTAL</small></span>
        </Link>
        <nav className="admin-nav">
          {nav.map(item => <button key={item.label} className={active === item.label ? "active" : ""} onClick={() => { setActive(item.label); setSidebarOpen(false); }}><span>{item.icon}</span>{item.label}{item.label === "Bookings" && counts.pending > 0 && <b>{counts.pending}</b>}{item.label === "Messages" && unreadMessages > 0 && <b>{unreadMessages}</b>}</button>)}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank">↗ View public website</Link>
          <a href={signOutPath}>⇥ Sign out</a>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}

      <section className="admin-workspace">
        <header className="admin-topbar">
          <button className="admin-menu" onClick={() => setSidebarOpen(true)} aria-label="Open admin menu">☰</button>
          <div><p>Sunday, August 2, 2026</p><strong>{active}</strong></div>
          <label className="admin-global-search"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search bookings, customers..." /></label>
          <button className="notification-button" aria-label="Notifications">♢<b>4</b></button>
          <div className="admin-user"><span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName || "Administrator"}</strong><small>{user.email}</small></div></div>
        </header>

        <div className="admin-content">
          <div className="admin-title-row">
            <div><p className="admin-kicker">Operations center</p><h1>{active === "Dashboard" ? `Good afternoon, ${user.fullName?.split(" ")[0] || "Admin"}.` : active}</h1><p>{active === "Dashboard" ? "Here’s what needs your attention across DashMoto today." : `Manage DashMoto ${active.toLowerCase()} from one secure workspace.`}</p></div>
            <button className="admin-primary-button" onClick={() => { setActive("Bookings"); setToast("Manual booking form is queued for the production database release."); }}>＋ New booking</button>
          </div>

          <div className="demo-banner"><strong>Production backend connected</strong><span>{loading ? "Loading live operations data…" : "Bookings, availability, inquiries, license documents, and admin actions now save securely."}</span></div>

          {active === "Dashboard" && <DashboardView counts={counts} bookings={bookings} setActive={setActive} />}
          {active === "Bookings" && <BookingsView bookings={filteredBookings} moveBooking={moveBooking} />}
          {active === "Vehicles" && <VehiclesView fleet={fleet} updateVehicle={updateVehicle} />}
          {!(["Dashboard", "Bookings", "Vehicles"] as NavKey[]).includes(active) && <ModuleView name={active} />}
        </div>
      </section>
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </main>
  );
}

function DashboardView({ counts, bookings, setActive }: { counts: { total: number; available: number; reserved: number; active: number; pending: number }; bookings: Booking[]; setActive: (key: NavKey) => void }) {
  const stats = [
    ["Total fleet", String(counts.total), "Motorcycles and cars", "◇"], ["Available", String(counts.available), "Ready to book today", "✓"],
    ["Active rentals", String(counts.active), "1 return due today", "↗"], ["Pending bookings", String(counts.pending), "Needs your review", "◫"],
  ];
  return <>
    <div className="admin-stats">{stats.map(stat => <article key={stat[0]}><span>{stat[3]}</span><small>{stat[0]}</small><strong>{stat[1]}</strong><p>{stat[2]}</p></article>)}</div>
    <div className="dashboard-grid">
      <section className="admin-panel admin-booking-panel"><div className="panel-heading"><div><small>Priority queue</small><h2>Upcoming bookings</h2></div><button onClick={() => setActive("Bookings")}>View all →</button></div><BookingTable bookings={bookings.slice(0, 4)} compact /></section>
      <section className="admin-panel activity-panel"><div className="panel-heading"><div><small>Live activity</small><h2>Today</h2></div></div>
        <div className="activity-list"><div><span className="green">✓</span><p><strong>Honda Click returned</strong><small>Inspected by M. Dela Cruz · 1:42 PM</small></p></div><div><span className="orange">!</span><p><strong>License needs review</strong><small>Booking DM-2026-1842 · 12:08 PM</small></p></div><div><span className="blue">₱</span><p><strong>Payment recorded</strong><small>₱3,900 · GCash · 10:31 AM</small></p></div><div><span>✉</span><p><strong>3 unread inquiries</strong><small>Messenger and contact form</small></p></div></div>
      </section>
      <section className="admin-panel revenue-panel"><div className="panel-heading"><div><small>August performance</small><h2>Revenue overview</h2></div><select aria-label="Revenue period"><option>This month</option><option>Last 30 days</option></select></div><div className="revenue-total"><strong>₱84,350</strong><span>↑ 12.4% vs. July</span></div><div className="bar-chart" aria-label="Weekly revenue chart"><i style={{height:"38%"}}/><i style={{height:"58%"}}/><i style={{height:"47%"}}/><i style={{height:"72%"}}/><i className="current" style={{height:"88%"}}/><i style={{height:"64%"}}/><i style={{height:"79%"}}/></div><div className="chart-labels"><span>W1</span><span>W2</span><span>W3</span><span>W4</span></div></section>
      <section className="admin-panel fleet-panel"><div className="panel-heading"><div><small>Fleet health</small><h2>Vehicle status</h2></div><button onClick={() => setActive("Vehicles")}>Manage →</button></div><div className="fleet-ring"><div><strong>92%</strong><small>Operational</small></div></div><ul><li><span className="dot green"/>Available <strong>{counts.available}</strong></li><li><span className="dot orange"/>Reserved <strong>{counts.reserved}</strong></li><li><span className="dot blue"/>On rent <strong>1</strong></li><li><span className="dot gray"/>Maintenance <strong>1</strong></li></ul></section>
    </div>
  </>;
}

function BookingTable({ bookings, compact = false, moveBooking }: { bookings: Booking[]; compact?: boolean; moveBooking?: (ref: string, status: BookingStatus) => void }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Booking</th><th>Customer</th><th>Vehicle & schedule</th><th>Verification</th><th>Status</th>{!compact && <th>Actions</th>}</tr></thead><tbody>{bookings.map(booking => <tr key={booking.ref}><td><strong>{booking.ref}</strong><small>{money.format(booking.amount)}</small></td><td><strong>{booking.customer}</strong><small>{booking.phone}</small></td><td><strong>{booking.vehicle}</strong><small>{booking.schedule}</small></td><td><span className={`status ${booking.verification.toLowerCase()}`}>{booking.verification}</span></td><td><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></td>{!compact && <td><div className="row-actions"><button onClick={() => moveBooking?.(booking.ref, "Confirmed")}>Approve</button><button onClick={() => moveBooking?.(booking.ref, "Rejected")}>Reject</button></div></td>}</tr>)}</tbody></table>{bookings.length === 0 && <div className="empty-state"><strong>No matching bookings</strong><p>Try another customer, vehicle, reference, or status.</p></div>}</div>;
}

function BookingsView({ bookings, moveBooking }: { bookings: Booking[]; moveBooking: (ref: string, status: BookingStatus) => void }) {
  return <section className="admin-panel full-panel"><div className="panel-heading"><div><small>Booking administration</small><h2>All booking requests</h2></div><div className="panel-filters"><button className="selected">All</button><button>Pending</button><button>Active</button></div></div><BookingTable bookings={bookings} moveBooking={moveBooking} /></section>;
}

function VehiclesView({ fleet, updateVehicle }: { fleet: FleetItem[]; updateVehicle: (slug: string, status: string) => void }) {
  return <section className="admin-panel full-panel"><div className="panel-heading"><div><small>Fleet management</small><h2>All {fleet.length} vehicles</h2></div></div><div className="admin-vehicle-grid">{fleet.map(item => <article key={item.slug}><span className={`vehicle-status ${item.status.toLowerCase()}`}>{item.status}</span><img className="vehicle-placeholder" src={item.image} alt="" /><div><small>{item.type} · {money.format(item.rate)}/day</small><strong>{item.name}</strong><select aria-label={`Status for ${item.name}`} value={item.status} onChange={event => updateVehicle(item.slug, event.target.value)}><option>Available</option><option>Reserved</option><option>Rented</option><option>Maintenance</option></select></div></article>)}</div></section>;
}

function ModuleView({ name }: { name: NavKey }) {
  const copy: Record<string, string> = {
    Customers: "Customer profiles, verification history, and contact records will appear here.", Rentals: "Track active releases, upcoming returns, overdue units, and inspections.", Messages: "Messenger and contact inquiries will appear after Meta credentials are connected.", Payments: "Record verified GCash, bank transfer, cash, deposit, and refund transactions.", Reports: "Review revenue, fleet utilization, booking sources, expenses, and downloadable summaries.", "Audit logs": "Every sensitive booking, payment, role, and settings change will be recorded here.", "Staff & roles": "Invite workers and control their permitted operational modules.", Policies: "Publish and version the rental terms shown to customers.", Settings: "Update business details, contact channels, hours, fees, and notification preferences.",
  };
  return <section className="admin-panel module-placeholder"><span>◇</span><p className="admin-kicker">Module prepared</p><h2>{name}</h2><p>{copy[name]}</p><button className="admin-secondary-button">Configure module</button></section>;
}
