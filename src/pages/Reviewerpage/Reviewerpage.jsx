import { useEffect, useMemo, useState } from 'react';
import styles from './ReviewerPage.module.css';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { getWorkflowRequests, updateWorkflowRequest } from '../../utils/requestWorkflow';

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG, no external library)                            */
/* ------------------------------------------------------------------ */
const ICON_PATHS = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  idcard: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.5-1.5 5.5-1.5 6 0M14 10h4M14 14h4" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  check: <path d="m5 12 4 4 10-10" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  clip: (
    <path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" />
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16v.5" />
    </>
  ),
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock data (Egyptian) - replace with your API                       */
/* ------------------------------------------------------------------ */
const APPLICANTS = [
  {
    id: 8045,
    name: 'أحمد مصطفى كامل',
    fullName: 'أحمد مصطفى كامل عبد الرحمن',
    age: 34,
    job: 'مهندس اتصالات - قطاع خاص',
    ref: 'REF-8045-EG',
    date: '22/10/2026',
    governorate: 'القاهرة',
    address: 'القاهرة - حلوان',
    docs: [
      { id: 'a1', icon: 'file', tone: 'green', title: 'مفردات مرتب', meta: 'PDF • 1.4 MB • معتمد', url: `${import.meta.env.BASE_URL}pdfs/sample_salary.pdf` },
      { id: 'a2', icon: 'idcard', tone: 'blue', title: 'صورة بطاقة الرقم القومي', meta: 'سارية حتى 2029 (الوجهين)', url: `${import.meta.env.BASE_URL}pdfs/id_card.pdf` },
    ],
  },
  {
    id: 3674,
    name: 'محمد إبراهيم حسن',
    fullName: 'محمد إبراهيم حسن علي السيد',
    age: 41,
    job: 'محاسب - شركة مقاولات',
    ref: 'REF-3674-EG',
    date: '21/10/2026',
    governorate: 'القاهرة',
    address: 'القاهرة - المعادي',
    docs: [
      { id: 'b1', icon: 'file', tone: 'green', title: 'مفردات مرتب', meta: 'PDF • 1.1 MB • معتمد', url: `${import.meta.env.BASE_URL}pdfs/sample_salary.pdf` },
      { id: 'b2', icon: 'idcard', tone: 'blue', title: 'صورة بطاقة الرقم القومي', meta: 'سارية حتى 2028 (الوجهين)', url: `${import.meta.env.BASE_URL}pdfs/id_card.pdf` },
    ],
  },
];

const UNITS = [
  {
    id: 284,
    code: 'UNIT-284-CAI',
    address: 'القاهرة - المعادي',
    fullAddress: 'القاهرة، المعادي - شارع النصر، عمارة 14، الدور الثالث، شقة 7',
    type: 'شقة سكنية',
    date: '22-10-2026',
    utilities: [
      { label: 'مياه صالحة', ok: true },
      { label: 'كهرباء (عداد)', ok: true },
      { label: 'غاز طبيعي', ok: true },
    ],
    docs: [
      { id: 'u1', icon: 'file', tone: 'amber', title: 'صك / عقد ملكية الوحدة', meta: 'مسجل شهر عقاري • 4 صفحات' },
      { id: 'u2', icon: 'bolt', tone: 'violet', title: 'صورة إيصال مرافق حديث', meta: 'فاتورة كهرباء شهر 09/2026' },
    ],
  },
  {
    id: 362,
    code: 'UNIT-362-ASY',
    address: 'أسيوط',
    fullAddress: 'أسيوط، حي الوليدية - شارع الجمهورية، عمارة 6، الدور الثاني، شقة 4',
    type: 'شقة سكنية',
    date: '20-10-2026',
    utilities: [
      { label: 'مياه صالحة', ok: true },
      { label: 'كهرباء (عداد)', ok: true },
      { label: 'غاز طبيعي (غير متصل)', ok: false },
    ],
    docs: [
      { id: 'u3', icon: 'file', tone: 'amber', title: 'صك / عقد ملكية الوحدة', meta: 'مسجل شهر عقاري • 3 صفحات' },
      { id: 'u4', icon: 'bolt', tone: 'violet', title: 'صورة إيصال مرافق حديث', meta: 'فاتورة كهرباء شهر 09/2026' },
    ],
  },
  {
    id: 745,
    code: 'UNIT-745-BNS',
    address: 'بني سويف - الفشن',
    fullAddress: 'بني سويف، مركز الفشن - شارع المحطة، عمارة 3، الدور الأول، شقة 2',
    type: 'شقة سكنية',
    date: '19-10-2026',
    utilities: [
      { label: 'مياه صالحة', ok: true },
      { label: 'كهرباء (عداد)', ok: true },
      { label: 'غاز طبيعي', ok: true },
    ],
    docs: [
      { id: 'u5', icon: 'file', tone: 'amber', title: 'صك / عقد ملكية الوحدة', meta: 'مسجل شهر عقاري • 5 صفحات' },
      { id: 'u6', icon: 'bolt', tone: 'violet', title: 'صورة إيصال مرافق حديث', meta: 'فاتورة مياه شهر 09/2026' },
    ],
  },
];

const GOVERNORATES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'أسيوط', 'بني سويف'];
const UNIT_TYPES = ['شقة سكنية', 'دوبلكس', 'فيلا'];

/** Decision selected by default (matches the screenshots). Set to null to force an explicit choice. */
const DEFAULT_DECISION = 'eligible';

const REQUEST_FIELD_LABELS = {
  fullName: 'الاسم بالكامل', birthDate: 'تاريخ الميلاد', phone: 'رقم الهاتف', gender: 'النوع',
  identityType: 'نوع إثبات الهوية', nationalId: 'رقم الهوية', occupation: 'المهنة', maritalStatus: 'الحالة الاجتماعية',
  dependents: 'عدد المعالين', employmentType: 'نوع العمل', employer: 'جهة العمل', jobTitle: 'المسمى الوظيفي',
  contractType: 'نوع عقد العمل', workDuration: 'مدة العمل', monthlyIncome: 'الدخل الشهري', salaryTransferred: 'تحويل الراتب للبنك',
  otherIncome: 'مصادر دخل أخرى', loanInstallments: 'أقساط القروض الشهرية', otherCommitments: 'التزامات شهرية أخرى',
  governorate: 'المحافظة', area: 'المساحة بالمتر المربع', district: 'المنطقة / الحي', address: 'العنوان', housingType: 'نوع السكن', price: 'سعر العقار بالجنيه المصري',
  residenceDuration: 'مدة الإقامة', propertyType: 'نوع العقار', loanAmount: 'مبلغ التمويل المطلوب', duration: 'مدة التمويل',
  income: 'الدخل الشهري', bankPref: 'البنك المفضل', ownerName: 'اسم المالك', email: 'البريد الإلكتروني',
  propertyCondition: 'حالة العقار', usageType: 'نوع الاستخدام', unitType: 'نوع الوحدة', street: 'الشارع',
  buildingNumber: 'رقم المبنى', floor: 'الدور', unitNumber: 'رقم الوحدة', buildYear: 'سنة البناء',
  elevator: 'المصعد', condition: 'حالة الوحدة', utilities: 'المرافق المتصلة', rooms: 'عدد الغرف', kitchens: 'عدد المطابخ',
  bathrooms: 'عدد الحمامات', receptionRooms: 'عدد غرف الاستقبال', structuralIssues: 'مشاكل هيكلية', access: 'الوصول إلى العقار',
  parking: 'مواقف السيارات', nearbyServices: 'الخدمات القريبة', fullAddress: 'العنوان بالتفصيل', consultTopic: 'موضوع الاستشارة',
  consultDetails: 'تفاصيل الاستشارة', urgency: 'درجة الاستعجال', preferredContact: 'طريقة التواصل المفضلة',
  consultantName: 'اسم مقدم الاستشارة', consultantPhone: 'هاتف مقدم الاستشارة', consultantEmail: 'بريد مقدم الاستشارة',
};

function formatRequestValue(value) {
  if (Array.isArray(value)) return value.length ? value.join('، ') : 'لا يوجد';
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return Object.entries(value).map(([key, entry]) => `${REQUEST_FIELD_LABELS[key] || key}: ${formatRequestValue(entry)}`).join('، ');
  return String(value);
}

function getRequestFields(item) {
  if (!item.workflowRequest || !item.data) return [];
  const fields = Object.entries(item.data)
    .filter(([key, value]) => !['docs', 'titleDocs'].includes(key) && value !== '' && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0))
    .map(([key, value]) => ({ label: REQUEST_FIELD_LABELS[key] || key, value: formatRequestValue(value), span: 6 }));
  if (item.location) fields.push({ label: 'إحداثيات موقع الوحدة', value: `${item.location.lat}, ${item.location.lng}`, span: 12 });
  return fields;
}

/* ------------------------------------------------------------------ */
/*  Per-tab configuration                                              */
/* ------------------------------------------------------------------ */
const TAB_CONFIG = {
  applicants: {
    key: 'applicants',
    theme: styles.themeApplicant,
    tabLabel: 'مقدم الطلب',
    tabIcon: 'user',
    items: APPLICANTS,
    searchPlaceholder: 'ابحث بالاسم أو كود مقدم الطلب...',
    filterAllLabel: 'كل المحافظات',
    filterOptions: GOVERNORATES,
    matchSearch: (it, q) =>
      [it.name, it.fullName, it.id, it.ref].some((v) => String(v).toLowerCase().includes(q)),
    matchFilter: (it, v) => it.governorate === v,
    totalLabel: 'إجمالي المتقدمين المعروضين',
    hint: 'انقر على أي صف لتحديث بيانات الاستمارة أدناه',
    statusLabels: { review: 'قيد المراجعة', eligible: 'مؤهل', ineligible: 'غير مؤهل' },
    columns: [
      { key: 'name', label: 'اسم مقدم الطلب', dot: true, cls: 'cellStrong', render: (it) => it.name },
      { key: 'id', label: 'كود مقدم الطلب', cls: 'cellStrong', render: (it) => it.id },
      { key: 'date', label: 'تاريخ إرسال الطلب', cls: 'cellMuted', render: (it) => it.date },
      { key: 'address', label: 'العنوان', render: (it) => it.address },
    ],
    detail: {
      title: 'بيانات مقدم الطلب التفصيلية',
      icon: 'user',
      badge: (it) => `طلب رقم #${it.id}`,
      fields: (it) => [
        { label: 'الاسم رباعي', value: it.fullName, span: 6, strong: true },
        { label: 'السن', value: `${it.age} سنة`, span: 6, strong: true },
        { label: 'الوظيفة / جهة العمل', value: it.job, span: 6, strong: true },
        { label: 'كود مقدم الطلب', value: it.ref, span: 6, mono: true },
      ],
      docsTitle: 'المرفقات والمستندات الثبوتية',
      question: 'الرد المبدئي للطلب: هل مؤهل؟',
      hint: 'اختيار النتيجة يحدد مسار التوجيه التالي',
      yes: 'نعم (مؤهل)',
      no: 'لا (غير مؤهل)',
      messageLabel: 'نص الرسالة والتوجيه التلقائي للمواطن (SMS والبريد):',
      message: (it, decision) => {
        const shortName = it.name.split(' ').slice(0, 2).join(' ');
        return decision === 'eligible'
          ? `عزيزي المتقدم ${shortName}، تم قبول طلب التأهيل المبدئي رقم ${it.id} بنجاح. برجاء التوجه لفرع البنك لسداد مقدم مدة الحجز خلال 5 أيام عمل.`
          : `عزيزي المتقدم ${shortName}، نأسف لإبلاغك بأنه لم يتم قبول طلب التأهيل المبدئي رقم ${it.id} لعدم استيفاء شروط التمويل. يمكنك التواصل مع خدمة العملاء لمعرفة التفاصيل.`;
      },
      submitLabel: 'اعتماد وإرسال التوجيه للخطوة القادمة',
      successText: (it) => `تم اعتماد الرد وإرسال التوجيه للمتقدم (طلب #${it.id})`,
    },
  },
  units: {
    key: 'units',
    theme: styles.themeUnit,
    tabLabel: 'الوحدات',
    tabIcon: 'building',
    items: UNITS,
    searchPlaceholder: 'ابحث بكود الوحدة أو العنوان...',
    filterAllLabel: 'كل أنواع الوحدات',
    filterOptions: UNIT_TYPES,
    matchSearch: (it, q) =>
      [it.id, it.code, it.address, it.fullAddress].some((v) => String(v).toLowerCase().includes(q)),
    matchFilter: (it, v) => it.type === v,
    listHeader: { title: 'مسار الوحدة (List & Search)', icon: 'building', badge: (n) => `${n} وحدات مسجلة` },
    totalLabel: 'إجمالي الوحدات المعروضة',
    hint: 'انقر على أي صف لمعاينة بيانات الوحدة',
    statusLabels: { review: 'قيد الفحص', eligible: 'مؤهلة', ineligible: 'غير مؤهلة' },
    columns: [
      { key: 'id', label: 'كود الوحدة', cls: 'cellStrong', render: (it) => it.id },
      { key: 'address', label: 'العنوان', cls: 'cellStrong', render: (it) => it.address },
      { key: 'type', label: 'نوع الوحدة', render: (it) => it.type },
      { key: 'date', label: 'تاريخ الإرسال', cls: 'cellMuted', render: (it) => it.date },
    ],
    detail: {
      title: 'بيانات الوحدة والمطابقة الهندسية',
      icon: 'building',
      badge: (it) => `كود الوحدة #${it.id}`,
      fields: (it) => [
        { label: 'كود الوحدة', value: it.code, span: 4, mono: true },
        { label: 'العنوان بالتفصيل', value: it.fullAddress, span: 8, strong: true },
      ],
      extra: (it) => (
        <div className={styles.block}>
          <div className={styles.blockTitle}>حالة المرافق (جاهزية التوصيل)</div>
          <div className={styles.utilities}>
            {it.utilities.map((u) => (
              <div key={u.label} className={`${styles.utility} ${u.ok ? styles.utilityOk : styles.utilityBad}`}>
                <span className={styles.utilityDot} />
                {u.label}
              </div>
            ))}
          </div>
        </div>
      ),
      docsTitle: 'مستندات ملكية الوحدة ومرفقاتها',
      question: 'قرار فحص الوحدة: هل الوحدة مؤهلة؟',
      hint: 'تأهيل العقار للتخصيص الفعلي',
      yes: 'نعم (الوحدة مؤهلة)',
      no: 'لا (الوحدة غير مؤهلة)',
      messageLabel: 'إرسال رسالة للمالك وفقا للاعتماد والتوجيه للخطوة القادمة:',
      message: (it, decision) =>
        decision === 'eligible'
          ? `سيادة مالك الوحدة ${it.id}، تم اعتماد أهلية الوحدة بعد فحص المرافق والمستندات. الخطوة التالية: جدولة موعد المعاينة الميدانية واستلام محضر المعاينة.`
          : `سيادة مالك الوحدة ${it.id}، نأسف لإبلاغكم بأنه تعذر اعتماد أهلية الوحدة بعد فحص المرافق والمستندات. برجاء استيفاء النواقص وإعادة تقديم الطلب.`,
      submitLabel: 'إرسال رسالة للمالك مع التوجيه للخطوة القادمة',
      successText: (it) => `تم إرسال الرسالة لمالك الوحدة ${it.id} مع التوجيه للخطوة القادمة`,
    },
  },
};

const TAB_ORDER = ['applicants', 'units'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/*  Document preview modal                                             */
/* ------------------------------------------------------------------ */
function DocModal({ doc, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <strong>{doc.title}</strong>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="إغلاق">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          {doc.url ? (
            <iframe title={doc.title} src={doc.url} className={styles.modalFrame} />
          ) : (
            <div className={styles.modalPlaceholder}>
              <Icon name={doc.icon} size={36} />
              <p>{doc.meta}</p>
              <small>اربط حقل url في بيانات المستند لعرض الملف هنا.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  One tab: list + search + detail + decision                         */
/* ------------------------------------------------------------------ */
function ReviewSection({ config, results, onSubmit, sending }) {
  const { items, detail } = config;
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const [draft, setDraft] = useState({ q: '', filter: '' });
  const [applied, setApplied] = useState({ q: '', filter: '' });
  const [decisions, setDecisions] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    if (!items.some((item) => item.id === selectedId)) setSelectedId(items[0]?.id ?? null);
  }, [items, selectedId]);

  const visible = useMemo(() => {
    const q = applied.q.trim().toLowerCase();
    return items.filter(
      (it) =>
        (!q || config.matchSearch(it, q)) &&
        (!applied.filter || config.matchFilter(it, applied.filter))
    );
  }, [items, applied, config]);

  const selected = items.find((it) => it.id === selectedId) ?? null;
  const statusOf = (id) => results[id]?.status ?? 'review';
  const decision = selected ? decisions[selected.id] ?? DEFAULT_DECISION : null;
  const finished = selected ? Boolean(results[selected.id]) : false;
  const isSending = sending === selected?.id;

  const applyFilters = () => setApplied(draft);

  const submit = () => {
    if (!selected || !decision || finished || isSending) return;
    onSubmit({
      tab: config.key,
      item: selected,
      decision,
      message: detail.message(selected, decision),
      successText: detail.successText(selected, decision),
    });
  };

  return (
    <div className={`${styles.section} ${config.theme}`}>
      {/* ---------- List card ---------- */}
      <section className={styles.card}>
        {config.listHeader && (
          <header className={styles.listHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.titleIcon}>
                <Icon name={config.listHeader.icon} size={16} />
              </span>
              {config.listHeader.title}
            </h2>
            <span className={styles.pill}>{config.listHeader.badge(items.length)}</span>
          </header>
        )}

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <input
              type="search"
              className={styles.input}
              placeholder={config.searchPlaceholder}
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              aria-label="بحث"
            />
            <span className={styles.searchIcon}>
              <Icon name="search" size={16} />
            </span>
          </div>

          <select
            className={styles.select}
            value={draft.filter}
            onChange={(e) => setDraft((d) => ({ ...d, filter: e.target.value }))}
            aria-label="تصفية"
          >
            <option value="">{config.filterAllLabel}</option>
            {config.filterOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <button type="button" className={styles.primaryBtnSm} onClick={applyFilters}>
            تصفية
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th className={styles.actionCol}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={config.columns.length + 1} className={styles.empty}>
                    لا توجد نتائج مطابقة. غيّر كلمة البحث أو التصفية ثم اضغط «تصفية».
                  </td>
                </tr>
              )}
              {visible.map((it) => {
                const isSel = it.id === selectedId;
                const status = statusOf(it.id);
                return (
                  <tr
                    key={it.id}
                    className={`${styles.row} ${isSel ? styles.rowSelected : ''}`}
                    onClick={() => setSelectedId(it.id)}
                    aria-selected={isSel}
                  >
                    {config.columns.map((c) => (
                      <td key={c.key} className={c.cls ? styles[c.cls] : undefined}>
                        {c.dot && <span className={`${styles.rowDot} ${isSel ? styles.rowDotOn : ''}`} />}
                        {c.render(it)}
                      </td>
                    ))}
                    <td className={styles.actionCol}>
                      {isSel || status !== 'review' ? (
                        <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
                          {config.statusLabels[status]}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(it.id);
                          }}
                        >
                          اختيار
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className={styles.tableFooter}>
          <span>{config.hint}</span>
          <span>
            {config.totalLabel}: {visible.length}
          </span>
        </footer>
      </section>

      {/* ---------- Detail card ---------- */}
      {selected && (
        <section className={styles.card}>
          <header className={styles.detailHeader}>
            <h2 className={styles.cardTitle}>
              <span className={styles.titleIcon}>
                <Icon name={detail.icon} size={16} />
              </span>
              {detail.title}
            </h2>
            <span className={styles.tag}>{detail.badge(selected)}</span>
          </header>

          <div className={styles.fields}>
            {detail.fields(selected).map((f) => (
              <div key={f.label} className={styles.field} style={{ gridColumn: `span ${f.span}` }}>
                <span className={styles.fieldLabel}>{f.label}</span>
                <div
                  className={`${styles.fieldValue} ${f.strong ? styles.fieldStrong : ''} ${
                    f.mono ? styles.fieldMono : ''
                  }`}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          {getRequestFields(selected).length > 0 && (
            <div className={styles.block}>
              <div className={styles.blockTitle}>جميع البيانات المُدخلة في الطلب</div>
              <div className={styles.fields}>
                {getRequestFields(selected).map((field) => (
                  <div key={field.label} className={styles.field} style={{ gridColumn: `span ${field.span}` }}>
                    <span className={styles.fieldLabel}>{field.label}</span>
                    <div className={styles.fieldValue}>{field.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.extra?.(selected)}

          <div className={styles.block}>
            <div className={styles.blockTitle}>
              <Icon name="clip" size={14} />
              {detail.docsTitle}
            </div>
            <div className={styles.docs}>
              {selected.docs.map((d) => (
                <div key={d.id} className={styles.doc}>
                  <span className={`${styles.docIcon} ${styles[`tone_${d.tone}`]}`}>
                    <Icon name={d.icon} size={18} />
                  </span>
                  <div className={styles.docText}>
                    <strong>{d.title}</strong>
                    <small>{d.meta}</small>
                  </div>
                  <button type="button" className={styles.outlineBtn} onClick={() => setPreviewDoc(d)}>
                    عرض
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.block}>
            <div className={styles.decisionHead}>
              <strong>{detail.question}</strong>
              <small>{detail.hint}</small>
            </div>
            <div className={styles.decision} role="radiogroup" aria-label={detail.question}>
              <button
                type="button"
                role="radio"
                aria-checked={decision === 'eligible'}
                disabled={finished}
                className={`${styles.option} ${styles.optionYes} ${decision === 'eligible' ? styles.optionOn : ''}`}
                onClick={() => setDecisions((d) => ({ ...d, [selected.id]: 'eligible' }))}
              >
                <span className={styles.radio} />
                {detail.yes}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={decision === 'ineligible'}
                disabled={finished}
                className={`${styles.option} ${styles.optionNo} ${decision === 'ineligible' ? styles.optionOn : ''}`}
                onClick={() => setDecisions((d) => ({ ...d, [selected.id]: 'ineligible' }))}
              >
                <span className={styles.radio} />
                {detail.no}
              </button>
            </div>
          </div>

          {decision && (
            <div className={`${styles.message} ${decision === 'ineligible' ? styles.messageNo : ''}`}>
              <div className={styles.messageHead}>
                <Icon name={decision === 'eligible' ? 'checkCircle' : 'alert'} size={16} />
                <strong>{detail.messageLabel}</strong>
              </div>
              <p>{detail.message(selected, decision)}</p>
            </div>
          )}

          <button
            type="button"
            className={styles.submit}
            onClick={submit}
            disabled={!decision || finished || isSending}
          >
            {finished ? 'تم الإرسال مسبقًا' : isSending ? 'جارٍ الإرسال...' : detail.submitLabel}
            {!finished && !isSending && <Icon name="arrowLeft" size={16} />}
          </button>
        </section>
      )}

      {previewDoc && <DocModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
/**
 * Props:
 *  - onSubmitDecision({ tab, item, decision, message }) => Promise   (optional; call your API here)
 */
export default function ReviewerPage({ onSubmitDecision }) {
  const [tab, setTab] = useState('applicants');
  const [results, setResults] = useState(() => {
    const saved = { applicants: {}, units: {} };
    getWorkflowRequests().forEach((request) => {
      if ((request.status === 'eligible' || request.status === 'ineligible') && request.reviewerDecisionAt) {
        const key = request.kind === 'unit' ? 'units' : 'applicants';
        saved[key][request.id] = { status: request.status };
      }
    });
    return saved;
  });
  const [sending, setSending] = useState({ applicants: null, units: null });
  const [toast, setToast] = useState(null);
  const [workflowRequests, setWorkflowRequests] = useState(() => getWorkflowRequests());

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSubmit = async ({ tab: key, item, decision, message, successText }) => {
    setSending((s) => ({ ...s, [key]: item.id }));
    try {
      if (onSubmitDecision) await onSubmitDecision({ tab: key, item, decision, message });
      else await wait(700);
      if (item.workflowRequest) {
        updateWorkflowRequest(item.id, { status: decision, decision, reviewerMessage: message, reviewerDecisionAt: new Date().toISOString() });
        setWorkflowRequests(getWorkflowRequests());
      }
      setResults((r) => ({ ...r, [key]: { ...r[key], [item.id]: { status: decision } } }));
      setToast({ type: 'ok', text: successText });
    } catch {
      setToast({ type: 'error', text: 'تعذّر إرسال الرسالة. حاول مرة أخرى.' });
    } finally {
      setSending((s) => ({ ...s, [key]: null }));
    }
  };

  const toReviewerItem = (request) => {
    const data = request.data || {};
    const isUnit = request.kind === 'unit';
    const fullAddress = data.fullAddress || [data.governorate, data.district, data.area, data.address].filter(Boolean).join('، ');
    const docs = (request.documents || []).map((doc, index) => ({ ...doc, id: `${request.id}-doc-${index}` }));
    if (isUnit) return {
      id: request.id, workflowRequest: true, data, code: request.requestNumber, address: fullAddress || 'العنوان غير متاح', fullAddress: fullAddress || 'العنوان غير متاح',
      location: request.location,
      type: `${data.usageType || 'سكني'} ${data.unitType || 'وحدة'}`, date: new Date(request.createdAt).toLocaleDateString('ar-EG'),
      utilities: ['كهرباء', 'ماء', 'غاز'].map((label) => ({ label, ok: (data.utilities || []).includes(label) })), docs,
    };
    const isEligibility = request.kind === 'eligibility';
    const name = data.fullName || data.ownerName || 'مقدم الطلب';
    const birthYear = Number((data.birthDate || '').slice(0, 4));
    const age = birthYear ? Math.max(0, new Date().getFullYear() - birthYear) : '—';
    return {
      id: request.id, workflowRequest: true, data, name, fullName: name, age,
      job: [data.jobTitle || data.occupation, data.employer || data.employmentType].filter(Boolean).join(' - ') || 'غير محدد',
      ref: request.requestNumber, date: new Date(request.createdAt).toLocaleDateString('ar-EG'),
      governorate: data.governorate || 'غير محدد', address: fullAddress || 'العنوان غير متاح', docs,
    };
  };

  const liveApplicants = workflowRequests.filter((request) => ['eligibility', 'financing', 'consultation'].includes(request.kind)).map(toReviewerItem);
  const liveUnits = workflowRequests.filter((request) => request.kind === 'unit').map(toReviewerItem);
  const configs = {
    applicants: { ...TAB_CONFIG.applicants, items: [...liveApplicants, ...APPLICANTS] },
    units: { ...TAB_CONFIG.units, items: [...liveUnits, ...UNITS] },
  };
  const pendingCount = (key) => configs[key].items.filter((it) => !results[key][it.id] && it.status !== 'eligible' && it.status !== 'ineligible').length;

  const counts = {
    applicants: `${pendingCount('applicants')} نشط`,
    units: `${configs.units.items.length} مسجلة`,
  };

  return (
    <>
      <Navbar />
      <div className={styles.page} dir="rtl">
        <nav className={styles.tabs} role="tablist" aria-label="أقسام المراجعة">
          {TAB_ORDER.map((key) => {
            const cfg = configs[key];
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.tab} ${cfg.theme} ${active ? styles.tabActive : ''}`}
                onClick={() => setTab(key)}
              >
                <span className={styles.tabIcon}>
                  <Icon name={cfg.tabIcon} size={16} />
                </span>
                <span className={styles.tabLabel}>{cfg.tabLabel}</span>
                <span className={styles.tabCount}>{counts[key]}</span>
              </button>
            );
          })}
        </nav>

        {TAB_ORDER.map((key) => (
          <div key={key} hidden={tab !== key} role="tabpanel">
            <ReviewSection
              config={configs[key]}
              results={results[key]}
              sending={sending[key]}
              onSubmit={handleSubmit}
            />
          </div>
        ))}

        {toast && (
          <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`} role="status">
            <Icon name={toast.type === 'error' ? 'alert' : 'checkCircle'} size={16} />
            {toast.text}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
