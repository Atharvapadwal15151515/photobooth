import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const isHomePage = location.pathname === "/";

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">PB</span>

          <div className="navbar-brand-text">
            <strong>Photo Booth</strong>
            <span>Create memories together</span>
          </div>
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          {!isHomePage && (
            <Link to="/" className="navbar-link">
              Home
            </Link>
          )}

          <Link to="/create" className="navbar-create-button">
            Create Booth
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;