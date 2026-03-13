import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";


function AppRoutes(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes;