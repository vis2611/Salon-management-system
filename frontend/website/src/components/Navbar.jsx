import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isDark = isHome; // home is always dark background

  // Add/remove body class for custom cursor on home
  useEffect(() => {
    if (isHome) document.body.classList.add("salon-home");
    else document.body.classList.remove("salon-home");
    return () => document.body.classList.remove("salon-home");
  }, [isHome]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/"); setUserMenu(false); };

  const navLinks = [
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Book Now", href: "/book" },
  ];

  // Color logic
  const navBg = scrolled
    ? "rgba(8,8,8,0.96)"
    : isDark ? "transparent" : "rgba(245,240,232,0.96)";
  const navBorder = scrolled
    ? "rgba(201,168,76,0.15)"
    : isDark ? "transparent" : "rgba(28,58,47,0.1)";
  const textColor = isDark ? "#F0EAE0" : "#1C3A2F";
  const textMuted = isDark ? "rgba(240,234,224,0.45)" : "rgba(28,58,47,0.5)";
  const logoAccent = "#C9A84C";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      borderBottom: `1px solid ${navBorder}`,
      backdropFilter: scrolled ? "blur(20px)" : "none",
      transition: "background 0.5s ease, border-color 0.5s ease",
    }}>
      <div style={{
        maxWidth: "1400px", margin: "0 auto",
        padding: "0 5vw",
        height: "72px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "22px", fontWeight: 300, letterSpacing: "0.12em",
            color: textColor, transition: "color 0.4s",
          }}>
            Lumière
          </span>
          <span style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "8px", letterSpacing: "0.4em", textTransform: "uppercase",
            color: logoAccent, marginTop: "2px",
          }}>
            Salon & Spa
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }} className="hidden-mobile">
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
              textDecoration: "none",
              color: location.pathname === l.href ? "#C9A84C" : textMuted,
              transition: "color 0.3s",
            }}
              onMouseEnter={e => e.target.style.color = "#C9A84C"}
              onMouseLeave={e => e.target.style.color = location.pathname === l.href ? "#C9A84C" : textMuted}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right: auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }} className="hidden-mobile">
          {user ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setUserMenu(!userMenu)} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "none", border: "none", cursor: "none",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                color: textMuted, transition: "color 0.3s",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 500,
                  color: "#060606",
                }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                {user.name?.split(" ")[0]}
              </button>
              {userMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 12px)",
                  background: "#0F0F0F", border: "1px solid rgba(201,168,76,0.2)",
                  minWidth: "200px", zIndex: 200,
                }}>
                  <Link to="/profile" onClick={() => setUserMenu(false)} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "14px 20px", textDecoration: "none",
                    fontFamily: "DM Sans, sans-serif", fontSize: "11px",
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "rgba(240,234,224,0.6)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "color 0.2s",
                  }}>
                    <User size={13} /> My Profile
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link to="/admin" onClick={() => setUserMenu(false)} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "14px 20px", textDecoration: "none",
                      fontFamily: "DM Sans, sans-serif", fontSize: "11px",
                      letterSpacing: "0.2em", textTransform: "uppercase",
                      color: "#C9A84C",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <LayoutDashboard size={13} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "14px 20px", width: "100%",
                    background: "none", border: "none", cursor: "none",
                    fontFamily: "DM Sans, sans-serif", fontSize: "11px",
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "rgba(220,80,80,0.7)", textAlign: "left",
                  }}>
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
                textDecoration: "none", color: textMuted, transition: "color 0.3s",
              }}>
                Login
              </Link>
              <Link to="/register" style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
                textDecoration: "none",
                background: "#C9A84C", color: "#060606",
                padding: "10px 24px",
                transition: "background 0.3s",
              }}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} style={{
          background: "none", border: "none", cursor: "none",
          color: textColor, display: "none",
        }} className="show-mobile">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: "#080808", borderTop: "1px solid rgba(201,168,76,0.12)",
          padding: "24px 5vw",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          {navLinks.map((l) => (
            <Link key={l.href} to={l.href} onClick={() => setOpen(false)} style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
              textDecoration: "none", color: "rgba(240,234,224,0.6)",
            }}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)} style={{ color: "rgba(240,234,224,0.6)", textDecoration: "none", fontSize: "11px" }}>My Profile</Link>
              {user.role === "ADMIN" && <Link to="/admin" onClick={() => setOpen(false)} style={{ color: "#C9A84C", textDecoration: "none", fontSize: "11px" }}>Admin Panel</Link>}
              <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "none", color: "rgba(220,80,80,0.7)", textAlign: "left", fontSize: "11px" }}>Sign Out</button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "16px" }}>
              <Link to="/login" style={{ color: "rgba(240,234,224,0.6)", textDecoration: "none", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Login</Link>
              <Link to="/register" style={{ background: "#C9A84C", color: "#060606", padding: "8px 20px", textDecoration: "none", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Register</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}