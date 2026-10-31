import { useState } from "react";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import "./SubscriptionManagement.css";

const PLANS = [
  {
    name: "البداية",
    description: "خطوة عملية لبناء حضورك العقاري.",
    monthly: 499,
    yearly: 4990,
    properties: 10,
    team: 3,
    featured: 1,
    features: ["لوحة تحكم موحدة", "إدارة العملاء والطلبات", "تقارير أداء أساسية"],
  },
  {
    name: "النمو",
    description: "مساحة أكبر لفريقك وأعمالك المتنامية.",
    monthly: 1299,
    yearly: 12990,
    properties: 50,
    team: 10,
    featured: 5,
    popular: true,
    features: ["جميع مزايا البداية", "تقارير أداء متقدمة", "عقارات مميزة", "دعم أولوية"],
  },
  {
    name: "المؤسسات",
    description: "مرونة وأدوات متقدمة للأعمال الكبيرة.",
    monthly: 2999,
    yearly: 29990,
    properties: 250,
    team: 50,
    featured: 25,
    features: ["جميع مزايا النمو", "فريق متعدد الأعضاء", "مساحة عرض مميزة", "مدير حساب مخصص"],
  },
];

const SUBSCRIPTIONS = [
  { company: "المستقبل للتطوير", plan: "المؤسسات", status: "نشط", amount: "٢٬٩٩٩ ج.م", expires: "١٥ نوفمبر ٢٠٢٦" },
  { company: "آفاق العقارية", plan: "النمو", status: "نشط", amount: "١٬٢٩٩ ج.م", expires: "٢٢ نوفمبر ٢٠٢٦" },
  { company: "بيوت مصر", plan: "البداية", status: "بانتظار الدفع", amount: "٤٩٩ ج.م", expires: "—" },
];

const money = (amount) => new Intl.NumberFormat("ar-EG").format(amount);

function DemoNotice() {
  return (
    <div className="subscription-demo-notice" role="note">
      <span aria-hidden="true">ⓘ</span>
      <span>معاينة شكلية ببيانات توضيحية — غير مرتبطة باشتراكات أو مدفوعات فعلية.</span>
    </div>
  );
}

function ViewTabs({ view, setView }) {
  const tabs = [
    ["plans", "الباقات والأسعار"],
    ["overview", "ملخص اشتراكي"],
    ["admin", "لوحة الإدارة · معاينة"],
  ];

  return (
    <div className="subscription-tabs" role="tablist" aria-label="واجهات الاشتراك">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          className={view === id ? "is-active" : ""}
          onClick={() => setView(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PricingView({ billing, setBilling, notify }) {
  return (
    <>
      <section className="subscription-hero">
        <div className="subscription-hero-copy">
          <span className="subscription-eyebrow">حلول أعمال عقارية</span>
          <h1>خطتك المناسبة، <span>لنمو أعمالك.</span></h1>
          <p>أدوات عملية للمطورين وشركات التسويق والوسطاء العقاريين، في مكان واحد.</p>
        </div>
        <div className="subscription-hero-art" aria-hidden="true">
          <div className="subscription-art-building"><i /><i /><i /><i /><i /><i /></div>
          <div className="subscription-art-orbit" />
          <span className="subscription-art-spark">✦</span>
        </div>
      </section>

      <section className="subscription-pricing-section">
        <div className="subscription-section-heading">
          <div>
            <span className="subscription-eyebrow">باقات واضحة ومرنة</span>
            <h2>اختر مساحة أكبر لأعمالك</h2>
            <p>تتضمن كل باقة الأدوات الأساسية لإدارة حضورك العقاري.</p>
          </div>
          <div className="subscription-billing-toggle" aria-label="مدة الاشتراك">
            <button type="button" className={billing === "monthly" ? "selected" : ""} onClick={() => setBilling("monthly")}>
              شهري
            </button>
            <button type="button" className={billing === "yearly" ? "selected" : ""} onClick={() => setBilling("yearly")}>
              سنوي <span>وفّر شهرين</span>
            </button>
          </div>
        </div>

        <div className="subscription-plan-grid">
          {PLANS.map((plan) => (
            <article className={`subscription-plan-card${plan.popular ? " is-popular" : ""}`} key={plan.name}>
              {plan.popular && <div className="subscription-popular-badge">الأكثر اختيارًا</div>}
              <div className="subscription-plan-top">
                <span className="subscription-plan-icon" aria-hidden="true">
                  {plan.name === "المؤسسات" ? "◆" : plan.name === "النمو" ? "✦" : "◇"}
                </span>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              <div className="subscription-plan-price">
                <strong>{money(plan[billing])}</strong>
                <span>ج.م <small>/ {billing === "monthly" ? "شهريًا" : "سنويًا"}</small></span>
              </div>
              <div className="subscription-plan-duration">
                <span>مدة الاشتراك</span>
                <strong>{billing === "monthly" ? "شهر واحد" : "سنة كاملة"}</strong>
              </div>
              <div className="subscription-plan-limits">
                <div><span className="subscription-limit-icon">⌂</span><span>العقارات المنشورة</span><strong>{money(plan.properties)}</strong></div>
                <div><span className="subscription-limit-icon">♧</span><span>أعضاء الفريق</span><strong>{money(plan.team)}</strong></div>
                <div><span className="subscription-limit-icon">✦</span><span>عقارات مميزة</span><strong>{money(plan.featured)}</strong></div>
              </div>
              <ul className="subscription-feature-list">
                {plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}
              </ul>
              <button type="button" className={`subscription-cta${plan.popular ? " primary" : ""}`} onClick={notify}>
                اختر هذه الباقة <span aria-hidden="true">←</span>
              </button>
            </article>
          ))}
        </div>
        <p className="subscription-pricing-footnote">الأسعار المعروضة للتوضيح فقط، ولا يتم تنفيذ عمليات شراء من هذه الواجهة.</p>
      </section>
    </>
  );
}

function CustomerOverview({ setView, notify }) {
  return (
    <section className="subscription-customer">
      <div className="subscription-section-heading">
        <div>
          <span className="subscription-eyebrow">مساحة الشركة</span>
          <h1>إدارة اشتراكك</h1>
          <p>نظرة سريعة على خطتك واستخدام فريقك.</p>
        </div>
        <span className="subscription-status-pill"><i /> اشتراك نشط</span>
      </div>

      <article className="subscription-current-card">
        <div className="subscription-current-main">
          <span className="subscription-current-icon">✦</span>
          <div><span>باقتك الحالية</span><h2>النمو <small>اشتراك شهري</small></h2></div>
        </div>
        <div className="subscription-current-expiry"><span>تاريخ التجديد</span><strong>٢٣ نوفمبر ٢٠٢٦</strong><small>متبقي ٢٤ يومًا</small></div>
        <div className="subscription-current-actions">
          <button type="button" className="subscription-cta primary" onClick={() => setView("plans")}>ترقية الباقة</button>
          <button type="button" className="subscription-text-button" onClick={notify}>تجديد الاشتراك</button>
        </div>
      </article>

      <div className="subscription-usage-grid">
        <UsageCard icon="⌂" label="العقارات المستخدمة" value="٣١" maximum="٥٠ عقارًا" remaining="١٩" percentage={62} />
        <UsageCard icon="♧" label="أعضاء الفريق" value="٧" maximum="١٠ أعضاء" remaining="٣" percentage={70} />
        <UsageCard icon="✦" label="عقارات مميزة" value="٢" maximum="٥ عقارات" remaining="٣" percentage={40} />
      </div>

      <div className="subscription-history-card">
        <div className="subscription-history-heading"><div><h2>سجل الاشتراكات</h2><p>ملخص توضيحي للعمليات السابقة.</p></div><button type="button" onClick={notify}>عرض السجل الكامل <span>←</span></button></div>
        <div className="subscription-history-row"><span className="subscription-history-dot" /><div><strong>باقة النمو</strong><small>٢٣ أكتوبر ٢٠٢٦ · تجديد شهري</small></div><span className="subscription-history-amount">١٬٢٩٩ ج.م</span><span className="subscription-history-success">مكتمل</span></div>
        <div className="subscription-history-row"><span className="subscription-history-dot muted" /><div><strong>باقة البداية</strong><small>٢٣ سبتمبر ٢٠٢٦ · اشتراك شهري</small></div><span className="subscription-history-amount">٤٩٩ ج.م</span><span className="subscription-history-success">مكتمل</span></div>
      </div>
    </section>
  );
}

function UsageCard({ icon, label, value, maximum, remaining, percentage }) {
  return (
    <article className="subscription-usage-card">
      <div className="subscription-usage-top"><span className="subscription-usage-icon">{icon}</span><span>{label}</span></div>
      <div className="subscription-usage-value">{value}<small> / {maximum}</small></div>
      <div className="subscription-progress"><span style={{ width: `${percentage}%` }} /></div>
      <small className="subscription-usage-caption">متبقي {remaining}</small>
    </article>
  );
}

function AdminOverview({ notify }) {
  return (
    <section className="subscription-admin">
      <div className="subscription-section-heading">
        <div><span className="subscription-eyebrow">نظرة عامة</span><h1>إدارة الاشتراكات</h1><p>مؤشرات وبيانات توضيحية للوحة الإدارة.</p></div>
        <button type="button" className="subscription-cta primary" onClick={notify}>＋ إضافة باقة</button>
      </div>

      <div className="subscription-admin-stats">
        <AdminStat label="إجمالي المشتركين" value="١٢٨" change="+١٢٫٥٪ هذا الشهر" icon="♧" />
        <AdminStat label="اشتراكات نشطة" value="٩٦" change="٧٥٪ من الإجمالي" icon="✓" />
        <AdminStat label="اشتراكات منتهية" value="٢١" change="تحتاج متابعة" icon="◷" />
        <AdminStat label="مدفوعات معلّقة" value="١١" change="بانتظار المراجعة" icon="◈" />
      </div>

      <div className="subscription-admin-revenue">
        <div><span>الإيراد الشهري المتكرر <small>MRR · قيمة توضيحية</small></span><strong>١٤٨٬٥٠٠ <small>ج.م</small></strong></div>
        <div className="subscription-revenue-chart" aria-label="مخطط الإيرادات التوضيحي">
          {[40, 58, 46, 70, 56, 83, 68, 96, 76, 100, 84, 112].map((height, index) => <i key={index} style={{ height: `${height}px` }} />)}
        </div>
        <div className="subscription-revenue-months"><span>مايو</span><span>يونيو</span><span>يوليو</span><span>أغسطس</span><span>سبتمبر</span><span>أكتوبر</span></div>
      </div>

      <div className="subscription-admin-panel">
        <div className="subscription-history-heading"><div><h2>إدارة الباقات</h2><p>عرض شكلي للخطط المتاحة.</p></div><button type="button" onClick={notify}>عرض الكل <span>←</span></button></div>
        <div className="subscription-table-wrap">
          <table className="subscription-table">
            <thead><tr><th>اسم الباقة</th><th>السعر الشهري</th><th>العقارات</th><th>الفريق</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>{PLANS.map((plan) => <tr key={plan.name}><td><strong>{plan.name}</strong></td><td>{money(plan.monthly)} ج.م</td><td>{money(plan.properties)}</td><td>{money(plan.team)}</td><td><span className="subscription-table-status">نشطة</span></td><td><button type="button" className="subscription-table-action" onClick={notify}>تعديل</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="subscription-admin-panel">
        <div className="subscription-history-heading"><div><h2>أحدث الاشتراكات</h2><p>آخر النشاطات المسجلة · بيانات تجريبية.</p></div><button type="button" onClick={notify}>بحث وتصفية <span>⌕</span></button></div>
        <div className="subscription-table-wrap">
          <table className="subscription-table">
            <thead><tr><th>العميل</th><th>الباقة</th><th>المبلغ</th><th>الحالة</th><th>تاريخ الانتهاء</th><th>التفاصيل</th></tr></thead>
            <tbody>{SUBSCRIPTIONS.map((subscription) => <tr key={subscription.company}><td><strong>{subscription.company}</strong></td><td>{subscription.plan}</td><td>{subscription.amount}</td><td><span className={`subscription-table-status${subscription.status === "بانتظار الدفع" ? " pending" : ""}`}>{subscription.status}</span></td><td>{subscription.expires}</td><td><button type="button" className="subscription-table-action" onClick={notify}>عرض</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="subscription-expiring-note"><span>◷</span><div><strong>اشتراكات قاربت على الانتهاء</strong><small>يوجد ٨ اشتراكات تنتهي خلال ٣٠ يومًا · بيانات توضيحية</small></div></div>
    </section>
  );
}

function AdminStat({ label, value, change, icon }) {
  return <article className="subscription-admin-stat"><span className="subscription-admin-stat-icon">{icon}</span><span className="subscription-admin-stat-label">{label}</span><strong>{value}</strong><small>{change}</small></article>;
}

export default function SubscriptionManagement({ embedded = false }) {
  const [view, setView] = useState(embedded ? "overview" : "plans");
  const [billing, setBilling] = useState("monthly");
  const [notice, setNotice] = useState("");

  const notifyDemoOnly = () => setNotice("هذه معاينة شكلية فقط. الاشتراك وإدارة الباقات غير متصلين بنظام خلفي.");

  return (
    <div className={`subscription-page${embedded ? " subscription-page--embedded" : ""}`} dir="rtl">
      {!embedded && <Navbar />}
      <main className="subscription-shell">
        <DemoNotice />
        {notice && <div className="subscription-action-notice" role="status"><span>{notice}</span><button type="button" aria-label="إغلاق" onClick={() => setNotice("")}>×</button></div>}
        <ViewTabs view={view} setView={(nextView) => { setView(nextView); setNotice(""); }} />
        {view === "plans" && <PricingView billing={billing} setBilling={setBilling} notify={notifyDemoOnly} />}
        {view === "overview" && <CustomerOverview setView={setView} notify={notifyDemoOnly} />}
        {view === "admin" && <AdminOverview notify={notifyDemoOnly} />}
      </main>
      {!embedded && <Footer />}
    </div>
  );
}
