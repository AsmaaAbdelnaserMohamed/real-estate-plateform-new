import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Layout/Footer";
import Navbar from "../../components/Layout/Navbar";
import FaqSection from "../../components/FAQ/FaqSection";
import FinanceMap from "../FinanceMap/FinanceMap";
import RequestForm from "../RequestForm/RequestForm";
import Dashbord from "../dashboard/Dashbord.jsx";
import ValuationService from "../ValuationService/ValuationService.jsx";
import "./Home.css";
import "./HomeServices.css";
import hedearPhoto from "../../assets/Gemini_Generated_Image_16whiz16whiz16wh.png";

const services = [
  {
    icon: "🏦",
    title: "التمويل العقاري",
    desc: "احصل على أفضل عروض التمويل من كبرى البنوك المصرية بخطوة واحدة.",
    color: "#0ea5e9",
    to: "#services-section",
    href: "#services-section",
  },
  {
    icon: "📋",
    title: "التسجيل والاستشارات",
    desc: "سجل العقارات واحصل على استشارات قانونية من خبراء معتمدين بسهولة.",
    color: "#10b981",
    to: "/register",
  },
  {
    icon: "📊",
    title: "التقارير والتحليلات",
    desc: "تابع مؤشرات السوق والأسعار لمساعدتك في اتخاذ قرار أسرع وأكثر دقة.",
    color: "#f59e0b",
    to: "/dashboard",
  },
];

services.push({
  icon: "🧭",
  title: "التقييم والتسعير الاسترشادي",
  desc: "اعرف متوسط سعر المتر في أي منطقة باختيار الحدود الإدارية أو الرسم على الخريطة.",
  color: "#0284c7",
  to: "/valuation",
});

const stats = [
  { value: "50K+", label: "مستخدم نشط" },
  { value: "120+", label: "بنك وشركة تمويل" },
  { value: "98%", label: "نسبة رضا العملاء" },
  { value: "24/7", label: "دعم فني متواصل" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("finance");
  const [showForm, setShowForm] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeService, setActiveService] = useState("finance");
  const [isServiceFullscreen, setIsServiceFullscreen] = useState(false);
  const serviceFrameRef = useRef(null);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsServiceFullscreen(
        document.fullscreenElement === serviceFrameRef.current,
      );
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const openServiceFullscreen = async () => {
    if (document.fullscreenElement === serviceFrameRef.current) {
      await document.exitFullscreen?.();
      return;
    }

    if (document.fullscreenElement) await document.exitFullscreen?.();
    if (serviceFrameRef.current?.requestFullscreen) {
      await serviceFrameRef.current.requestFullscreen();
    } else if (serviceFrameRef.current?.webkitRequestFullscreen) {
      await serviceFrameRef.current.webkitRequestFullscreen();
    }
  };

  return (
    <div className="home-page" dir="rtl">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero home-hero" dir="rtl">
        <img src={hedearPhoto} alt="EDGE PRO logo" className="bg-video" />
        <div className="heroShadow" />
        <div className="hero-overlay" />
        <div className="hero-particles">
          {[...Array(6)].map((_, index) => (
            <span key={index} className={`particle p${index + 1}`} />
          ))}
        </div>

        <div className="home-hero-content">
          <div className="hero-badge">🏛️ الجهة الرسمية للخدمات العقارية</div>
          <h1 className="hero-title">
            المنصة التفاعلية
            <span className="hero-title-highlight"> للخدمات العقارية</span>
            <br />
            في جمهورية مصر العربية
          </h1>
          <p className="hero-sub">
            منصة متكاملة تربط بين المواطن والبنوك وشركات العقارات لتسهيل البحث
            والتسجيل والتمويل العقاري بأقصى سرعة وأمان.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() =>
                document
                  .getElementById("services-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              ابدأ الآن
            </button>
            <button
              className="btn-outline"
              onClick={() =>
                document
                  .getElementById("tabs-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              استكشف الخدمات
            </button>
          </div>

          <div className="hero-trust">
            <span>✅ معتمد من وزارة الإسكان</span>
            <span>✅ مرتبط بالسجل العقاري الرسمي</span>
            <span>✅ أمان بنكي 256-bit</span>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>↓</span>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((item) => (
            <div className="stat-card" key={item.label}>
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section className="services-section" id="services-section">
        <div className="section-header">
          <span className="section-tag">خدماتنا</span>
          <h2 className="section-title">كل ما تحتاجه في مكان واحد</h2>
          <p className="section-desc">
            نقدم مجموعة متكاملة من الخدمات العقارية الرقمية لتوفير وقتك وجهدك.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div className="service-card" key={service.title}>
              <div
                className="service-icon-wrap"
                style={{
                  background: `${service.color}18`,
                  border: `1.5px solid ${service.color}40`,
                }}
              >
                <span className="service-icon">{service.icon}</span>
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
              <Link className="service-btn-link" to={service.to}>
                <span className="service-btn" style={{ color: service.color }}>
                  استعرض التفاصيل ←
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tabs ── */}
      <section className="tabs-section" id="tabs-section">
        <div className="section-header">
          <span className="section-tag">الخدمات التفاعلية</span>
          <h2 className="section-title">ابدأ الآن مع خدماتنا</h2>
        </div>

        <div className="tabs-container">
          <div className="tabs-bar">
            <button
              className={`tab-btn ${activeTab === "finance" ? "tab-active" : ""}`}
              onClick={() => {
                setActiveTab("finance");
                setActiveService("finance");
              }}
            >
              🏦 التمويل العقاري
            </button>

            <button
              className={`tab-btn ${activeTab === "consult" ? "tab-active" : ""}`}
              onClick={() => {
                setActiveTab("consult");
                setActiveService("consult");
              }}
            >
              📋 التسجيل والاستشارات القانونية
            </button>

            <button
              className={`tab-btn ${activeTab === "reports" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              📊 التقارير والتحليلات
            </button>

            <button
              className={`tab-btn ${activeTab === "valuation" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("valuation")}
            >
              🧭 التقييم والتسعير الاسترشادي
            </button>
          </div>

          {/* ── Finance tab: map fills the panel, zero padding ── */}
          {activeTab === "finance" && activeService === "finance" && (
            <div
              className="tab-panel service-frame-panel"
              ref={serviceFrameRef}
            >
              <div className="service-frame-toolbar">
                <div>
                  <span>🏦</span>
                  <strong>خدمة التمويل العقاري</strong>
                  <small>
                    من خلال هذه الخدمة يمكنك الحصول على أفضل عروض التمويل
                    العقاري من كبرى البنوك المصرية بخطوة واحدة
                  </small>
                </div>
                {/* <button
                  type="button"
                  onClick={openServiceFullscreen}
                  aria-label={isServiceFullscreen ? "✕" : "⛶"}
                >
                  {isServiceFullscreen ? "✕ " : "⛶"}
                </button> */}
              </div>
              <div className="tab-panel tab-panel--map">
                <div className="tab-finance-wrap">
                  <FinanceMap />
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div
              className="tab-panel service-frame-panel"
              ref={serviceFrameRef}
            >
              <div className="service-frame-toolbar">
                <div>
                  <span>📊</span>
                  <strong>التقارير والتحليلات</strong>
                  <small>لوحة متابعة مؤشرات المنصة</small>
                </div>
                <button
                  type="button"
                  onClick={openServiceFullscreen}
                  aria-label={isServiceFullscreen ? "✕" : "⛶"}
                >
                  {isServiceFullscreen ? "✕" : "⛶"}
                </button>
              </div>
              <div className="service-frame-content service-frame-content--dashboard">
                <Dashbord />
              </div>
            </div>
          )}

          {activeTab === "valuation" && (
            <div
              className="tab-panel service-frame-panel"
              ref={serviceFrameRef}
            >
              <div className="service-frame-toolbar">
                <div>
                  <span>🧭</span>
                  <strong>التقييم والتسعير الاسترشادي</strong>
                  <small>متوسط سعر المتر حسب المنطقة</small>
                </div>
                <button
                  type="button"
                  onClick={openServiceFullscreen}
                  aria-label={isServiceFullscreen ? "✕" : "⛶"}
                >
                  {isServiceFullscreen ? "✕ " : "⛶"}
                </button>
              </div>
              <div className="service-frame-content">
                <ValuationService embedded />
              </div>
            </div>
          )}

          {/* ── Consult tab ── */}
          {activeTab === "consult" && activeService === "consult" && (
            <div
              className="tab-panel service-frame-panel"
              ref={serviceFrameRef}
            >
              <div className="service-frame-toolbar">
                <div>
                  <span>📋</span>
                  <strong>خدمة الاستشارات القانونية العقارية</strong>
                  <small>
                    من خلال هذه الخدمة يمكنك الحصول على استشارات قانونية عقارية
                    متخصصة
                  </small>
                </div>
                <button
                  type="button"
                  onClick={openServiceFullscreen}
                  aria-label={isServiceFullscreen ? "✕" : "⛶"}
                >
                  {isServiceFullscreen ? "✕ " : "⛶"}
                </button>
              </div>
              <div className="tab-consult-wrap">
                {/* cards for consult legacy */}
                <div className="tab-consult-cards">
                  <div className="tab-consult-card">
                    <span className="tab-consult-card-icon">⚖️</span>
                    <div>
                      <h4 className="tab-consult-card-title">
                        استشارة قانونية عقارية
                      </h4>
                      <p className="tab-consult-card-desc">
                        تواصل مع محامين معتمدين لحل النزاعات العقارية ومراجعة
                        المستندات.
                      </p>
                    </div>
                  </div>
                  <div className="tab-consult-card">
                    <span className="tab-consult-card-icon">📋</span>
                    <div>
                      <h4 className="tab-consult-card-title">
                        تسجيل عقاري رسمي
                      </h4>
                      <p className="tab-consult-card-desc">
                        إجراءات التسجيل في الشهر العقاري بمساندة خبراء معتمدين.
                      </p>
                    </div>
                  </div>
                  <div className="tab-consult-card">
                    <span className="tab-consult-card-icon">🕐</span>
                    <div>
                      <h4 className="tab-consult-card-title">
                        رد خلال 24 ساعة
                      </h4>
                      <p className="tab-consult-card-desc">
                        فريقنا يراجع طلبك بسرعة ويعود لك في يوم عمل واحد.
                      </p>
                    </div>
                  </div>
                  <div className="tab-consult-card">
                    <span className="tab-consult-card-icon">🎁</span>
                    <div>
                      <h4 className="tab-consult-card-title">
                        استشارة أولية مجانية
                      </h4>
                      <p className="tab-consult-card-desc">
                        ابدأ بدون رسوم مبدئية واحصل على توجيه واضح قبل الإجراء.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="tab-consult-cta">
                  <button
                    className="btn-primary btn-large"
                    onClick={() => {
                      setFormDefaultType("consultation");
                      setShowForm(true);
                    }}
                  >
                    ⚖️ اطلب استشارتك الآن
                  </button>
                  <p className="tab-consult-note">
                    ✅ معتمد رسميا • 🔒 بياناتك محمية • 💬 استشارة أولية مجانية
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <RequestForm
          defaultType={formDefaultType}
          onClose={() => {
            setShowForm(false);
            setFormDefaultType(null);
          }}
        />
      )}

      <FaqSection />

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">جاهز للبدء؟</h2>
          <p className="cta-sub">
            انضم إلى أكثر من 50,000 مستخدم يستفيدون من المنصة يوميا.
          </p>
          <Link className="btn-primary btn-large cta-link-btn" to="/register">
            سجّل الآن مجانا
          </Link>
        </div>
      </section>

      {/* ── Chat widget ── */}
      <>
        <button
          className={`chat-toggle-btn ${chatOpen ? "open" : ""}`}
          onClick={() => setChatOpen((open) => !open)}
        >
          {chatOpen ? "✕" : "💬"}
        </button>

        <div className={`chat-widget ${chatOpen ? "show" : ""}`}>
          <div className="chat-header">
            <span>المساعد الذكي</span>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <iframe
            src="https://chat-put-2che.vercel.app/"
            title="chatbot"
            className="chat-iframe"
          />
        </div>
      </>

      <Footer />
    </div>
  );
}
