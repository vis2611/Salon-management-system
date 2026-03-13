import { Link } from "react-router-dom";

function Navbar(){
  return (
    <nav className="flex justify-between p-4 bg-black text-white">
      <h1 className="text-xl font-bold">Salon</h1>

      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/services">Services</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  )
}

export default Navbar;