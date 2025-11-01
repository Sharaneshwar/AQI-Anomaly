import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-brand">AtmosIQ</h3>
          <p className="footer-description">
            Real-time Air Quality Monitoring and Anomaly Detection System
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/aqi-info">AQI Information</a>
            </li>
            <li>
              <a href="/raw-data">Raw Data Dashboard</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Team</h4>
          <p className="team-name">🛡️ Vanguards</p>
          <p className="footer-text">
            Leading the way in air quality innovation
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Contact</h4>
          <p className="footer-text">Building a cleaner, healthier future</p>
          <p className="footer-text">Data-driven environmental solutions</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} <strong>Vanguards</strong>. All rights reserved.
        </p>
        <p className="footer-tagline">
          Empowering communities with air quality insights
        </p>
      </div>
    </footer>
  );
};

export default Footer;
