import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthenticated, isAuthenticated, getCurrentUser } from "../../utils/auth";
import "./Navbar.css";
import edgeProLogo from "../../assets/edge_prologo.png";

const NAV_ITEMS = [
  { label: "الرئيسية", to: "/" },
  { label: "صفحة الطلبات", to: "/BankEmployeePage" },
  { label: "صفحة المراجع", to: "/Reviewerpage" },
  { label: "الخدمات", href: "#services-section" },
  { label: "الأسئلة الشائعة", href: "#faq" },
  { label: "تواصل معنا", to: "/contactus" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const hamburgerRef = useRef(null);
  const requestsRef = useRef(null);
  const userMenuRef = useRef(null);

  /* ── Auth sync ─────────────────────────────────────────── */
  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(isAuthenticated());
      setCurrentUser(getCurrentUser());
    };
    syncAuth();
    window.addEventListener("authchange", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("authchange", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  /* ── Scroll shadow ─────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Body lock when menu open ──────────────────────────── */
  useEffect(() => {
    document.body.classList.toggle("nav-locked", menuOpen);
    return () => document.body.classList.remove("nav-locked");
  }, [menuOpen]);

  /* ── Close on outside click ────────────────────────────── */
  useEffect(() => {
    if (!menuOpen && !requestsOpen && !userMenuOpen) return;
    const handler = (e) => {
      const clickedInsidePanel = panelRef.current && panelRef.current.contains(e.target);
      const clickedHamburger = hamburgerRef.current && hamburgerRef.current.contains(e.target);
      const clickedInsideRequests = requestsRef.current && requestsRef.current.contains(e.target);
      const clickedInsideUserMenu = userMenuRef.current && userMenuRef.current.contains(e.target);
      if (!clickedInsidePanel && !clickedHamburger && !clickedInsideRequests && !clickedInsideUserMenu) {
        setMenuOpen(false);
        setRequestsOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, requestsOpen, userMenuOpen]);

  /* ── Close on Escape ───────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setRequestsOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const close = () => {
    setMenuOpen(false);
    setRequestsOpen(false);
    setUserMenuOpen(false);
  };

  const displayName = loggedIn && currentUser
    ? currentUser.type === "أفراد"
      ? currentUser.firstName || currentUser.username
      : currentUser.type === "شركات"
      ? currentUser.companyName || currentUser.username
      : currentUser.type === "بنوك"
      ? currentUser.bankName || currentUser.username
      : currentUser.username
    : "زائر";

  const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c.5-3.5 2.7-5.5 6.5-5.5s6 2 6.5 5.5" />
    </svg>
  );

  const handleLogout = () => {
    clearAuthenticated();
    setLoggedIn(false);
    setCurrentUser(null);
    close();
    navigate("/login");
  };

  return (
    <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`} dir="rtl">
      {/* ── Brand ─────────────────────────────────────────── */}
      <Link
        className="brand"
        to="/"
        aria-label="Real Estate Platform"
        onClick={close}
      >
        <img
          src={edgeProLogo}
          alt="EDGE PRO logo"
          className="nav-logo-img"
        />
      </Link>

      {/* ── Desktop nav links (center) ─────────────────────── */}
      <nav className="nav-links" aria-label="Main navigation">
        {NAV_ITEMS.map((item) =>
          item.to ? (
            <NavLink
              key={item.label}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ) : (
            <a key={item.label} className="nav-link" href={item.href}>
              {item.label}
            </a>
          )
        )}
        <div className="requests-menu" ref={requestsRef}>
          <button
            type="button"
            className={`nav-link requests-menu-trigger${requestsOpen ? " is-open" : ""}`}
            aria-expanded={requestsOpen}
            aria-haspopup="menu"
            onClick={() => setRequestsOpen((open) => !open)}
          >
            تسجيل الطلبات <span className="requests-chevron">⌄</span>
          </button>
          {requestsOpen && (
            <div className="requests-dropdown" role="menu">
              <Link className="requests-dropdown-item" to="/add-unit" onClick={close} role="menuitem">
                إضافة وحدة جديدة
              </Link>
              <Link className="requests-dropdown-item" to="/eligibility-request" onClick={close} role="menuitem">
                طلب التحقق من أهلية
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Desktop right actions ──────────────────────────── */}
      <div className="nav-actions">
        <div className="user-menu" ref={userMenuRef}>
          <button
            type="button"
            className={`user-chip${userMenuOpen ? " is-open" : ""}`}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            <span className="user-avatar"><UserIcon /></span>
            <span className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{loggedIn ? "حسابك على المنصة" : "تصفح الخدمات"}</span>
            </span>
            <svg className="user-menu-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
          </button>
          {userMenuOpen && (
            <div className="user-menu-dropdown" role="menu">
              {loggedIn ? (
                <>
                  <Link className="user-menu-item" to="/dashboard" onClick={close} role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></svg>
                    <span>لوحة التحكم</span>
                  </Link>
                  <button type="button" className="user-menu-item user-menu-logout" onClick={handleLogout} role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M15 16l4-4-4-4M19 12H9" /></svg>
                    <span>تسجيل الخروج</span>
                  </button>
                </>
              ) : (
                <>
                  <Link className="user-menu-item" to="/login" onClick={close} role="menuitem">تسجيل الدخول</Link>
                  <Link className="user-menu-item" to="/register" onClick={close} role="menuitem">إنشاء حساب</Link>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Hamburger ──────────────────────────────────────── */}
      <button
        type="button"
        ref={hamburgerRef}
        className={`hamburger ${menuOpen ? "is-open" : ""}`}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? " is-open" : ""}`}
        ref={panelRef}
        aria-hidden={!menuOpen}
      >
        {/* User row at top of mobile menu */}
        <div className="mobile-user">
          <span className="user-avatar"><UserIcon /></span>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">
              {loggedIn ? "حسابك على المنصة" : "تصفح الخدمات بسهولة"}
            </span>
          </div>
        </div>

        <div className="mobile-divider" />

        {/* Nav links */}
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <NavLink
                key={item.label}
                className={({ isActive }) =>
                  `mobile-link${isActive ? " is-active" : ""}`
                }
                to={item.to}
                onClick={close}
              >
                {item.label}
              </NavLink>
            ) : (
              <a
                key={item.label}
                className="mobile-link"
                href={item.href}
                onClick={close}
              >
                {item.label}
              </a>
            )
          )}
          <div className="mobile-requests-menu">
            <button
              type="button"
              className={`mobile-link mobile-requests-trigger${requestsOpen ? " is-open" : ""}`}
              aria-expanded={requestsOpen}
              onClick={() => setRequestsOpen((open) => !open)}
            >
              تسجيل الطلبات <span className="requests-chevron">⌄</span>
            </button>
            {requestsOpen && (
              <div className="mobile-requests-dropdown">
                <Link className="mobile-request-item" to="/add-unit" onClick={close}>
                  إضافة وحدة جديدة
                </Link>
                <Link className="mobile-request-item" to="/eligibility-request" onClick={close}>
                  طلب التحقق من أهلية
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="mobile-divider" />

        {/* Auth buttons */}
        <div className="mobile-auth">
          {loggedIn ? (
            <>
              <Link
                className="btn btn-ghost btn-full"
                to="/dashboard"
                onClick={close}
              >
                لوحة التحكم
              </Link>
              <button
                type="button"
                className="btn btn-danger btn-full"
                onClick={handleLogout}
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-ghost btn-full"
                to="/login"
                onClick={close}
              >
                تسجيل الدخول
              </Link>
              <Link
                className="btn btn-primary btn-full"
                to="/register"
                onClick={close}
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Backdrop ───────────────────────────────────────── */}
      {menuOpen && (
        <div className="mobile-backdrop" onClick={close} aria-hidden="true" />
      )}
    </header>
  );
}
