import { Link } from "react-router-dom";
import ConnectButton from "../components/ConnectButton.jsx";
import NewsTicker from "../components/NewsTicker.jsx";
import { useTheme } from "../hooks/useTheme.js";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      {/* Top Navbar */}
      <header style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "var(--space-md) var(--space-xl)", borderBottom: "1px solid var(--border-light)"
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--color-accent)" }}>
          REVERIE_TERMINAL
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          <button onClick={toggleTheme} style={{ background: "transparent", border: "1px solid var(--border-light)", color: "var(--text-primary)", cursor: "pointer", padding: "4px 8px" }}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <span style={{ color: "var(--color-accent)" }}>(●) System Operational</span>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-2xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid var(--border-focus)", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-accent)", marginBottom: "var(--space-xl)" }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent)" }}></span>
          V1 EVENT CONTRACTS LIVE
        </div>

        <h1 style={{ fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 700, letterSpacing: "-0.03em", textAlign: "center", lineHeight: 1.1, marginBottom: "var(--space-md)" }}>
          Professional Predictions.<br />
          <span style={{ color: "var(--color-accent)" }}>Optimized for Speed.</span>
        </h1>

        <p style={{ color: "var(--text-secondary)", textAlign: "center", maxWidth: "600px", fontSize: "1.1rem", marginBottom: "var(--space-2xl)" }}>
          Connect your wallet to access deep liquidity, high-leverage prediction markets, and sub-millisecond execution times on Somnia.
        </p>

        {/* Connect Box */}
        <div className="panel" style={{ width: "100%", maxWidth: "400px", padding: "var(--space-xl)", gap: "var(--space-md)", alignItems: "center", marginBottom: "var(--space-3xl)" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--color-accent)" }}>[]</span> Connect Wallet
          </div>
          
          <ConnectButton />
          
          <Link to="/trade" className="btn-connect" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            ENTER TERMINAL
          </Link>

          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "var(--space-md)", textAlign: "center" }}>
            By connecting, you agree to the Terms of Service
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-lg)", width: "100%", maxWidth: "1000px" }}>
          {[
            { title: "Deep Liquidity", desc: "Access DreamDEX liquidity pools ensuring minimal slippage on binary event contracts." },
            { title: "Low Fees", desc: "Optimized routing and protocol mechanics deliver industry-leading low fees." },
            { title: "Binary Outcomes", desc: "Trade UP or DOWN on top crypto assets with definitive short-term expiry windows." }
          ].map((feat, i) => (
            <div key={i} className="panel" style={{ padding: "var(--space-xl)" }}>
              <div style={{ width: 32, height: 32, border: "1px solid var(--border-focus)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-md)", color: "var(--color-accent)" }}>
                {i + 1}
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "var(--space-sm)" }}>{feat.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      <footer style={{ display: "flex", alignItems: "center", borderTop: "1px solid var(--border-light)", background: "var(--bg-panel)" }}>
        <div style={{ padding: "8px var(--space-md)", borderRight: "1px solid var(--border-light)", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" }}>
          LIVE FEED
        </div>
        <NewsTicker />
      </footer>
    </div>
  );
}
