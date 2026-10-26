import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import DashboardHome from "./DashboardHome.jsx";
import "./Dashboard.css";
import {
  getUnits,
  getMortgageRequests,
  getClients,
} from "../../utils/localStorage";
import Map from "./Map.jsx";
import Leads from "./Leads.jsx";
import Mortgage from "./Mortgage.jsx"; // ✅ was imported but missing before

const PAGE_LABELS = {
  dashboard: "لوحة التحكم",
  units: "الوحدات العقارية",
  leads: "العملاء",
  mortgage: "طلبات التمويل",
  map: "الخريطة",
};

export default function Dashbord() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [units, setUnits] = useState([]);
  const [mortgageRequests, setMortgageRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setUnits(getUnits());
    setMortgageRequests(getMortgageRequests());
    setClients(getClients());
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    const handleDesktopChange = (event) => {
      if (event.matches) setIsSidebarOpen(false);
    };

    handleDesktopChange(desktopQuery);

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", handleDesktopChange);
      return () =>
        desktopQuery.removeEventListener("change", handleDesktopChange);
    }

    desktopQuery.addListener(handleDesktopChange);
    return () => desktopQuery.removeListener(handleDesktopChange);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) {
      document.body.classList.remove("nav-open");
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };

    document.body.classList.add("nav-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("nav-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  const handleNavigate = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  const handleOpenAddUnit = () => {
    setIsSidebarOpen(false);
    navigate("/add-unit");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardHome
            units={units}
            mortgageRequests={mortgageRequests}
            clients={clients}
            onAddUnit={handleOpenAddUnit}
          />
        );

      case "units":
        return (
          <div className="units-container">
            <div className="units-header">
              <h1 className="units-title">الوحدات العقارية</h1>
              <button
                type="button"
                onClick={handleOpenAddUnit /* <Link
                  className="requests-dropdown-item"
                  to="/add-unit"
                  onClick={close}
                  role="menuitem"
                >
                  إضافة وحدة جديدة
                </Link> */}
                className="primary-btn"
              >
                + إضافة وحدة
              </button>
            </div>

            <div className="units-grid">
              {units.map((unit) => {
                const statusClass =
                  unit.status === "متاح"
                    ? "unit-status--available"
                    : unit.status === "مباع"
                      ? "unit-status--sold"
                      : unit.status === "محجوز"
                        ? "unit-status--reserved"
                        : "unit-status--default";

                return (
                  <div key={unit.id} className="unit-card">
                    <div className="unit-name">{unit.name}</div>
                    <div className="unit-area">
                      {unit.area}
                      {unit.compound ? ` · ${unit.compound}` : ""}
                    </div>
                    <div className="unit-size">
                      {unit.size} م²
                      {unit.rooms ? ` · ${unit.rooms}` : ""}
                    </div>
                    <div className="unit-footer">
                      <span className="unit-price">
                        {(unit.price / 1_000_000).toFixed(2)}M ج.م
                      </span>
                      <span className={`unit-status ${statusClass}`}>
                        {unit.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "leads":
        return (
          <Leads clients={clients} /> // ✅ now passes clients as prop
        );

      case "mortgage":
        return (
          <Mortgage mortgageRequests={mortgageRequests} /> // ✅ was empty before
        );

      case "map":
        return <Map />;

      default:
        return <div className="page-wip">هذه الصفحة قيد التطوير...</div>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        active={activePage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="app-shell">
        <header className="mobile-topbar">
          <div className="mobile-topbar-copy">
            <div className="mobile-topbar-brand">
              Geo<span>Aqar</span>
            </div>
            <div className="mobile-topbar-page">
              {PAGE_LABELS[activePage] ?? "لوحة التحكم"}
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            aria-expanded={isSidebarOpen}
            aria-controls="primary-sidebar"
            aria-label="Toggle navigation"
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <span className="mobile-menu-btn-line" />
            <span className="mobile-menu-btn-line" />
            <span className="mobile-menu-btn-line" />
          </button>
        </header>

        <main className="app-main">{renderPage()}</main>
      </div>
    </div>
  );
}
