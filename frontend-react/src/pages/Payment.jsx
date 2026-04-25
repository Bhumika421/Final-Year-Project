import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';

const NPR_RATE = 133;
const RATES = { NPR: 133, USD: 1, EUR: 0.92, INR: 83.5, GBP: 0.79 };

function extractPayPalApprovalUrl(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.approval_url === 'string' && data.approval_url.trim() !== '') return data.approval_url;
  if (typeof data.payment_url === 'string' && data.payment_url.trim() !== '') return data.payment_url;
  const pickFromLinks = (links) => {
    if (!Array.isArray(links)) return '';
    for (const link of links) {
      const rel = String(link?.rel || '');
      const href = String(link?.href || '');
      if ((rel === 'approve' || rel === 'payer-action') && href) return href;
    }
    for (const link of links) {
      const href = String(link?.href || '');
      if (href.includes('/checkoutnow?token=')) return href;
    }
    return '';
  };
  const fromTopLinks = pickFromLinks(data.links);
  if (fromTopLinks) return fromTopLinks;
  const fromRawLinks = pickFromLinks(data.raw?.links);
  if (fromRawLinks) return fromRawLinks;
  const orderId = String(data.order_id || '').trim();
  if (orderId) return `https://www.sandbox.paypal.com/checkoutnow?token=${encodeURIComponent(orderId)}`;
  return '';
}

function formatNPR(usd) {
  return 'NPR ' + new Intl.NumberFormat('en-NP').format(Math.round(Number(usd) * NPR_RATE));
}
function convertAmount(usd, to) {
  const rate = RATES[to] || 1;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(usd) * rate);
}

const KhaltiLogo = () => (
  <svg viewBox="0 0 120 40" width="90" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="8" fill="#5C2D91"/>
    <circle cx="20" cy="20" r="10" fill="#fff" opacity="0.15"/>
    <circle cx="20" cy="20" r="6" fill="#fff" opacity="0.3"/>
    <circle cx="20" cy="20" r="3" fill="#fff"/>
    <text x="36" y="26" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Arial">khalti</text>
  </svg>
);

const EsewaLogo = () => (
  <svg viewBox="0 0 120 40" width="90" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="8" fill="#60BB46"/>
    <path d="M12 20 C12 14 17 10 23 10 C29 10 34 14 34 20 C34 26 29 30 23 30 C17 30 12 26 12 20Z" fill="#fff" opacity="0.2"/>
    <path d="M15 20 C15 15.5 18.5 12 23 12 C27.5 12 31 15.5 31 20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="23" cy="20" r="3" fill="#fff"/>
    <text x="38" y="26" fill="#fff" fontSize="15" fontWeight="700" fontFamily="Arial">eSewa</text>
  </svg>
);

const CardLogo = () => (
  <svg viewBox="0 0 120 40" width="90" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="8" fill="#1e2d1e"/>
    <rect x="8" y="10" width="28" height="20" rx="3" fill="#a8d96b" opacity="0.8"/>
    <rect x="8" y="18" width="28" height="6" fill="#5fa832"/>
    <circle cx="48" cy="20" r="7" fill="#f59e0b" opacity="0.7"/>
    <circle cx="54" cy="20" r="7" fill="#f87171" opacity="0.7"/>
    <text x="65" y="25" fill="#a8d96b" fontSize="13" fontWeight="700" fontFamily="Arial">CARD</text>
  </svg>
);

const PayPalLogo = () => (
  <svg viewBox="0 0 120 40" width="90" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="8" fill="#003087"/>
    <path d="M20 10h14c4.8 0 8 2.9 7.2 7.4-.8 4.3-4.5 6.8-9.2 6.8h-4.6l-1.2 6.3h-6.5L20 10z" fill="#fff" opacity="0.95"/>
    <path d="M27.2 12.8h6.1c2.6 0 4 1.4 3.5 3.6-.5 2.5-2.4 3.8-5.1 3.8h-5.1l.6-3.2h4.8c.9 0 1.5-.4 1.6-1.1.2-.8-.3-1.2-1.3-1.2h-4.4l-.7 3.8h-4.2l1.3-6.7z" fill="#00A3E0"/>
    <text x="52" y="26" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial">PayPal</text>
  </svg>
);

export default function Payment() {
  const { bookingId } = useParams();
  const nav = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [method, setMethod] = useState('khalti');
  const [card, setCard] = useState({ card_number: '', card_name: '', expiry: '', cvv: '' });
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethodDone, setPaymentMethodDone] = useState('');
  const [paymentGatewayRef, setPaymentGatewayRef] = useState('');
  const [convertTo, setConvertTo] = useState('NPR');
  const [showConverter, setShowConverter] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function load() {
    if (!getToken()) { setErr('Please login first.'); setLoading(false); return; }
    try {
      const res = await api.get(`/api/bookings/${bookingId}`);
      setBooking(res.data.booking);
      if (res.data.booking.status === 'paid') setPaid(true);
       if (!paymentMethodDone) {
       const methodMap = { khalti: 'Khalti', esewa: 'eSewa', paypal: 'PayPal', card: 'Card', online: 'Online' };
        setPaymentMethodDone(methodMap[res.data.booking.payment_method] || 'Online');
      }
      if (!paymentRef) {
        setPaymentRef(res.data.booking.payment_ref || res.data.booking.provider_ref || '');
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Booking not found');
    } finally {
      setLoading(false);
    }
  }

  // FIX: Scroll to top whenever paid state becomes true
  useEffect(() => {
    if (paid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [paid]);

  useEffect(() => { load(); }, [bookingId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paypalCancelled = params.get('paypal_cancelled');
    const paypalOrderId = params.get('token');
    const callbackMethod = params.get('method');
    const esewaData = params.get('data');
    const esewaStatus = params.get('esewa_status');
    const esewaTxn = params.get('transaction_uuid') || params.get('transactionId') || params.get('esewa_txn_hint') || params.get('oid') || '';
    const esewaAmount = params.get('total_amount') || params.get('esewa_amount_hint') || params.get('amt') || '';
    const esewaRefId = params.get('ref_id') || params.get('refId') || '';
    const esewaGatewayStatus = params.get('status') || '';
    const esewaOid = params.get('oid') || '';
    const esewaAmt = params.get('amt') || '';
    const pidx = params.get('pidx');
    const status = params.get('status');



    if (paypalCancelled === '1') {
      setPortalLoading(false);
      setErr('PayPal payment was cancelled. You can try again.');
      window.history.replaceState({}, '', `/payment/${bookingId}`);
      return;
    }

    if (paypalOrderId) {
      setPortalLoading(false);
      (async () => {
        setPaying(true);
        try {
          const captureRes = await api.post('/api/payments/paypal/capture', {
            booking_id: Number(bookingId),
            order_id: paypalOrderId,
            idempotency_key: `paypal-${bookingId}-${paypalOrderId}`,
          });
          setEarnedPoints(captureRes.data.earned_points || 0);
          setPaymentRef(String(captureRes.data.provider_ref || paypalOrderId));
          setPaymentMethodDone('PayPal');
          setPaid(true);
          await load();
          window.history.replaceState({}, '', `/payment/${bookingId}`);
        } catch (e) {
          setErr(e?.response?.data?.error || 'PayPal capture failed. Please try again.');
          window.history.replaceState({}, '', `/payment/${bookingId}`);
        } finally {
          setPaying(false);
        }
      })();
      return;
    }

    const isEsewaCallback = callbackMethod === 'esewa' || Boolean(esewaData) || Boolean(esewaTxn) || Boolean(esewaRefId) || Boolean(esewaOid);
    if (isEsewaCallback) {
      setPortalLoading(false);
      if (esewaStatus === 'failed') {
        setErr('eSewa payment was cancelled or failed. Please try again.');
        window.history.replaceState({}, '', `/payment/${bookingId}`);
        return;
      }

      (async () => {
        setPaying(true);
        try {
          const verifyRes = await api.post('/api/payments/esewa/verify', {
            booking_id: Number(bookingId),
            data: esewaData || '',
            status: esewaGatewayStatus,
            transaction_uuid: esewaTxn,
            total_amount: esewaAmount,
            esewa_txn_hint: params.get('esewa_txn_hint') || '',
            esewa_amount_hint: params.get('esewa_amount_hint') || '',
            oid: esewaOid,
            amt: esewaAmt,
            ref_id: esewaRefId,
            idempotency_key: `esewa-${bookingId}-${esewaTxn || Date.now()}`,
          });
          setEarnedPoints(verifyRes.data.earned_points || 0);
          setPaymentRef(String(verifyRes.data.provider_ref || verifyRes.data.transaction_uuid || esewaTxn || ''));
          setPaymentGatewayRef(String(verifyRes.data.ref_id || esewaRefId || ''));
          setPaymentMethodDone('eSewa');
          setPaid(true);
          await load();
          window.history.replaceState({}, '', `/payment/${bookingId}`);
        } catch (e) {
          setErr(e?.response?.data?.error || 'eSewa verification failed. Please try again.');
          window.history.replaceState({}, '', `/payment/${bookingId}`);
        } finally {
          setPaying(false);
        }
      })();
      return;
    }

    if (!pidx) return;

    setPortalLoading(false);
    if (status === 'User canceled') {
      setErr('Khalti payment cancel gariyो।');
      window.history.replaceState({}, '', `/payment/${bookingId}`);
      return;
    }

    (async () => {
      setPaying(true);
      try {
        const verifyRes = await api.post('/api/payments/khalti/verify', {
          booking_id: Number(bookingId),
          pidx,
          transaction_id: params.get('transaction_id') || '',
          idempotency_key: `khalti-${bookingId}-${pidx}`,
        });

        if (verifyRes?.data?.ok || verifyRes?.data?.booking_id || verifyRes?.data?.status === 'paid') {
          setEarnedPoints(verifyRes.data.earned_points || 0);
          setPaymentRef(String(verifyRes.data.provider_ref || pidx || ''));
          setPaymentGatewayRef(String(verifyRes.data.transaction_id || ''));
          setPaymentMethodDone('Khalti');
          setPaid(true);
          await load();
          window.history.replaceState({}, '', `/payment/${bookingId}`);
        }
      } catch (e) {
        setErr(e?.response?.data?.error || 'Khalti verification ma error aayo.');
      } finally {
        setPaying(false);
      }
    })();
  }, [bookingId]);

  async function pay() {
    if (booking?.status === 'pending') {
      setErr('Booking must be approved by agency before payment.');
      return;
    }
    setErr(''); setPaying(true);
    try {
      if (method === 'khalti') {
        const res = await api.post('/api/payments/khalti/create', {
          booking_id: Number(bookingId),
          return_url: window.location.origin + `/payment/${bookingId}`,
        });
        const paymentUrl = String(res?.data?.payment_url || '');
        if (paymentUrl) {
          setPortalLoading(true);
          window.location.href = paymentUrl;
        } else {
          setErr(res?.data?.error || 'Khalti initiate garna sakiena. Dobara try gara.');
          setPortalLoading(false);
          setPaying(false);
        }
      } else if (method === 'paypal') {
        const res = await api.post('/api/payments/paypal/create', {
          booking_id: Number(bookingId),
          return_url: window.location.origin + `/payment/${bookingId}`,
          cancel_url: window.location.origin + `/payment/${bookingId}?paypal_cancelled=1`,
        });
        const approvalUrl = extractPayPalApprovalUrl(res?.data);
        if (approvalUrl) {
          setPortalLoading(true);
          window.location.href = approvalUrl;
        } else {
          setErr(res?.data?.error || 'PayPal checkout URL missing from server response.');
          setPortalLoading(false);
          setPaying(false);
        }
      } else if (method === 'esewa') {
        const res = await api.post('/api/payments/esewa/create', {
          booking_id: Number(bookingId),
          return_url: window.location.origin + `/payment/${bookingId}`,
        });
        const actionUrl = String(res?.data?.esewa?.action_url || '');
        const fields = res?.data?.esewa?.fields;
        if (!actionUrl || !fields || typeof fields !== 'object') {
          setErr('eSewa checkout data missing from server response.');
          setPortalLoading(false);
          setPaying(false);
          return;
        }
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = actionUrl;
        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value ?? '');
          form.appendChild(input);
        });
        document.body.appendChild(form);
        setPortalLoading(true);
        form.submit();
      } else {
        // Card simulated flow
        const payload = { booking_id: Number(bookingId), method, ...card };
        const res = await api.post('/api/payments/pay', payload);
        setEarnedPoints(res.data.earned_points || 0);
        setPaymentMethodDone('Card');
        setPaid(true);
        await load();
        setPaying(false);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Payment failed. Please try again.');
      setPortalLoading(false);
      setPaying(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', fontFamily: 'DM Sans, sans-serif', color: 'rgba(168,217,107,0.7)', fontSize: 15 }}>
      Loading...
    </div>
  );

  if (paying && !booking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', fontFamily: 'DM Sans, sans-serif', color: 'rgba(168,217,107,0.7)', fontSize: 15 }}>
      Verifying payment...
    </div>
  );

  if (err && !booking) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', fontFamily: 'DM Sans, sans-serif', color: '#f87171', textAlign: 'center', fontSize: 15 }}>
      {err}
    </div>
  );

  const methods = [
    { id: 'khalti', label: 'Khalti', logo: <KhaltiLogo />, accent: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.3)' },
    { id: 'esewa',  label: 'eSewa',  logo: <EsewaLogo />,  accent: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.3)' },
    { id: 'paypal', label: 'PayPal', logo: <PayPalLogo />, accent: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.3)' },
    { id: 'card',   label: 'Card',   logo: <CardLogo />,   accent: '#a8d96b', bg: 'rgba(168,217,107,0.08)', border: 'rgba(168,217,107,0.3)' },
  ];

  const activeMethod = methods.find(m => m.id === method);
  const bookingAwaitingApproval = booking?.status === 'pending';
  const paymentLocked = bookingAwaitingApproval;

  return (
    <>
      <style>{css}</style>
      {portalLoading && !paid && (
        <div className="p-portal-overlay" role="status" aria-live="polite">
          <div className="p-portal-card">
            <div className="p-portal-spinner" />
            <div className="p-portal-title">
              {method === 'khalti' ? 'Opening Khalti Portal...' : method === 'esewa' ? 'Opening eSewa Portal...' : 'Opening PayPal Checkout...'}
            </div>
            <div className="p-portal-sub">Secure redirection in progress. Please do not close or refresh this page.</div>
          </div>
        </div>
      )}
      <div className="p-wrap">

        <div className="p-header">
          <div className="p-header-eyebrow">Secure Checkout</div>
          <h1 className="p-header-title">{paid ? 'Booking Confirmed' : 'Complete Payment'}</h1>
          <div className="p-header-code">#{booking?.booking_code}</div>
        </div>

        {paid ? (
          <div className="p-success">
            <div className="p-success-ring">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#a8d96b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="p-success-title">Payment Successful!</h2>
            <p className="p-success-sub">Your tour has been booked. Check your notifications for confirmation.</p>
            {earnedPoints > 0 && (
              <div className="p-points-pill">+{earnedPoints} loyalty points earned</div>
            )}
            <div className="p-success-rows">
              <div className="p-success-row"><span>Booking</span><b>{booking?.booking_code}</b></div>
              <div className="p-success-row"><span>Tour</span><b>{booking?.title}</b></div>
              <div className="p-success-row"><span>Destination</span><b>{booking?.destination}</b></div>
              {!paymentRef && booking?.id && <div className="p-success-row"><span>Booking ID</span><b>#{booking.id}</b></div>}
              {paymentMethodDone && <div className="p-success-row"><span>Method</span><b>{paymentMethodDone}</b></div>}
              {paymentRef && <div className="p-success-row"><span>Reference Code</span><b>{paymentRef}</b></div>}
              {paymentGatewayRef && <div className="p-success-row"><span>Gateway Ref</span><b>{paymentGatewayRef}</b></div>}
              <div className="p-success-row"><span>Amount Paid</span><b style={{color:'#a8d96b'}}>{formatNPR(booking?.total_usd)}</b></div>
            </div>
            <div className="p-success-btns">
              {/* FIX: scrollTo top before navigating */}
              <button className="p-btn-solid" onClick={() => { window.scrollTo(0,0); nav('/bookings'); }}>View My Bookings</button>
              <button className="p-btn-outline" onClick={() => { window.scrollTo(0,0); nav('/tours'); }}>Browse More Tours</button>
            </div>
          </div>
        ) : (
          <div className="p-grid">
            <div className="p-col">
              <div className="p-card p-summary">
                <div className="p-card-label">Order Summary</div>
                {booking?.image_url && (
                  <div className="p-tour-img-wrap">
                    <img src={booking.image_url} alt={booking?.title} className="p-tour-img" />
                    <div className="p-tour-img-overlay" />
                    <div className="p-tour-img-title">{booking?.title}</div>
                  </div>
                )}
                <div className="p-tour-dest">{booking?.destination}</div>
                {booking?.travelers?.length > 0 && (
                  <div className="p-travelers">
                    <div className="p-travelers-label">Travelers ({booking.travelers.length})</div>
                    {booking.travelers.map((t, i) => (
                      <div key={i} className="p-traveler-item">
                        <div className="p-traveler-avatar">{(t.name || 'T')[0].toUpperCase()}</div>
                        <div>
                          <div className="p-traveler-name">{t.name || `Traveler ${i+1}`}</div>
                          {t.age && <div className="p-traveler-age">Age {t.age}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-divider" />
                <div className="p-price-rows">
                  <div className="p-price-row"><span>Subtotal</span><span>{formatNPR(booking?.subtotal_usd)}</span></div>
                  <div className="p-price-row"><span>Tax (13% VAT)</span><span>{formatNPR(booking?.tax_usd)}</span></div>
                  {Number(booking?.discount_usd) > 0 && (
                    <div className="p-price-row p-price-green"><span>Loyalty Discount</span><span>− {formatNPR(booking?.discount_usd)}</span></div>
                  )}
                </div>
                <div className="p-total-row">
                  <span>Total</span>
                  <span className="p-total-amount">{formatNPR(booking?.total_usd)}</span>
                </div>
                {bookingAwaitingApproval && (
                  <div className="p-approval-note">
                    Your booking is waiting for agency approval. Payment will unlock after approval.
                  </div>
                )}
                <button className="p-converter-btn" onClick={() => setShowConverter(v => !v)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  {showConverter ? 'Hide' : 'Convert'} Currency
                </button>
                {showConverter && (
                  <div className="p-converter">
                    <div className="p-converter-tabs">
                      {Object.keys(RATES).map(c => (
                        <button key={c} className={`p-converter-tab ${convertTo === c ? 'active' : ''}`} onClick={() => setConvertTo(c)}>{c}</button>
                      ))}
                    </div>
                    <div className="p-converter-result">
                      <span className="p-converter-currency">{convertTo}</span>
                      <span className="p-converter-amount">{convertAmount(booking?.total_usd, convertTo)}</span>
                    </div>
                    <div className="p-converter-note">Indicative rates · Not for financial advice</div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-col">
              <div className="p-card">
                <div className="p-card-label">Payment Method</div>
                <div className="p-methods">
                  {methods.map(m => (
                    <button key={m.id}
                      className={`p-method ${method === m.id ? 'active' : ''}`}
                      style={method === m.id ? { borderColor: m.border, background: m.bg } : {}}
                      onClick={() => setMethod(m.id)}>
                      <div className="p-method-logo">{m.logo}</div>
                      {method === m.id && (
                        <div className="p-method-check" style={{ background: m.accent }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-method-body" style={{ borderColor: activeMethod?.border, background: activeMethod?.bg }}>
                  {(method === 'khalti' || method === 'esewa' || method === 'paypal') && (
                    <div className="p-wallet-info">
                      <div className="p-wallet-logo">{activeMethod?.logo}</div>
                      <div className="p-wallet-name" style={{ color: activeMethod?.accent }}>Pay with {activeMethod?.label}</div>
                      <div className="p-wallet-desc">
                        {method === 'khalti' ? "Nepal's leading digital payment platform. Fast, secure & trusted by millions."
                          : method === 'esewa' ? "Nepal's most popular mobile wallet. Instant & hassle-free payments."
                          : 'Global secure checkout via PayPal. You will be redirected to PayPal to approve payment.'}
                      </div>
                      {method === 'khalti' && <div className="p-khalti-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Redirects to official Khalti page</div>}
                      {method === 'esewa' && <div className="p-wallet-note">Redirects to official eSewa gateway for secure payment.</div>}
                      {method === 'paypal' && <div className="p-khalti-badge" style={{ background: 'rgba(37,99,235,0.12)', borderColor: 'rgba(37,99,235,0.25)', color: 'rgba(147,197,253,0.9)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Redirects to official PayPal checkout</div>}
                    </div>
                  )}
                  {method === 'card' && (
                    <div className="p-card-form">
                      <div className="p-field">
                        <label>Card Number</label>
                        <input className="p-input" value={card.card_number}
                          onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,16); setCard(p => ({...p, card_number: v.replace(/(.{4})/g,'$1 ').trim()})); }}
                          placeholder="1234  5678  9012  3456" maxLength={19} />
                      </div>
                      <div className="p-field">
                        <label>Cardholder Name</label>
                        <input className="p-input" value={card.card_name} onChange={e => setCard(p => ({...p, card_name: e.target.value}))} placeholder="Ram Sharma" />
                      </div>
                      <div className="p-field-row">
                        <div className="p-field">
                          <label>Expiry</label>
                          <input className="p-input" value={card.expiry}
                            onChange={e => { let v = e.target.value.replace(/\D/g,'').slice(0,4); if (v.length >= 3) v = v.slice(0,2)+'/'+v.slice(2); setCard(p => ({...p, expiry: v})); }}
                            placeholder="MM/YY" maxLength={5} />
                        </div>
                        <div className="p-field">
                          <label>CVV</label>
                          <input className="p-input" value={card.cvv} onChange={e => setCard(p => ({...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4)}))} placeholder="•••" maxLength={4} type="password" />
                        </div>
                      </div>
                      <div className="p-card-note">Demo only — no real card is charged</div>
                    </div>
                  )}
                </div>
                {err && <div className="p-err">{err}</div>}
                <button className="p-pay-btn" onClick={pay} disabled={paying || paymentLocked}
                  style={{ background: (paying || paymentLocked) ? 'rgba(168,217,107,0.5)' : '#a8d96b' }}>
                  {paying ? (
                    <span className="p-pay-loading">
                      {method === 'khalti' ? 'Redirecting to Khalti...' : method === 'paypal' ? 'Redirecting to PayPal...' : method === 'esewa' ? 'Redirecting to eSewa...' : 'Processing...'}
                    </span>
                  ) : paymentLocked ? (
                    <span className="p-pay-loading">Waiting for agency approval...</span>
                  ) : (
                    <><span>Pay {formatNPR(booking?.total_usd)}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                  )}
                </button>
                <div className="p-secure">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  256-bit SSL encrypted · Safe & secure
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  .p-wrap { max-width: 1060px; margin: 0 auto; padding: 48px 24px 80px; font-family: 'DM Sans', sans-serif; color: #e8e4df; }
  .p-portal-overlay { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; background: rgba(8,12,11,0.75); backdrop-filter: blur(4px); padding: 24px; }
  .p-portal-card { width: min(420px, 100%); background: #0d1210; border: 1px solid rgba(168,217,107,0.22); border-radius: 18px; padding: 24px 22px; text-align: center; box-shadow: 0 18px 60px rgba(0,0,0,0.45); }
  .p-portal-spinner { width: 46px; height: 46px; border-radius: 50%; border: 3px solid rgba(168,217,107,0.18); border-top-color: #a8d96b; margin: 0 auto 16px; animation: pSpin 0.8s linear infinite; }
  .p-portal-title { font-family: 'Playfair Display', serif; font-size: 24px; color: #fff; margin-bottom: 8px; }
  .p-portal-sub { font-size: 13px; line-height: 1.65; color: rgba(232,228,223,0.55); }
  @keyframes pSpin { to { transform: rotate(360deg); } }
  .p-header { text-align: center; margin-bottom: 44px; }
  .p-header-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(168,217,107,0.7); margin-bottom: 12px; }
  .p-header-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: #fff; margin: 0 0 10px; line-height: 1.15; }
  .p-header-code { font-size: 13px; color: rgba(232,228,223,0.3); letter-spacing: 0.08em; font-weight: 500; }
  .p-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
  .p-col { display: flex; flex-direction: column; gap: 0; }
  .p-card { background: #0d1210; border: 1px solid rgba(255,255,255,0.07); border-radius: 22px; padding: 26px; }
  .p-card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(168,217,107,0.5); margin-bottom: 20px; }
  .p-tour-img-wrap { position: relative; border-radius: 14px; overflow: hidden; margin-bottom: 14px; }
  .p-tour-img { width: 100%; height: 155px; object-fit: cover; display: block; }
  .p-tour-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,12,11,0.85) 0%, transparent 60%); }
  .p-tour-img-title { position: absolute; bottom: 12px; left: 14px; right: 14px; font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #fff; line-height: 1.3; }
  .p-tour-dest { font-size: 12px; color: rgba(232,228,223,0.38); margin-bottom: 16px; }
  .p-travelers { margin-bottom: 16px; }
  .p-travelers-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(232,228,223,0.25); margin-bottom: 10px; }
  .p-traveler-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .p-traveler-avatar { width: 28px; height: 28px; border-radius: 8px; background: rgba(168,217,107,0.1); color: #a8d96b; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .p-traveler-name { font-size: 13px; font-weight: 600; color: #e8e4df; }
  .p-traveler-age { font-size: 11px; color: rgba(232,228,223,0.3); }
  .p-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 16px 0; }
  .p-price-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .p-price-row { display: flex; justify-content: space-between; font-size: 13px; color: rgba(232,228,223,0.45); }
  .p-price-green { color: #a8d96b; }
  .p-total-row { display: flex; justify-content: space-between; align-items: baseline; padding: 14px 0 0; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 4px; }
  .p-total-row span:first-child { font-size: 13px; font-weight: 600; color: rgba(232,228,223,0.5); text-transform: uppercase; letter-spacing: 0.06em; }
  .p-total-amount { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #a8d96b; }
  .p-approval-note { margin-top: 12px; padding: 10px 12px; border: 1px solid rgba(251,191,36,0.35); background: rgba(251,191,36,0.08); color: #fde68a; border-radius: 10px; font-size: 12px; line-height: 1.5; }
  .p-converter-btn { display: flex; align-items: center; gap: 7px; background: none; border: 1px solid rgba(168,217,107,0.15); color: rgba(168,217,107,0.5); font-size: 12px; font-weight: 600; padding: 7px 16px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 16px; transition: all 0.2s; width: 100%; justify-content: center; }
  .p-converter-btn:hover { border-color: rgba(168,217,107,0.35); color: #a8d96b; }
  .p-converter { background: rgba(168,217,107,0.04); border: 1px solid rgba(168,217,107,0.1); border-radius: 14px; padding: 16px; margin-top: 10px; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .p-converter-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
  .p-converter-tab { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(232,228,223,0.4); font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; letter-spacing: 0.04em; }
  .p-converter-tab.active { background: rgba(168,217,107,0.12); border-color: rgba(168,217,107,0.3); color: #a8d96b; }
  .p-converter-result { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
  .p-converter-currency { font-size: 13px; font-weight: 700; color: rgba(232,228,223,0.4); }
  .p-converter-amount { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #a8d96b; }
  .p-converter-note { font-size: 10px; color: rgba(232,228,223,0.2); letter-spacing: 0.03em; }
  .p-methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
  .p-method { position: relative; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.18s; }
  .p-method:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); }
  .p-method.active { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
  .p-method-logo { display: flex; align-items: center; justify-content: center; }
  .p-method-check { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .p-method-body { border: 1px solid; border-radius: 16px; padding: 20px; margin-bottom: 20px; transition: all 0.2s; }
  .p-wallet-info { text-align: center; }
  .p-wallet-logo { display: flex; justify-content: center; margin-bottom: 14px; }
  .p-wallet-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .p-wallet-desc { font-size: 13px; color: rgba(232,228,223,0.45); line-height: 1.65; margin-bottom: 12px; }
  .p-wallet-note { font-size: 11px; color: rgba(232,228,223,0.22); font-style: italic; }
  .p-khalti-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.25); color: rgba(167,139,250,0.8); font-size: 11px; font-weight: 600; padding: 5px 14px; border-radius: 100px; }
  .p-card-form { display: flex; flex-direction: column; gap: 14px; }
  .p-field { display: flex; flex-direction: column; gap: 6px; }
  .p-field label { font-size: 10px; font-weight: 700; color: rgba(232,228,223,0.35); letter-spacing: 0.08em; text-transform: uppercase; }
  .p-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .p-input { background: #080c0b; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #e8e4df; font-family: 'DM Sans', sans-serif; font-size: 15px; padding: 11px 14px; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
  .p-input:focus { border-color: rgba(168,217,107,0.45); }
  .p-card-note { font-size: 11px; color: rgba(232,228,223,0.2); text-align: center; font-style: italic; }
  .p-err { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); color: #f87171; padding: 11px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 14px; }
  .p-pay-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; color: #0a0e0d; border: none; border-radius: 100px; padding: 15px; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.15s, filter 0.2s; margin-bottom: 12px; }
  .p-pay-btn:hover:not(:disabled) { filter: brightness(1.08); transform: scale(1.02); }
  .p-pay-btn:disabled { cursor: not-allowed; }
  .p-pay-loading { opacity: 0.7; }
  .p-secure { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: rgba(232,228,223,0.22); letter-spacing: 0.03em; }
  .p-success { max-width: 500px; margin: 0 auto; text-align: center; background: #0d1210; border: 1px solid rgba(168,217,107,0.12); border-radius: 24px; padding: 44px 36px; animation: fadeIn 0.4s ease; }
  .p-success-ring { width: 80px; height: 80px; border-radius: 50%; background: rgba(168,217,107,0.1); border: 2px solid rgba(168,217,107,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
  .p-success-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #fff; margin: 0 0 10px; }
  .p-success-sub { font-size: 14px; color: rgba(232,228,223,0.4); margin: 0 0 20px; line-height: 1.6; }
  .p-points-pill { display: inline-block; background: rgba(168,217,107,0.1); border: 1px solid rgba(168,217,107,0.25); color: #a8d96b; font-size: 12px; font-weight: 700; padding: 6px 18px; border-radius: 100px; margin-bottom: 24px; letter-spacing: 0.04em; }
  .p-success-rows { text-align: left; margin-bottom: 28px; }
  .p-success-row { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; color: rgba(232,228,223,0.45); }
  .p-success-row b { color: #fff; font-weight: 600; }
  .p-success-btns { display: flex; flex-direction: column; gap: 10px; }
  .p-btn-solid { background: #a8d96b; color: #0a0e0d; border: none; border-radius: 100px; padding: 13px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s; }
  .p-btn-solid:hover { background: #c1e88d; transform: scale(1.02); }
  .p-btn-outline { background: none; color: rgba(232,228,223,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; padding: 12px 28px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .p-btn-outline:hover { border-color: rgba(255,255,255,0.2); color: #e8e4df; }
  @media(max-width: 768px) { .p-grid { grid-template-columns: 1fr; } .p-methods { grid-template-columns: 1fr 1fr; } }
  @media(max-width: 480px) { .p-methods { grid-template-columns: 1fr; } .p-field-row { grid-template-columns: 1fr; } }
`;