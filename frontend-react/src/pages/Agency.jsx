import { useEffect, useState } from "react";
import { api } from "../api/client";

// read user directly from localStorage — no useAuth hook needed
function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

export default function Agency() {
  const [tours, setTours] = useState([]);
  const [myTours, setMyTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState("");
  const user = getUser();
  const [form, setForm] = useState({
    title: "", destination: "", category: "General", duration_days: 3, price_usd: 199, image_url: "", description: ""
  });

  async function load() {
    setErr("");
    try {
      const t = await api.get("/api/tours");
      setTours(t.data.items || []);
      const mine = await api.get("/api/agency/tours");
      setMyTours(mine.data.items || []);
      const b = await api.get("/api/agency/bookings");
      setBookings(b.data.items || []);
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Failed to load agency data");
    }
  }

  useEffect(() => { load(); }, []);

  async function createTour(e) {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/api/agency/tours", form);
      setForm({ title: "", destination: "", category: "General", duration_days: 3, price_usd: 199, image_url: "", description: "" });
      await load();
    } catch (ex) {
      setErr(ex?.response?.data?.error || "Failed to create tour");
    }
  }

  if (user && user.verification_status && user.verification_status !== 'verified') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Agency Portal</h2>
        <div className="small">
          Your agency account is currently <b>{user.verification_status}</b>. You can log in, but the dashboard is available after admin verification.
        </div>
        {user.verification_status === 'rejected' && (
          <div className="small" style={{ marginTop: 8 }}>Please contact support for next steps.</div>
        )}
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2>Agency Portal</h2>
        <p className="small">Submit tour packages for admin review and view bookings for your approved tours.</p>
        {err && <div className="small" style={{ color: "rgba(255,255,255,0.9)" }}>{err}</div>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div className="card">
          <h3>Add Tour Package</h3>
          <form onSubmit={createTour} className="grid" style={{ gap: 10 }}>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" required />
            <input className="input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Destination" required />
            <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category (e.g., Adventure)" required />
            <div className="row">
              <input className="input" style={{ flex: 1 }} value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: +e.target.value }))} type="number" min="1" placeholder="Days" required />
              <input className="input" style={{ flex: 1 }} value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: +e.target.value }))} type="number" min="0" step="0.01" placeholder="Price (USD)" required />
            </div>
            <input className="input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="Image URL (optional)" />
            <textarea className="input" style={{ minHeight: 90 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" />
            <button className="btn">Create Tour</button>
          </form>
        </div>

        <div className="card">
          <h3>Customer Bookings</h3>
          <div className="small">Bookings for your tours will appear here.</div>
          <hr />
          <div className="grid" style={{ gap: 10 }}>
            {bookings.length === 0 && <div className="small">No bookings yet.</div>}
            {bookings.map(b => (
              <div key={b.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <b>{b.title}</b>
                  <span className="badge">{b.status}</span>
                </div>
                <div className="small">{b.customer_name} • {b.customer_email}</div>
                <div className="small">Total: <b style={{ color: "white" }}>{b.total_usd}</b> USD • Code: {b.booking_code}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>My Tour Packages</h3>
        <div className="small">Packages you submit are <b>pending</b> until approved by admin.</div>
        <hr />
        <div className="grid" style={{ gap: 10 }}>
          {myTours.length === 0 && <div className="small">No packages submitted yet.</div>}
          {myTours.map(t => (
            <div key={t.id} className="card" style={{ padding: 12 }}>
              <div className="row" style={{ alignItems: 'center' }}>
                <b>{t.title}</b>
                <span className="badge">{t.approval_status}</span>
                <div style={{ flex: 1 }} />
                <span className="small">${Number(t.price_usd).toFixed(2)}</span>
              </div>
              <div className="small">{t.destination} • {t.category} • {t.duration_days} days</div>
              {t.approval_status === 'rejected' && t.rejection_reason && (
                <div className="small" style={{ marginTop: 6 }}><b>Reason:</b> {t.rejection_reason}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Public Tours (Active)</h3>
        <div className="grid tours" style={{ marginTop: 10 }}>
          {tours.slice(0, 8).map(t => (
            <div key={t.id} className="card hover">
              {t.image_url ? <img className="cover" src={t.image_url} alt={t.title} /> : null}
              <h3 style={{ marginTop: 10 }}>{t.title}</h3>
              <div className="small">{t.destination} • {t.category} • {t.duration_days} days</div>
              <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
                <span className="badge">${t.price_usd}</span>
                <span className="small">⭐ {t.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
