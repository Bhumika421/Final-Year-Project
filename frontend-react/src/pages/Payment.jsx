import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Toast } from '../components/Toast.jsx';

export default function Payment() {
  const { bookingId } = useParams();
  const loc = useLocation();
  const [booking, setBooking] = useState(null);
  const [msg, setMsg] = useState('');
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ card_number:'', card_name:'', expiry:'', cvv:'' });

  async function load() {
    setMsg('');
    if (!getToken()) { setMsg('Please login first.'); return; }
    const res = await api.get(`/api/bookings/${bookingId}`);
    setBooking(res.data.booking);
  }

  useEffect(()=>{ load(); }, [bookingId]);

  async function pay() {
    setMsg('');
    try {
      const payload = { booking_id: Number(bookingId), method, ...card };
      const res = await api.post('/api/payments/pay', payload);
      setMsg(`Payment success ✅ Ref: ${res.data.provider_ref} • Earned points: ${res.data.earned_points}`);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Payment failed');
    }
  }

  async function convert(to) {
    const res = await api.get('/api/currency/convert', { params: { amount: booking.total_usd, from:'USD', to } });
    setMsg(`Converted total: ${res.data.converted} ${to} (demo rates)`);
  }

  if (msg && !booking) return <div className="card">{msg}</div>;
  if (!booking) return <div className="card">Loading...</div>;

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Payment</h2>
        <div className="small">Booking: <b>{booking.booking_code}</b> • Status: <b>{booking.status}</b></div>
        <div style={{marginTop:8, fontWeight:900, fontSize:22}}>Total: ${Number(booking.total_usd).toFixed(2)} USD</div>
        <div className="row" style={{marginTop:8}}>
          <button className="btn secondary" onClick={()=>convert('CAD')}>Convert to CAD</button>
          <button className="btn secondary" onClick={()=>convert('NPR')}>Convert to NPR</button>
          <button className="btn secondary" onClick={()=>convert('EUR')}>Convert to EUR</button>
          <div style={{flex:1}} />
          <Link className="btn secondary" to="/bookings">Back</Link>
        </div>
        <Toast msg={msg} />
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Choose payment method</h3>
        <div className="row">
          <button className={method==='card' ? 'btn' : 'btn secondary'} onClick={()=>setMethod('card')}>Card</button>
          <button className={method==='wallet' ? 'btn' : 'btn secondary'} onClick={()=>setMethod('wallet')}>Wallet</button>
          <button className={method==='bank' ? 'btn' : 'btn secondary'} onClick={()=>setMethod('bank')}>Online Banking</button>
        </div>

        {booking.status === 'paid' ? (
          <div className="card" style={{marginTop:12}}>
            <div style={{fontWeight:800}}>Receipt</div>
            <div className="small">Paid booking confirmed. Check Notifications for confirmation message.</div>
          </div>
        ) : (
          <div className="card" style={{marginTop:12}}>
            {method === 'card' ? (
              <div className="grid">
                <div>
                  <div className="small">Card number</div>
                  <input className="input" value={card.card_number} onChange={e=>setCard(p=>({...p,card_number:e.target.value}))} placeholder="4111 1111 1111 1111" />
                </div>
                <div className="row">
                  <div style={{flex:2}}>
                    <div className="small">Name</div>
                    <input className="input" value={card.card_name} onChange={e=>setCard(p=>({...p,card_name:e.target.value}))} />
                  </div>
                  <div style={{flex:1}}>
                    <div className="small">Expiry</div>
                    <input className="input" value={card.expiry} onChange={e=>setCard(p=>({...p,expiry:e.target.value}))} placeholder="MM/YY" />
                  </div>
                  <div style={{flex:1}}>
                    <div className="small">CVV</div>
                    <input className="input" value={card.cvv} onChange={e=>setCard(p=>({...p,cvv:e.target.value}))} placeholder="123" />
                  </div>
                </div>
                <button className="btn" onClick={pay}>Pay now</button>
                <div className="small">This is a **simulated** payment for FYP demo (no real gateway).</div>
              </div>
            ) : (
              <div className="grid">
                <div className="small">This method is simulated. Click pay to confirm.</div>
                <button className="btn" onClick={pay}>Pay with {method}</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Day-wise itinerary</h3>
        {(booking.itinerary || []).length === 0 ? <div className="small">No itinerary found.</div> : (
          <div className="grid">
            {booking.itinerary.map((d, idx) => (
              <div className="card" key={idx}>
                <div style={{fontWeight:800}}>Day {d.day}: {d.title}</div>
                <div className="small">{d.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
