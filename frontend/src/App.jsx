import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import AQI_info from "./pages/AQI_info";
import "./App.css";

function App() {
  return (
    <Router>
      <nav className="nav">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/aqi-info">AQI Info</Link></li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/aqi-info" element={<AQI_info />} />
      </Routes>
    </Router>
  );
}

export default App;
