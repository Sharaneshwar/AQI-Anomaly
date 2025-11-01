// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import AQI_info from "./pages/AQI_info";
import AqiDashboard from "./pages/Raw_data_dashboard"; // adjust path if needed
import Footer from "./components/Footer/Footer";
import "./App.css";

function App() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <nav className="nav">
        <div className="nav-brand">
          <img src="/AtmosIQ.png" alt="AtmosIQ Logo" className="nav-logo" />
          <span className="nav-title">AtmosIQ</span>
        </div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/aqi-info">AQI Info</Link>
          </li>
          <li>
            <Link to="/raw-data">Raw Data Dashboard</Link>
          </li>
        </ul>
      </nav>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/aqi-info" element={<AQI_info />} />
          <Route path="/raw-data" element={<AqiDashboard />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
