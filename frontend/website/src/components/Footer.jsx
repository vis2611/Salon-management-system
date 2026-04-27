import { Link } from "react-router-dom";

export default function Footer() {
  const links = [
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Book Now", href: "/book" },
    { label: "Login", href: "/login" },
  ];
  const services = ["Hair Styling", "Keratin", "Nail Art", "Facials", "Bridal Makeup", "Spa Therapy"];

  return (
    <footer style={{ background: "#040404", borderTop: "1px solid rgba(201,168,76,0.1)", position: "relative", overflow: "hidden" }}>
      {/* Top gold gradient line */}
      <div style={{ height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)" }} />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 6vw 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: "60px", marginBottom: "60px" }}>

          {/* Brand */}
          <div>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, letterSpacing: "0.1em", color: "#F0EAE0", lineHeight: 1 }}>
              Lumière
            </div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "8px", letterSpacing: "0.45em", textTransform: "uppercase", color: "#C9A84C", marginTop: "6px", marginBottom: "24px" }}>
              Salon & Spa
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "rgba(240,234,224,0.3)", lineHeight: 1.8, maxWidth: "280px" }}>
              Pune's destination for luxury hair, skin and wellness. Crafting confidence since 2018.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              {["IG", "FB", "TW"].map(s => (
                <a key={s} href="#" style={{
                  width: "36px", height: "36px",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "DM Sans, sans-serif", fontSize: "9px",
                  letterSpacing: "0.1em", color: "rgba(240,234,224,0.3)",
                  textDecoration: "none", transition: "all 0.3s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.color = "rgba(240,234,224,0.3)"; }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "8px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "24px" }}>
              Explore
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px" }}>
              {links.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "rgba(240,234,224,0.35)", textDecoration: "none", transition: "color 0.3s" }}
                    onMouseEnter={e => e.target.style.color = "#C9A84C"}
                    onMouseLeave={e => e.target.style.color = "rgba(240,234,224,0.35)"}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "8px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "24px" }}>
              Services
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px" }}>
              {services.map(s => (
                <li key={s} style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "rgba(240,234,224,0.25)" }}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "8px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "24px" }}>
              Visit Us
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Address", val: "123 MG Road, Koregaon Park\nPune, Maharashtra 411001" },
                { label: "Phone", val: "+91 98765 43210" },
                { label: "Hours", val: "Mon–Sat 9am–8pm\nSunday 10am–6pm" },
                { label: "Email", val: "hello@lumiere.salon" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,234,224,0.2)", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", color: "rgba(240,234,224,0.45)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(240,234,224,0.06)", paddingTop: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "rgba(240,234,224,0.2)" }}>
            © 2025 Lumière Salon & Spa. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service"].map(t => (
              <a key={t} href="#" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "rgba(240,234,224,0.2)", textDecoration: "none" }}>{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}