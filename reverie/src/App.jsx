import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Trade from "./pages/Trade.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/trade" element={<Trade />} />
    </Routes>
  );
}
