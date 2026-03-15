import { Link } from "react-router-dom";

function Navbar() {

  const navLinks = [
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Gallery", path: "/gallery" },
    { name: "Testimonials", path: "/testimonials" },
    { name: "Contact", path: "/contact" }
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(10,10,10,0.87)",
        borderBottom: "1px solid rgba(240,237,232,0.06)"
      }}
    >
      
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full border border-[#d4af82] flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#d4af82]" />
        </div>
        <span className="text-xl tracking-widest font-semibold text-[#d4af82]">SALON</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-10">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className="text-sm tracking-wide text-[#d4af82] transition"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Button */}
      <Link
        to="/booking"
        className="px-6 py-2.5 rounded-full hidden md:block bg-[#d4af82] text-black font-medium hover:opacity-90 transition"
      >
        BOOK NOW
      </Link>

    </nav>
  );
}

export default Navbar;