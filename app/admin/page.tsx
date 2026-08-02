import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "./AdminDashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

function allowedAdminEmails() {
  return (process.env.ADMIN_EMAILS || "dashchar924@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const isAllowed = allowedAdminEmails().includes(user.email.toLowerCase());

  if (!isAllowed) {
    return (
      <main className="admin-access-page">
        <section className="admin-access-card">
          <Link className="admin-brand" href="/">
            <span className="admin-brand-mark">D</span>
            <span>DASH<strong>MOTO</strong><small>ADMIN PORTAL</small></span>
          </Link>
          <span className="access-icon">!</span>
          <p className="admin-kicker">Restricted area</p>
          <h1>This account is not authorized.</h1>
          <p>You are signed in as <strong>{user.email}</strong>. Ask the business owner to add this email to the administrator access list.</p>
          <div className="access-actions">
            <Link className="admin-primary-button" href="/">Return to website</Link>
            <a className="admin-secondary-button" href={chatGPTSignOutPath("/admin")}>Use another account</a>
          </div>
        </section>
      </main>
    );
  }

  return <AdminDashboard user={user} signOutPath={chatGPTSignOutPath("/")} />;
}
