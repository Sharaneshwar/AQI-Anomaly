import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AqiInfo from "./pages/AqiInfo";
import Dashboard from "./pages/Dashboard";
import Anomaly from "./pages/Anomaly";
import Chat from "./pages/Chat";
import SitePage from "./pages/SitePage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "sonner";

function App() {
  const isChat = typeof window !== "undefined" && window.location.pathname === "/chat";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toaster theme="dark" position="top-right" richColors />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/aqi-info" element={<AqiInfo />} />
          <Route path="/raw-data" element={<Dashboard />} />
          <Route path="/anomaly" element={<Anomaly />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/sites/:siteId" element={<SitePage />} />
        </Routes>
      </main>
      {!isChat && <Footer />}
    </div>
  );
}

export default App;
