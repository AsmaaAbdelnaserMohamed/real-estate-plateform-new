import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BankEmployeePage.module.css";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { formatDate, getBankEmployeeRequests } from "./requestData";

const STATUS_LABELS = {
  review: "قيد الدراسة والمراجعة",
  new: "طلب جديد",
  visit: "بانتظار المعاينة",
  approved: "الطلبات المقبولة",
  rejected: "الطلبات المرفوضة",
};

const MONTHS = [
  { value: "2026-10", label: "أكتوبر 2026 (الأحدث)" },
  { value: "2026-09", label: "سبتمبر 2026" },
];

const BRANCHES = [
  { value: "cairo", label: "فرع القاهرة الرئيسي" },
  { value: "giza", label: "فرع الجيزة" },
  { value: "alex", label: "فرع الإسكندرية" },
];

const STATS = [
  { key: "new", label: "الطلبات الجديدة", value: 3, tone: "blue" },
  { key: "visit", label: "بانتظار المعاينة", value: 1, tone: "orange" },
  { key: "approved", label: "معتمدة هذا الشهر", value: 18, tone: "green" },
];

const DEFAULT_FILTERS = {
  query: "",
  status: "all",
  month: "all",
  branch: "all",
};

const ICON_PATHS = {
  sliders: (
    <>
      <path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
};

function Icon({ name, size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export default function BankEmployeePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FILTERS);
  const [applied, setApplied] = useState(DEFAULT_FILTERS);
  const [workflowRevision, setWorkflowRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setWorkflowRevision((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("workflow-requests-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("workflow-requests-changed", refresh);
    };
  }, []);

  const requests = useMemo(() => getBankEmployeeRequests(), [workflowRevision]);

  const statusCounts = useMemo(() => {
    const counts = {};
    requests.forEach((request) => {
      counts[request.status] = (counts[request.status] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const query = applied.query.trim();
        if (
          query &&
          ![String(request.id), request.unitCode, request.clientCode].some(
            (value) => value.includes(query),
          )
        )
          return false;
        if (applied.status !== "all" && request.status !== applied.status)
          return false;
        if (applied.month !== "all" && !request.date.startsWith(applied.month))
          return false;
        if (applied.branch !== "all" && request.branch !== applied.branch)
          return false;
        return true;
      }),
    [applied, requests],
  );

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const applyFilters = () => setApplied({ ...form });
  const resetFilters = () => {
    setForm({ ...DEFAULT_FILTERS });
    setApplied(DEFAULT_FILTERS);
  };

  return (
    <div className={styles.page} dir="rtl">
      <Navbar />
      <section
        className={`${styles.card} ${styles.filterBar}`}
        aria-label="البحث والتصفية"
      >
        <div className={styles.filterTitle}>
          <span className={styles.filterIcon}>
            <Icon name="sliders" size={16} />
          </span>
          <div></div>
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            رقم الطلب / كود الوحدة / كود العميل
          </span>
          <span className={styles.searchWrap}>
            <input
              className={styles.control}
              value={form.query}
              onChange={setField("query")}
              onKeyDown={(event) => event.key === "Enter" && applyFilters()}
              inputMode="numeric"
            />
            <span className={styles.searchIcon}>
              <Icon name="search" size={13} />
            </span>
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>حالة الطلب</span>
          <select
            className={styles.control}
            value={form.status}
            onChange={setField("status")}
          >
            <option value="all">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label} ({statusCounts[value] || 0})
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>تاريخ الاستقبال</span>
          <select
            className={styles.control}
            value={form.month}
            onChange={setField("month")}
          >
            <option value="all">كل الشهور</option>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>الجهة / الفرع التابع</span>
          <select
            className={styles.control}
            value={form.branch}
            onChange={setField("branch")}
          >
            <option value="all">كل الفروع</option>
            {BRANCHES.map((branch) => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.filterActions}>
          <button
            type="button"
            className={styles.btnDark}
            onClick={applyFilters}
          >
            <Icon name="filter" size={13} />
            تطبيق
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={resetFilters}
          >
            إعادة تعيين
          </button>
        </div>
      </section>

      <div className={`${styles.layout} ${styles.listLayout}`}>
        <aside className={styles.sideCol}>
          <section
            className={`${styles.card} ${styles.listCard}`}
            aria-label="قائمة طلبات التمويل"
          >
            <div className={styles.listHead}>
              <h2 className={styles.listTitle}>قائمة طلبات التمويل</h2>
              <span className={styles.countBadge}>
                {filtered.length} طلبات مسجلة
              </span>
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>كود الوحدة</th>
                    <th>كود مقدم الطلب</th>
                    <th>تاريخ الاستقبال</th>
                    <th>الإجراء والتفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => (
                    <tr
                      key={request.id}
                      className={`${styles.row} ${styles[`row_${request.status}`] || ""}`}
                    >
                      <td>
                        <span className={styles.indexBadge}>{request.id}</span>
                      </td>
                      <td>{request.unitCode}</td>
                      <td>{request.clientCode}</td>
                      <td className={styles.dateCell}>
                        {formatDate(request.date)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.openBtn}
                          onClick={() =>
                            navigate(`/BankEmployeePage/${request.id}`)
                          }
                          aria-label={`فتح تفاصيل الطلب رقم ${request.id}`}
                        >
                          فتح
                          <Icon name="chevron" size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className={styles.empty}>
                  لا توجد طلبات مطابقة. غيّر معايير البحث أو اضغط «إعادة تعيين».
                </p>
              )}
            </div>
          </section>

          <div className={styles.stats}>
            {STATS.map((stat) => (
              <div key={stat.key} className={`${styles.card} ${styles.stat}`}>
                <div className={styles.statLabel}>{stat.label}</div>
                <div
                  className={`${styles.statValue} ${styles[`tone_${stat.tone}`]}`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}
