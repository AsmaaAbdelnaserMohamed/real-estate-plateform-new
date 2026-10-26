import { Link, useNavigate } from "react-router-dom";
import { clearAuthenticated, getCurrentUser } from "../../utils/auth";

const navItems = [
  {
    id: "dashboard",
    label: "لوحة المؤشرات",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "units",
    label: "الوحدات",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "leads",
    label: "العملاء",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "mortgage",
    label: "طلبات التمويل",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  // {
  //   id: "map",
  //   label: "الخريطة",
  //   icon: (
  //     <svg
  //       width="18"
  //       height="18"
  //       viewBox="0 0 24 24"
  //       fill="none"
  //       stroke="currentColor"
  //       strokeWidth="2"
  //     >
  //       <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
  //       <line x1="8" y1="2" x2="8" y2="18" />
  //       <line x1="16" y1="6" x2="16" y2="22" />
  //     </svg>
  //   ),
  // },
];

export default function Sidebar({ active, onNavigate, isOpen, onClose }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    clearAuthenticated();
    navigate("/login");
  };

  const getUserName = () => {
    if (!currentUser) return "أ ع";
    if (currentUser.type === "أفراد") {
      return currentUser.firstName
        ? `${currentUser.firstName[0]} ${currentUser.lastName ? currentUser.lastName[0] : ""}`
        : currentUser.username.substring(0, 2);
    } else if (currentUser.type === "شركات") {
      return currentUser.companyName
        ? currentUser.companyName.substring(0, 2)
        : currentUser.username.substring(0, 2);
    } else if (currentUser.type === "بنوك") {
      return currentUser.bankName
        ? currentUser.bankName.substring(0, 2)
        : currentUser.username.substring(0, 2);
    }
    return currentUser.username.substring(0, 2);
  };

  const getUserFullName = () => {
    if (!currentUser) return "أسماء عبدالناصر";
    if (currentUser.type === "أفراد") {
      return currentUser.firstName
        ? `${currentUser.firstName} ${currentUser.lastName || ""}`
        : currentUser.username;
    } else if (currentUser.type === "شركات") {
      return currentUser.companyName || currentUser.username;
    } else if (currentUser.type === "بنوك") {
      return currentUser.bankName || currentUser.username;
    }
    return currentUser.username;
  };

  const getUserRole = () => {
    if (!currentUser) return "مدير الشركة";
    if (currentUser.type === "أفراد") return "مستخدم فردي";
    if (currentUser.type === "شركات") return "شركة عقارية";
    if (currentUser.type === "بنوك") return currentUser.role || "موظف بنك";
    return "مستخدم";
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop${isOpen ? " is-visible" : ""}`}
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        id="primary-sidebar"
        className={`sidebar${isOpen ? " is-open" : ""}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-brand-block">
            <div className="sidebar-logo">
              Geo<span>Aqar</span>
            </div>
            <p className="sidebar-caption">
              إدارة أسرع للوحدات والعملاء والطلبات
            </p>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            aria-label="Close navigation"
            onClick={onClose}
          >
            X
          </button>
        </div>
        {/* 
        <Link className="sidebar-home-link" to="/">
          العودة إلى الرئيسية
        </Link> */}

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={active === item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-nav-btn${active === item.id ? " active" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getUserName()}</div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{getUserFullName()}</div>
              <div className="sidebar-user-role">{getUserRole()}</div>
            </div>
          </div>

          <div className="sidebar-footer-actions">
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
