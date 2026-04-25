import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

export default function EsewaSuccess() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        // eSewa redirects back with these params
        const oid          = searchParams.get('oid')          || searchParams.get('transaction_uuid') || '';
        const refId        = searchParams.get('refId')        || searchParams.get('ref_id')           || '';
        const amt          = searchParams.get('amt')          || searchParams.get('total_amount')     || '';
        const bookingId    = searchParams.get('booking_id')   || '';

        if (!bookingId) {
          setStatus('error');
          setMsg('Missing booking information. Please contact support.');
          return;
        }

        // Call your backend to finalize payment
        const res = await api.post('/api/payments/pay', {
          booking_id:       Number(bookingId),
          method:           'esewa',
          transaction_uuid: oid,
          ref_id:           refId,
          amount:           amt,
        });

        if (res.data.ok) {
          setStatus('success');
          setTimeout(() => nav('/bookings'), 3000);
        } else {
          setStatus('error');
          setMsg(res.data.error || 'Payment verification failed.');
        }
      } catch (e) {
        setStatus('error');
        setMsg(e?.response?.data?.error || 'Payment verification failed. Please contact support.');
      }
    };

    verify();
  }, []);

  return (
    <>
      <style>{`
        .es-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0e0d;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }
        .es-card {
          background: #131918;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 440px;
          width: 100%;
          text-align: center;
        }
        .es-icon { font-size: 56px; margin-bottom: 20px; }
        .es-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
        }
        .es-sub {
          font-size: 14px;
          color: rgba(240,237,232,0.45);
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .es-btn {
          background: #a8d96b;
          color: #1a2010;
          border: none;
          border-radius: 100px;
          padding: 13px 32px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }
        .es-btn:hover { background: #c1e88d; }
        .es-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(168,217,107,0.2);
          border-top-color: #a8d96b;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="es-wrap">
        <div className="es-card">

          {status === 'verifying' && (
            <>
              <div className="es-spinner" />
              <div className="es-title">Verifying Payment...</div>
              <div className="es-sub">Please wait while we confirm your eSewa payment.</div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="es-icon">✅</div>
              <div className="es-title">Payment Successful!</div>
              <div className="es-sub">
                Your booking has been confirmed. Redirecting to your bookings...
              </div>
              <button className="es-btn" onClick={() => nav('/bookings')}>
                View My Bookings
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="es-icon">❌</div>
              <div className="es-title">Payment Failed</div>
              <div className="es-sub">{msg || 'Something went wrong. Please try again or contact support.'}</div>
              <button className="es-btn" onClick={() => nav('/bookings')}>
                Go to Bookings
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}