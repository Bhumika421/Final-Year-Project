import React, { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost/khalti-initiate.php"; // tero PHP server URL

// ========================
// MAIN PAYMENT BUTTON
// ========================
export default function KhaltiPayment({ amount, productName, productId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          amount: amount,
          product_name: productName,
          product_id: productId,
          return_url: window.location.origin + "/payment-success",
          website_url: window.location.origin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Khalti payment page ma redirect
        window.location.href = data.payment_url;
      } else {
        setError("Payment initiate garna sakiena. Dobara try gara.");
        console.error(data.error);
      }
    } catch (err) {
      setError("Server sanga connect garna sakiena.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <img
        src="https://khalti.com/static/khalti-logo.png"
        alt="Khalti"
        style={styles.logo}
      />
      <p style={styles.amount}>रकम: Rs. {amount}</p>
      {error && <p style={styles.error}>{error}</p>}
      <button onClick={handlePay} disabled={loading} style={styles.button}>
        {loading ? "Processing..." : `Pay Rs. ${amount} with Khalti`}
      </button>
    </div>
  );
}

// ========================
// SUCCESS PAGE COMPONENT
// ========================
export function PaymentSuccess() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pidx = params.get("pidx");

    if (!pidx) {
      setStatus("error");
      setMessage("Payment info bhettiyena.");
      return;
    }

    // Verify payment
    fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", pidx }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(`Payment successful! Rs. ${data.amount} received.`);
        } else {
          setStatus("error");
          setMessage(`Payment failed: ${data.status}`);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification garda error aayo.");
      });
  }, []);

  return (
    <div style={styles.container}>
      {status === "verifying" && <p>⏳ Verifying payment...</p>}
      {status === "success" && <p style={{ color: "green" }}>✅ {message}</p>}
      {status === "error" && <p style={{ color: "red" }}>❌ {message}</p>}
    </div>
  );
}

const styles = {
  container: {
    width: 300,
    border: "2px solid #5C2D91",
    margin: "0 auto",
    padding: 16,
    borderRadius: 8,
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  logo: { width: 150, marginBottom: 12 },
  amount: { fontSize: 18, fontWeight: "bold", color: "#5C2D91" },
  button: {
    background: "#5C2D91",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 6,
    cursor: "pointer",
    width: "100%",
    fontSize: 16,
  },
  error: { color: "red", fontSize: 14 },
};