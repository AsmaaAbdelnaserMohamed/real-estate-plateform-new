import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./BankEmployeePage.module.css";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { DOC_LABELS, formatDate, getBankEmployeeRequests } from "./requestData";
import { updateWorkflowRequest } from "../../utils/requestWorkflow";

const DEFAULT_DRAFT = {
  decision: "processing",
  note: "",
  visitDate: "2026-10-25",
};

const ICON_PATHS = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4M10 12h6M10 16h6" />
    </>
  ),
  building: (
    <>
      <path d="M5 21V4h10v17M15 9h4v12M9 8h2M9 12h2M9 16h2M3 21h18" />
    </>
  ),
  bank: <path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  shrink: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  save: (
    <>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v6h7V3M8 21v-7h8v7" />
    </>
  ),
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

const buildPinIcon = (code) =>
  L.divIcon({
    className: "",
    iconSize: [130, 64],
    iconAnchor: [65, 16],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;direction:rtl;font-family:inherit">
        <div style="width:32px;height:32px;border-radius:50%;background:#dc2626;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <span style="background:#1e293b;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;white-space:nowrap">موقع الوحدة #${code}</span>
      </div>`,
  });

function UnitMap({ lat, lng, code }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const map = L.map(elRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([lat, lng], map.getZoom());
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng], {
      icon: buildPinIcon(code),
      interactive: false,
      keyboard: false,
    }).addTo(map);
  }, [lat, lng, code]);

  useEffect(() => {
    mapRef.current?.invalidateSize();
    mapRef.current?.setView([lat, lng], mapRef.current.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={styles.mapWrap}>
      <div className={styles.mapHead}>
        <span className={styles.mapTitle}>📍 خريطة موقع الوحدة في الجهة</span>
        <button type="button" className={styles.gpsLink} onClick={copyCoords}>
          {copied ? "تم نسخ الإحداثيات" : "إحداثيات GPS متوفرة"}
        </button>
      </div>
      <div className={`${styles.map} ${expanded ? styles.mapExpanded : ""}`}>
        <div ref={elRef} className={styles.mapEl} />
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => setExpanded((value) => !value)}
        >
          <Icon name={expanded ? "shrink" : "expand"} size={12} />
          {expanded ? "تصغير الخريطة" : "تكبير الخريطة"}
        </button>
      </div>
    </div>
  );
}

export default function BankEmployeeRequestPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
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
  const [checks, setChecks] = useState(() =>
    Object.fromEntries(requests.map((request) => [request.id, [...request.docs]])),
  );
  const [drafts, setDrafts] = useState({});
  const [toast, setToast] = useState(null);
  const [successPopup, setSuccessPopup] = useState(false);
  const toastTimer = useRef(null);
  const active = requests.find((request) => String(request.id) === requestId);
  const draft = active
    ? { ...DEFAULT_DRAFT, ...drafts[active.id] }
    : DEFAULT_DRAFT;
  const docChecks = active ? checks[active.id] : [];
  const doneCount = docChecks.filter(Boolean).length;
  const allDone = active && doneCount === DOC_LABELS.length;

  useEffect(() => {
    if (!active) {
      navigate("/BankEmployeePage", { replace: true });
    }
  }, [active, navigate]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const updateDraft = (patch) =>
    setDrafts((current) => ({
      ...current,
      [active.id]: { ...DEFAULT_DRAFT, ...current[active.id], ...patch },
    }));

  const toggleDoc = (index) =>
    setChecks((current) => ({
      ...current,
      [active.id]: current[active.id].map((value, i) =>
        i === index ? !value : value,
      ),
    }));

  const confirmVisit = () => {
    if (!draft.visitDate) {
      showToast("اختر تاريخ المعاينة أولاً", "error");
      return;
    }
    showToast(`تم تثبيت موعد المعاينة بتاريخ ${formatDate(draft.visitDate)}`);
  };

  const saveDecision = () => {
    if (draft.decision === "reject" && !draft.note.trim()) {
      showToast("اكتب سبب الرفض قبل حفظ القرار", "error");
      return;
    }
    const nextStatus =
      draft.decision === "approve"
        ? "approved"
        : draft.decision === "reject"
          ? "rejected"
          : "review";
    const now = new Date().toISOString();

    if (active) {
      const updatedRequest = updateWorkflowRequest(active.workflowId || active.id, {
        status: nextStatus,
        decision: draft.decision,
        bankDecision: draft.decision,
        bankNote: draft.note,
        bankVisitDate: draft.visitDate,
        bankDecisionAt: now,
        bankNotification: {
          status: nextStatus,
          sentAt: now,
          message: "سيتم إخطار مقدم الطلب بالحالة الحالية.",
        },
      });

      if (!updatedRequest) {
        showToast("تعذر حفظ القرار، حاول مرة أخرى", "error");
        return;
      }
    }

    setSuccessPopup(true);
    window.setTimeout(() => navigate("/BankEmployeePage"), 2200);
  };

  return (
    <div className={styles.page} dir="rtl">
      <Navbar />
      {active && (
        <main className={`${styles.card} ${styles.details}`}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate("/BankEmployeePage")}
          >
            <Icon name="chevron" size={12} />
            العودة إلى قائمة الطلبات
          </button>
          <h2 className={styles.detailsTitle}>
            <span aria-hidden="true">📋</span> تفاصيل ملف التمويل: طلب رقم #
            {active.id}
          </h2>

          <div className={styles.twoCols}>
            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <span className={`${styles.panelIcon} ${styles.iconPurple}`}>
                    <Icon name="user" size={15} />
                  </span>
                  بيانات مقدم الطلب
                </div>
                <span className={styles.codeBadge}>
                  كود : {active.clientCode}
                </span>
              </header>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>اسم مقدم الطلب:</span>
                <span className={styles.infoValue}>
                  {active.applicant.name}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>رقم التليفون:</span>
                <span className={`${styles.infoValue} ${styles.ltr}`}>
                  {active.applicant.phone}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>البريد الإلكتروني:</span>
                <span
                  className={`${styles.infoValue} ${styles.ltr} ${styles.breakAll}`}
                >
                  {active.applicant.email}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>
                  الرقم القومي / الهوية:
                </span>
                <span className={`${styles.infoValue} ${styles.ltr}`}>
                  {active.applicant.nationalId}
                </span>
              </div>
            </section>

            <section className={styles.panel}>
              <header className={styles.panelHead}>
                <div className={styles.panelTitle}>
                  <span className={`${styles.panelIcon} ${styles.iconAmber}`}>
                    <Icon name="doc" size={15} />
                  </span>
                  المستندات المطلوبة{" "}
                  <span className={styles.en}>(Checklist)</span>
                </div>
                <span
                  className={`${styles.pill} ${allDone ? styles.pillGreen : styles.pillOrange}`}
                >
                  {allDone ? "مكتملة" : "غير مكتملة"} ({doneCount}/
                  {DOC_LABELS.length})
                </span>
              </header>

              {DOC_LABELS.map((doc, index) => (
                <div key={doc.title} className={styles.docItem}>
                  <div className={styles.docInfo}>
                    <span className={styles.docLabel}>
                      {index + 1}. {doc.title}
                    </span>
                    <span className={styles.docFilename}>
                      📎 {doc.filename}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.previewBtn}
                    onClick={() =>
                      window.open(doc.path, "_blank", "noopener,noreferrer")
                    }
                  >
                    معاينة
                    <Icon name="eye" size={11} />
                  </button>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={docChecks[index]}
                    onChange={() => toggleDoc(index)}
                    aria-label={`تم التحقق من: ${doc.title}`}
                  />
                </div>
              ))}

              <footer className={styles.panelFoot}>
                <button
                  type="button"
                  className={styles.zipBtn}
                  onClick={() =>
                    showToast("جارٍ تجهيز ملف الضغط (ZIP) للمرفقات")
                  }
                >
                  <Icon name="download" size={12} />
                  تحميل كافة المرفقات (ZIP)
                </button>
              </footer>
            </section>
          </div>

          <section className={`${styles.panel} ${styles.unitPanel}`}>
            <header className={styles.panelHead}>
              <div className={styles.panelTitle}>
                <span className={`${styles.panelIcon} ${styles.iconBlue}`}>
                  <Icon name="building" size={15} />
                </span>
                بيانات الوحدة المطلوبة للتمويل وموقعها الميداني
              </div>
              <span className={styles.codeBadge}>
                كود الوحدة : {active.unitCode}
              </span>
            </header>

            <div className={styles.twoCols}>
              <div className={styles.unitFields}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>كود الوحدة والحي:</span>
                  <span className={styles.infoValue}>
                    {active.unit.district}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    مواصفات وتقسيم الوحدة:
                  </span>
                  <span className={styles.infoValue}>{active.unit.spec}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    سجل الشهر العقاري / العقد:
                  </span>
                  <span className={styles.infoValue}>{active.unit.deed}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    القيمة التقديرية للوحدة:
                  </span>
                  <span className={`${styles.infoValue} ${styles.price}`}>
                    {active.unit.value}
                  </span>
                </div>
              </div>

              <UnitMap
                lat={active.unit.lat}
                lng={active.unit.lng}
                code={active.unitCode}
              />
            </div>
          </section>

          <section className={styles.decision}>
            <header className={styles.decisionHead}>
              <div className={styles.panelTitle}>
                <span className={`${styles.panelIcon} ${styles.iconNavy}`}>
                  <Icon name="bank" size={15} />
                </span>
                <div className={styles.decisionTitle}>قرار ورد البنك</div>
              </div>
              <span className={styles.officer}>
                المسؤول: أحمد محمود السعيد
              </span>
            </header>

            <div className={styles.options}>
              <label
                className={`${styles.option} ${draft.decision === "approve" ? styles.optionApprove : ""}`}
              >
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>
                    موافقة مبدئية معتمدة{" "}
                    <span className={styles.recommended}>موصى به</span>
                  </span>
                  <span className={styles.optionSub}>
                    الملف مستوفي لكافة الشروط والمستندات الائتمانية
                  </span>
                </span>
                <input
                  type="radio"
                  name="decision"
                  className={styles.radio}
                  checked={draft.decision === "approve"}
                  onChange={() => updateDraft({ decision: "approve" })}
                />
              </label>

              <label
                className={`${styles.option} ${draft.decision === "reject" ? styles.optionReject : ""}`}
              >
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>
                    غير موافق (رفض الطلب)
                  </span>
                  <span className={styles.optionSub}>
                    عدم استيفاء الشروط الائتمانية أو نقص أوراق
                  </span>
                </span>
                <input
                  type="radio"
                  name="decision"
                  className={styles.radio}
                  checked={draft.decision === "reject"}
                  onChange={() => updateDraft({ decision: "reject" })}
                />
              </label>

              <label
                className={`${styles.option} ${draft.decision === "processing" ? styles.optionProcessing : ""}`}
              >
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>قيد الدراسة والمراجعة</span>
                  <span className={styles.optionSub}>
                    يحتاج الطلب إلى استكمال الدراسة قبل إصدار قرار نهائي
                  </span>
                </span>
                <input
                  type="radio"
                  name="decision"
                  className={styles.radio}
                  checked={draft.decision === "processing"}
                  onChange={() => updateDraft({ decision: "processing" })}
                />
              </label>
            </div>

            {draft.decision === "approve" && (
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="visit-date">
                  تحديد موعد الزيارة والمعاينة الميدانية للعقار:
                </label>
                <div className={styles.visitRow}>
                  <input
                    id="visit-date"
                    type="date"
                    className={`${styles.control} ${styles.ltr}`}
                    value={draft.visitDate}
                    onChange={(event) =>
                      updateDraft({ visitDate: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={styles.btnDark}
                    onClick={confirmVisit}
                  >
                    <Icon name="calendar" size={13} />
                    تثبيت الموعد
                  </button>
                </div>
              </div>
            )}

            {draft.decision === "reject" && (
              <label className={styles.formField}>
                <span className={styles.formLabel}>سبب الرفض:</span>
                <input
                  className={styles.control}
                  placeholder="اكتب سبب الرفض بوضوح..."
                  value={draft.note}
                  onChange={(event) =>
                    updateDraft({ note: event.target.value })
                  }
                />
              </label>
            )}

            <p className={styles.notice}>
              سيتم إرسال إشعار فوري للعميل عبر الرسائل النصية والبريد
              الإلكتروني فور الاعتماد.
            </p>

            <div className={styles.decisionActions}>
              <button
                type="button"
                className={styles.btnGreen}
                onClick={saveDecision}
              >
                <Icon name="save" size={14} />
                حفظ القرار وإرسال الإشعار للعميل
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => navigate("/BankEmployeePage")}
              >
                حفظ كمسودة
              </button>
            </div>
          </section>
        </main>
      )}

      {toast && (
        <div
          role="status"
          className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}
        >
          {toast.message}
        </div>
      )}

      {successPopup && (
        <div className={styles.successPopup} role="alertdialog" aria-live="polite">
          <div className={styles.successContent}>
            <div className={styles.checkmarkWrapper}>
              <svg className={styles.checkmark} viewBox="0 0 52 52" aria-hidden="true">
                <circle
                  className={styles.checkmarkCircle}
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className={styles.checkmarkCheck}
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <p className={styles.successMessage}>
              تم حفظ القرار بنجاح
            </p>
            <p className={styles.successSubMessage}>
              سيتم إخطار مقدم الطلب بالحالة الحالية
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
