import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Services from "../pages/Services";

function AppRoutes(){
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        
        <Route path="/" element={<Home />} />
         <Route path="/services" element={<Services />} />
        {/*<Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> */}
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default AppRoutes;