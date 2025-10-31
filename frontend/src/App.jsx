// src/App.jsx
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import AQI_info from "./pages/AQI_info";
import AqiDashboard from "./pages/Raw_data_dashboard"; // adjust path if needed
import "./App.css";

function App() {
  return (
    <>
      <nav className="nav">
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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aqi-info" element={<AQI_info />} />
        <Route path="/raw-data" element={<AqiDashboard />} />
      </Routes>
    </>
  );
}

export default App;
