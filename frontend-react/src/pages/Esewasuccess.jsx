import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function EsewaSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [details, setDetails] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        // eSewa v2 le base64 encoded JSON pathaucha ?data= ma
        const rawData = searchParams.get('data');

        if (!rawData) {
          setErr('eSewa bata response aएन। Payment confirm garna support lau.');
          setStatus('failed');
          return;
        }

        // Base64 decode
        const decoded = JSON.parse(atob(rawData));
        // decoded = { transaction_code, status, total_amount, transaction_uuid, product_code, signature, ... }

        if (decoded.status !== 'COMPLETE') {
          setErr(`Payment status: ${decoded.status}. Successful bhayena.`);
          setStatus('failed');
          return;
        }

        // localStorage bata bookingId nikal (Payment.jsx le rakheko thiyo)
        const savedBooking = JSON.parse(localStorage.getItem('esewaBooking') || '{}');

        // Backend ma verify gara (optional but recommended)
        try {
          await api.post('/api/esewa/verify', {
            data: rawData,
            booking_id: savedBooking.bookingId,
            transaction_uuid: decoded.transaction_uuid,
          });
        } catch (verifyErr) {
          // Backend verify fail bhayo bhane pani details dekhau
          console.warn('Backend verify failed:', verifyErr);
        }

        setDetails({
          txnCode: decoded.transaction_code,
          amount: decoded.total_amount,
          txnUuid: decoded.transaction_uuid || savedBooking.txnUuid,
          bookingId: savedBooking.bookingId,
        });

        setStatus('success');
        localStorage.removeItem('esewaBooking'); // cleanup

      } catch (e) {
        console.error(e);
        setErr('Response process garna sakiyena. Support lau.');
        setStatus('failed');
      }
    }

    verify();
  }, [searchParams]);

  // Auto redirect after success
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => navigate('/bookings'), 6000);
    return () => clearTimeout(t);
  }, [status, navigate]);

  return (
    <>
      <style>{css}</style>
      <div className="es-wrap">
        <div className="es-card">

          {/* VERIFYING */}
          {status === 'verifying' && (
            <>
              <div className="es-spinner" />
              <h2 className="es-title" style={{ color: '#e8e4df' }}>Verifying Payment...</h2>
              <p className="es-sub">eSewa bata response confirm gardaichhu, please wait.</p>
            </>
          )}

          {/* SUCCESS */}
          {status === 'success' && (
            <>
              <div className="es-icon-ring es-icon-green">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a8d96b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 className="es-title" style={{ color: '#a8d96b' }}>Payment Successful!</h2>
              <p className="es-sub">eSewa बाट भुक्तानी सफलतापूर्वक प्राप्त भयो। धन्यवाद! 🎉</p>

              {details && (
                <div className="es-info">
                  {details.txnCode && (
                    <div className="es-info-row">
                      <span>eSewa Txn Code</span>
                      <b>{details.txnCode}</b>
                    </div>
                  )}
                  {details.amount && (
                    <div className="es-info-row">
                      <span>Amount Paid</span>
                      <b style={{ color: '#a8d96b' }}>NPR {Number(details.amount).toLocaleString('en-NP')}</b>
                    </div>
                  )}
                  {details.txnUuid && (
                    <div className="es-info-row">
                      <span>Transaction ID</span>
                      <b style={{ fontSize: 12 }}>{details.txnUuid}</b>
                    </div>
                  )}
                  {details.bookingId && (
                    <div className="es-info-row">
                      <span>Booking ID</span>
                      <b>#{details.bookingId}</b>
                    </div>
                  )}
                </div>
              )}

              <p className="es-redirect-note">6 seconds ma My Bookings page ma redirect huncha...</p>

              <div className="es-btns">
                <button className="es-btn-solid" onClick={() => navigate('/bookings')}>📦 My Bookings</button>
                <button className="es-btn-outline" onClick={() => navigate('/')}>🏠 Home</button>
              </div>
            </>
          )}

          {/* FAILED */}
          {status === 'failed' && (
            <>
              <div className="es-icon-ring es-icon-red">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>

              <h2 className="es-title" style={{ color: '#f87171' }}>Payment Failed</h2>
              <p className="es-sub">{err || 'eSewa payment process garna sakiyena.'}</p>

              <div className="es-btns">
                <button className="es-btn-solid" style={{ background: '#f87171' }} onClick={() => navigate(-1)}>← Try Again</button>
                <button className="es-btn-outline" onClick={() => navigate('/support')}>📞 Support</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
  .es-wrap{min-height:80vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;font-family:'DM Sans',sans-serif;}
  .es-card{background:#0d1210;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:48px 36px;max-width:440px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.4);animation:fadeIn 0.4s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .es-spinner{width:56px;height:56px;border:3px solid rgba(168,217,107,0.15);border-top-color:#a8d96b;border-radius:50%;animation:spin 0.9s linear infinite;margin:0 auto 24px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .es-icon-ring{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;}
  .es-icon-green{background:rgba(168,217,107,0.1);border:2px solid rgba(168,217,107,0.25);}
  .es-icon-red{background:rgba(248,113,113,0.1);border:2px solid rgba(248,113,113,0.25);}
  .es-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin:0 0 10px;}
  .es-sub{font-size:14px;color:rgba(232,228,223,0.45);margin:0 0 24px;line-height:1.65;}
  .es-info{background:rgba(168,217,107,0.04);border:1px solid rgba(168,217,107,0.1);border-radius:14px;padding:16px;margin-bottom:20px;text-align:left;}
  .es-info-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:rgba(232,228,223,0.4);}
  .es-info-row:last-child{border-bottom:none;}
  .es-info-row b{color:#e8e4df;font-weight:600;}
  .es-redirect-note{font-size:12px;color:rgba(232,228,223,0.2);margin-bottom:24px;}
  .es-btns{display:flex;flex-direction:column;gap:10px;}
  .es-btn-solid{background:#a8d96b;color:#0a0e0d;border:none;border-radius:100px;padding:13px 28px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:filter 0.2s,transform 0.15s;}
  .es-btn-solid:hover{filter:brightness(1.08);transform:scale(1.02);}
  .es-btn-outline{background:none;color:rgba(232,228,223,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:12px 28px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;}
  .es-btn-outline:hover{border-color:rgba(255,255,255,0.2);color:#e8e4df;}
`;