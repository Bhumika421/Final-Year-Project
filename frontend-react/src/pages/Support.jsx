import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';

export default function Support() {
  const [form, setForm] = useState({ name: '', email: '', category: 'General', message: '' });
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [my, setMy] = useState([]);
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setMsg(''); setIsError(false); setLoading(true);
    try {
      const res = await api.post('/api/support', form);
      setMsg(`Ticket submitted! Your code: ${res.data.ticket_code}`);
      setForm({ name: '', email: '', category: 'General', message: '' });
      if (getToken()) loadMy();
    } catch (e) {
      setIsError(true);
      setMsg(e?.response?.data?.error || 'Failed to submit ticket');
    } finally { setLoading(false); }
  }

  async function loadMy() {
    if (!getToken()) return;
    try {
      const res = await api.get('/api/support/my');
      setMy(res.data.items || []);
    } catch { setMy([]); }
  }

  useEffect(() => { loadMy(); }, []);

  function statusColor(s) {
    if (s === 'resolved' || s === 'answered' || s === 'closed') return '#a8d96b';
    if (s === 'open') return '#f59e0b';
    return '#94a3b8';
  }

  const categories = ['General', 'Booking', 'Payment', 'Tour Info', 'Complaint', 'Other'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .sp-wrap { max-width: 900px; margin: 0 auto; padding: 40px 24px 60px; font-family: 'DM Sans', sans-serif; }
        .sp-head { margin-bottom: 36px; }
        .sp-head-tag { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #a8d96b; margin-bottom: 8px; }
        .sp-head h1 { font-family: 'Playfair Display', serif; font-size: clamp(26px, 4vw, 38px); font-weight: 700; color: #fff; margin: 0 0 6px; }
        .sp-head p { font-size: 14px; color: rgba(240,237,232,0.45); margin: 0; }
        .sp-card { background: #131918; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 28px 28px; margin-bottom: 24px; }
        .sp-card-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 20px; }
        .sp-toast { border-radius: 12px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
        .sp-toast.ok { background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.3); color: #a8d96b; }
        .sp-toast.err { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; }
        .sp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .sp-form-group { margin-bottom: 14px; }
        .sp-label { font-size: 12px; font-weight: 600; color: rgba(240,237,232,0.5); margin-bottom: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
        .sp-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 11px 14px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .sp-input:focus { border-color: rgba(168,217,107,0.4); }
        .sp-input::placeholder { color: rgba(240,237,232,0.25); }
        .sp-cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .sp-cat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; padding: 6px 16px; font-size: 13px; color: rgba(240,237,232,0.6); cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .sp-cat.active { background: rgba(168,217,107,0.15); border-color: rgba(168,217,107,0.4); color: #a8d96b; }
        .sp-submit { width: 100%; background: #a8d96b; color: #1a2010; border: none; border-radius: 100px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 4px; }
        .sp-submit:hover:not(:disabled) { background: #c1e88d; }
        .sp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .sp-ticket { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; margin-bottom: 12px; }
        .sp-ticket-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
        .sp-ticket-code { font-size: 13px; font-weight: 700; color: #fff; font-family: monospace; background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 6px; }
        .sp-ticket-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; text-transform: capitalize; }
        .sp-ticket-date { font-size: 11px; color: rgba(240,237,232,0.35); margin-left: auto; }
        .sp-ticket-cat { font-size: 12px; color: rgba(240,237,232,0.45); margin-bottom: 6px; }
        .sp-ticket-msg { font-size: 13px; color: rgba(240,237,232,0.65); line-height: 1.55; margin-bottom: 8px; }
        .sp-ticket-reply { background: rgba(168,217,107,0.07); border: 1px solid rgba(168,217,107,0.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: rgba(240,237,232,0.7); margin-top: 8px; }
        .sp-ticket-reply b { color: #a8d96b; }
        .sp-empty { text-align: center; padding: 32px; font-size: 13px; color: rgba(240,237,232,0.35); }
        @media (max-width: 560px) { .sp-form-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="sp-wrap">
        <div className="sp-head">
          <div className="sp-head-tag"> Help Center</div>
          <h1>Customer Support</h1>
          <p>Submit a ticket and our team will get back to you as soon as possible.</p>
        </div>

        {/* submit form */}
        <div className="sp-card">
          <div className="sp-card-title">Submit a Ticket</div>
          {msg && <div className={`sp-toast ${isError ? 'err' : 'ok'}`}>{msg}</div>}
          <form onSubmit={submit}>
            <div className="sp-form-row">
              <div>
                <div className="sp-label">Your Name</div>
                <input className="sp-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ram Sharma" required />
              </div>
              <div>
                <div className="sp-label">Email</div>
                <input className="sp-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" required />
              </div>
            </div>
            <div className="sp-form-group">
              <div className="sp-label">Category</div>
              <div className="sp-cats">
                {categories.map(c => (
                  <button type="button" key={c} className={`sp-cat ${form.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="sp-form-group">
              <div className="sp-label">Message</div>
              <textarea className="sp-input" rows="5" value={form.message} onChange={e => set('message', e.target.value)} placeholder="Describe your issue in detail..." required />
            </div>
            <button className="sp-submit" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Ticket'}</button>
          </form>
        </div>

        {/* my tickets */}
        {getToken() && (
          <div className="sp-card">
            <div className="sp-card-title">My Tickets</div>
            {my.length === 0 ? (
              <div className="sp-empty">No tickets submitted yet.</div>
            ) : my.map(t => (
              <div className="sp-ticket" key={t.id}>
                <div className="sp-ticket-top">
                  <span className="sp-ticket-code">{t.ticket_code}</span>
                  <span className="sp-ticket-status" style={{ background: statusColor(t.status) + '22', color: statusColor(t.status) }}>{t.status}</span>
                  <span className="sp-ticket-date">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <div className="sp-ticket-cat">Category: <b style={{color:'rgba(240,237,232,0.7)'}}>{t.category}</b></div>
                <div className="sp-ticket-msg">{t.message}</div>
                {t.admin_reply && (
                  <div className="sp-ticket-reply"><b>Admin Reply:</b> {t.admin_reply}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
 