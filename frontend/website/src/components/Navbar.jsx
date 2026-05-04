import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, User, LogOut, LayoutDashboard, Home } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isDark = isHome;

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

  // Close menus on route change
  useEffect(() => { setOpen(false); setUserMenu(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate("/"); setUserMenu(false); };

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Services", href: "/services", icon: null },
    { label: "Gallery", href: "/gallery", icon: null },
    { label: "Book Now", href: "/book", icon: null },
  ];

  const navBg = scrolled
    ? "rgba(8,8,8,0.96)"
    : isDark ? "transparent" : "rgba(245,240,232,0.96)";
  const navBorder = scrolled
    ? "rgba(201,168,76,0.15)"
    : isDark ? "transparent" : "rgba(28,58,47,0.1)";
  const textColor = isDark ? "#F0EAE0" : "#1C3A2F";
  const textMuted = isDark ? "rgba(240,234,224,0.45)" : "rgba(28,58,47,0.5)";

  const linkStyle = (href) => ({
    fontFamily: "DM Sans, sans-serif",
    fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase",
    textDecoration: "none",
    color: location.pathname === href ? "#C9A84C" : textMuted,
    transition: "color 0.3s",
    display: "flex", alignItems: "center", gap: "5px",
  });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      borderBottom: `1px solid ${navBorder}`,
      backdropFilter: scrolled ? "blur(20px)" : "none",
      transition: "background 0.5s ease, border-color 0.5s ease",
    }}>
      <div style={{
        maxWidth: "1400px", margin: "0 auto", padding: "0 5vw",
        height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo — always goes home (Fix 9) */}
        <Link to="/" className="flex items-center">
          <img
            src="/Salon.svg"
            alt="Hairtown"
            className="h-7 sm:h-8 md:h-9 lg:h-10 xl:h-11 w-auto transition-all duration-300"
          />
        </Link>
        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "36px" }} className="hidden-mobile">
          {navLinks.map(l => (
            <Link key={l.href} to={l.href}
              style={linkStyle(l.href)}
              onMouseEnter={e => e.currentTarget.style.color = "#C9A84C"}
              onMouseLeave={e => e.currentTarget.style.color = location.pathname === l.href ? "#C9A84C" : textMuted}>
              {l.icon && <l.icon size={11} />}
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }} className="hidden-mobile">
          {user ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setUserMenu(!userMenu)} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "DM Sans, sans-serif", fontSize: "10px",
                letterSpacing: "0.25em", textTransform: "uppercase",
                color: textMuted, transition: "color 0.3s",
              }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: "#C9A84C", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "#060606",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    : user.name?.[0]?.toUpperCase()
                  }
                </div>
                <span style={{ color: textMuted }}>{user.name?.split(" ")[0]}</span>
              </button>

              {userMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 12px)",
                  background: "#0F0F0F", border: "1px solid rgba(201,168,76,0.2)",
                  minWidth: "210px", zIndex: 200, borderRadius: "4px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}>
                  {/* Home link in dropdown (Fix 9) */}
                  <Link to="/" onClick={() => setUserMenu(false)} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "13px 20px", textDecoration: "none",
                    fontFamily: "DM Sans, sans-serif", fontSize: "11px",
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "rgba(240,234,224,0.5)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <Home size={13} /> Home
                  </Link>
                  <Link to="/profile" onClick={() => setUserMenu(false)} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "13px 20px", textDecoration: "none",
                    fontFamily: "DM Sans, sans-serif", fontSize: "11px",
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "rgba(240,234,224,0.5)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <User size={13} /> My Profile
                  </Link>
                  <Link to="/appointments" onClick={() => setUserMenu(false)} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "13px 20px", textDecoration: "none",
                    fontFamily: "DM Sans, sans-serif", fontSize: "11px",
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "rgba(240,234,224,0.5)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <LayoutDashboard size={13} /> My Bookings
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link to="/admin" onClick={() => setUserMenu(false)} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "13px 20px", textDecoration: "none",
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
                    padding: "13px 20px", width: "100%",
                    background: "none", border: "none", cursor: "pointer",
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
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Link to="/login" style={{
                fontFamily: "DM Sans, sans-serif", fontSize: "10px",
                letterSpacing: "0.3em", textTransform: "uppercase",
                textDecoration: "none", color: textMuted,
              }}>Login</Link>
              <Link to="/register" style={{
                fontFamily: "DM Sans, sans-serif", fontSize: "10px",
                letterSpacing: "0.3em", textTransform: "uppercase",
                textDecoration: "none", background: "#C9A84C",
                color: "#060606", padding: "10px 24px",
              }}>Register</Link>
            </div>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: textColor, display: "none",
        }} className="show-mobile">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: "#080808", borderTop: "1px solid rgba(201,168,76,0.12)",
          padding: "24px 5vw", display: "flex", flexDirection: "column", gap: "18px",
        }}>
          {navLinks.map(l => (
            <Link key={l.href} to={l.href} onClick={() => setOpen(false)} style={{
              fontFamily: "DM Sans, sans-serif", fontSize: "11px",
              letterSpacing: "0.3em", textTransform: "uppercase",
              textDecoration: "none",
              color: location.pathname === l.href ? "#C9A84C" : "rgba(240,234,224,0.6)",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              {l.icon && <l.icon size={12} />}
              {l.label}
            </Link>
          ))}
          <div style={{ height: "1px", background: "rgba(201,168,76,0.1)" }} />
          {user ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)} style={{ color: "rgba(240,234,224,0.6)", textDecoration: "none", fontSize: "11px", fontFamily: "DM Sans,sans-serif", letterSpacing: "0.2em", textTransform: "uppercase" }}>My Profile</Link>
              {user.role === "ADMIN" && (
                <Link to="/admin" onClick={() => setOpen(false)} style={{ color: "#C9A84C", textDecoration: "none", fontSize: "11px", fontFamily: "DM Sans,sans-serif", letterSpacing: "0.2em", textTransform: "uppercase" }}>Admin Panel</Link>
              )}
              <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(220,80,80,0.7)", textAlign: "left", fontSize: "11px", fontFamily: "DM Sans,sans-serif", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: "12px" }}>
              <Link to="/login" onClick={() => setOpen(false)} style={{ color: "rgba(240,234,224,0.6)", textDecoration: "none", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif" }}>Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} style={{ background: "#C9A84C", color: "#060606", padding: "8px 20px", textDecoration: "none", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif" }}>Register</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: block !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </nav>
  );
}