import { useEffect, useState } from "react";
import "./PropertyCard.css";

const TOTAL_STEPS = 4;
const PERIOD_OPTIONS = [
  { label: "5 سنوات", years: 5 },
  { label: "10 سنوات", years: 10 },
  { label: "15 سنة", years: 15 },
  { label: "20 سنة", years: 20 },
];
const JOB_OPTIONS = ["موظف حكومي", "موظف قطاع خاص", "أعمال حرة", "رجل أعمال"];
const BANKS = [
  { name: "البنك الأهلي", rate: 12.5, note: "حتى 20 سنة" },
  { name: "بنك مصر", rate: 13, note: "حتى 15 سنة" },
  { name: "CIB", rate: 11.9, note: "حتى 25 سنة" },
  { name: "QNB الأهلي", rate: 12.75, note: "حتى 20 سنة" },
];
const UNIT_FIELD_LABELS = {
  usageType: "نوع الاستخدام", unitType: "نوع الوحدة", governorate: "المحافظة", district: "المنطقة / الحي",
  street: "الشارع", buildingNumber: "رقم المبنى", floor: "الدور", unitNumber: "رقم الوحدة",
  buildYear: "سنة البناء", area: "المساحة بالمتر المربع", price: "سعر العقار بالجنيه المصري",
  elevator: "المصعد", condition: "حالة الوحدة", utilities: "المرافق المتصلة", rooms: "عدد الغرف",
  kitchens: "عدد المطابخ", bathrooms: "عدد الحمامات", receptionRooms: "عدد غرف الاستقبال",
  structuralIssues: "المشاكل الهيكلية", access: "الوصول إلى العقار", parking: "مواقف السيارات",
  nearbyServices: "الخدمات القريبة",
};
const INITIAL_DOCUMENTS = [
  {
    id: "national-id",
    icon: "🪪",
    name: "بطاقة الرقم القومي",
    sub: "الوجهان · PDF أو صورة",
    uploaded: true,
  },
  {
    id: "salary",
    icon: "💼",
    name: "مفردات الراتب",
    sub: "آخر 3 أشهر",
    uploaded: false,
  },
  {
    id: "bank-statement",
    icon: "🏦",
    name: "كشف الحساب البنكي",
    sub: "آخر 6 أشهر",
    uploaded: false,
  },
  {
    id: "property-data",
    icon: "🏠",
    name: "بيانات العقار",
    sub: "سيتم توفيرها تلقائياً",
    uploaded: true,
  },
];

function formatCurrency(value) {
  return `${Math.round(value || 0).toLocaleString("ar-EG")} ج`;
}

function getMonthlyPayment(loanAmount, years, annualRate = 0.125) {
  const months = years * 12;
  const monthlyRate = annualRate / 12;

  if (!loanAmount || !months) return 0;

  return Math.round(
    (loanAmount *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
  );
}

function PropertyCard({ property, onClose }) {
  const images = property.images?.length ? property.images : [];
  const title = property.title || property.name || "وحدة سكنية مميزة";
  const address = property.address || "العنوان غير متاح";
  const finishing = property.finishing || "تشطيب مميز";
  const utilities = property.utilities || "مرافق كاملة";
  const area = property.area || 0;
  const propertyPrice = Number(property.price) || 0;
  const hasVideo = Boolean(property.video);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showImage, setShowImage] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [showMortgageFlow, setShowMortgageFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedJob, setSelectedJob] = useState(JOB_OPTIONS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[2]);
  const [selectedBank, setSelectedBank] = useState(BANKS[0].name);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [income, setIncome] = useState(25000);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (images.length === 0) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex((prev) => Math.min(prev, images.length - 1));
  }, [images.length]);

  useEffect(() => {
    setShowMortgageFlow(false);
    setShowSuccess(false);
    setCurrentStep(0);
  }, [property]);

  const downPaymentAmount = Math.round((propertyPrice * downPaymentPercent) / 100);
  const loanAmount = Math.max(propertyPrice - downPaymentAmount, 0);
  const monthlyInstallment = getMonthlyPayment(loanAmount, selectedPeriod.years);
  const incomeRatio = income > 0 ? Math.round((monthlyInstallment / income) * 100) : 0;

  const specItems = [
    { value: area ? area.toLocaleString("ar-EG") : "-", label: "م² مساحة" },
    { value: property.bedrooms || 3, label: "غرف نوم" },
    { value: property.bathrooms || 2, label: "حمامات" },
    { value: property.floor ? `دور ${property.floor}` : "دور 4", label: "الطابق" },
  ];
  const unitDetails = property.unitData ? Object.entries(property.unitData)
    .filter(([key, value]) => UNIT_FIELD_LABELS[key] && value !== "" && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0))
    .map(([key, value]) => ({ label: UNIT_FIELD_LABELS[key], value: Array.isArray(value) ? value.join("، ") : value })) : [];

  const stepLabels = ["بياناتك", "التمويل", "البنك", "المستندات"];
  const nextLabels = [
    "التالي ← بيانات التمويل",
    "التالي ← اختيار البنك",
    "التالي ← رفع المستندات",
    "تقديم الطلب ✓",
  ];

  const goToImage = (index) => {
    if (images.length === 0) return;
    setCurrentIndex((index + images.length) % images.length);
  };

  const openMortgage = () => {
    setShowMortgageFlow(true);
    setCurrentStep(0);
    setShowSuccess(false);
  };

  const goBack = () => {
    if (showSuccess) {
      setShowSuccess(false);
      setCurrentStep(TOTAL_STEPS - 1);
      return;
    }

    if (currentStep === 0) {
      setShowMortgageFlow(false);
      return;
    }

    setCurrentStep((prev) => prev - 1);
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setShowSuccess(true);
  };

  const resetFlow = () => {
    setShowMortgageFlow(false);
    setShowSuccess(false);
    setCurrentStep(0);
    setDocuments(INITIAL_DOCUMENTS);
  };

  const toggleDocument = (docId) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, uploaded: true } : doc
      )
    );
  };

  return (
    <div className="property-card-overlay" dir="rtl">
      <div className="property-card">
        <div className="gold-line" />

        {!showMortgageFlow && (
        <div className="property-card-main">
          <div className="card-header">
            <button className="close-btn" onClick={onClose} aria-label="إغلاق">
              ×
            </button>
            <div className="badge">للبيع</div>
            <div className="prop-title">{title}</div>
            <div className="prop-addr">📍 {address}</div>
          </div>

          <div className="img-slider">
            {images.length > 0 ? (
              <img
                src={images[currentIndex]}
                alt={title}
                onClick={() => setShowImage(images[currentIndex])}
              />
            ) : (
              <div className="img-fallback">لا توجد صور متاحة</div>
            )}

            {images.length > 1 && (
              <>
                <button
                  className="slider-nav snav-r"
                  onClick={() => goToImage(currentIndex - 1)}
                  aria-label="الصورة السابقة"
                >
                  ‹
                </button>
                <button
                  className="slider-nav snav-l"
                  onClick={() => goToImage(currentIndex + 1)}
                  aria-label="الصورة التالية"
                >
                  ›
                </button>
                <div className="img-count">
                  {currentIndex + 1} / {images.length}
                </div>
                <div className="dots-row">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`dot ${index === currentIndex ? "on" : ""}`}
                      onClick={() => goToImage(index)}
                      aria-label={`الصورة ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="specs-bar">
            {specItems.map((item) => (
              <div key={item.label} className="spec">
                <div className="spec-val">{item.value}</div>
                <div className="spec-lbl">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="price-row">
            <div>
              <div className="price-main">{formatCurrency(propertyPrice)}</div>
              <div className="price-sub">
                {finishing} · {utilities}
              </div>
            </div>
            <div className="installment-tag">
              <div className="inst-val">{formatCurrency(monthlyInstallment)}</div>
              <div className="inst-lbl">قسط شهري تقريبي</div>
            </div>
          </div>

          {unitDetails.length > 0 && (
            <section className="unit-details">
              <h3>بيانات الوحدة</h3>
              <div className="unit-details-grid">
                {unitDetails.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
              </div>
            </section>
          )}

          <div className="action-btns">
            <button
              type="button"
              className="btn-secondary"
              onClick={hasVideo ? () => setShowVideo(true) : openMortgage}
            >
              {hasVideo ? "▶ مشاهدة الفيديو" : "📞 تواصل"}
            </button>
            <button type="button" className="btn-primary" onClick={openMortgage}>
              <span>🏦</span>
              <span>تقديم طلب تمويل عقاري</span>
            </button>
          </div>
        </div>
        )}

        {showMortgageFlow && (
        <div className="flow-overlay visible">
          <div className="flow-header">
            <div className="flow-title">
              {showSuccess ? "" : "طلب التمويل العقاري"}
            </div>
            <button type="button" className="flow-back" onClick={goBack}>
              {currentStep === 0 && !showSuccess ? "✕ إغلاق" : "→ رجوع"}
            </button>
          </div>

          {!showSuccess && (
            <>
              <div className="steps-bar">
                {stepLabels.map((label, index) => (
                  <div
                    key={label}
                    className={`step-item ${index < currentStep ? "done" : ""} ${index === currentStep ? "active" : ""}`}
                  >
                    <div className="step-dot">{index < currentStep ? "✓" : index + 1}</div>
                    {label}
                    {index < stepLabels.length - 1 && <div className="step-line" />}
                  </div>
                ))}
              </div>

              <div className="flow-body">
                {currentStep === 0 && (
                  <div>
                    <div className="section-title">👤 بياناتك الشخصية</div>
                    <div className="row-2">
                      <div className="field-group">
                        <label className="field-label">الاسم الأول</label>
                        <input className="field-input" placeholder="أحمد" />
                      </div>
                      <div className="field-group">
                        <label className="field-label">الاسم الأخير</label>
                        <input className="field-input" placeholder="محمد" />
                      </div>
                    </div>
                    <div className="field-group">
                      <label className="field-label">رقم الهاتف</label>
                      <input className="field-input" placeholder="01xxxxxxxxx" type="tel" />
                    </div>
                    <div className="field-group">
                      <label className="field-label">البريد الإلكتروني</label>
                      <input className="field-input" placeholder="ahmed@email.com" type="email" />
                    </div>
                    <div className="field-group">
                      <label className="field-label">الرقم القومي</label>
                      <input className="field-input" placeholder="14 رقم" />
                    </div>
                    <div className="field-group">
                      <label className="field-label">جهة العمل</label>
                      <div className="pill-options">
                        {JOB_OPTIONS.map((job) => (
                          <button
                            key={job}
                            type="button"
                            className={`pill ${selectedJob === job ? "on" : ""}`}
                            onClick={() => setSelectedJob(job)}
                          >
                            {job}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div>
                    <div className="section-title">💰 تفاصيل التمويل</div>

                    <div className="field-group">
                      <label className="field-label">قيمة الدفعة المقدمة</label>
                      <input
                        className="range-slider"
                        type="range"
                        min="10"
                        max="40"
                        value={downPaymentPercent}
                        style={{ "--val": `${((downPaymentPercent - 10) / 30) * 100}%` }}
                        onChange={(event) => setDownPaymentPercent(Number(event.target.value))}
                      />
                      <div className="range-labels">
                        <span>10%</span>
                        <span>{downPaymentPercent}%</span>
                        <span>40%</span>
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label">مدة القرض</label>
                      <div className="pill-options">
                        {PERIOD_OPTIONS.map((period) => (
                          <button
                            key={period.label}
                            type="button"
                            className={`pill ${selectedPeriod.label === period.label ? "on" : ""}`}
                            onClick={() => setSelectedPeriod(period)}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label">دخلك الشهري (جنيه)</label>
                      <input
                        className="field-input"
                        placeholder="مثال: 25000"
                        type="number"
                        value={income}
                        onChange={(event) => setIncome(Number(event.target.value) || 0)}
                      />
                    </div>

                    <div className="calc-box">
                      <div className="calc-row">
                        <span>سعر العقار</span>
                        <span className="calc-val">{formatCurrency(propertyPrice)}</span>
                      </div>
                      <div className="calc-row">
                        <span>الدفعة المقدمة</span>
                        <span className="calc-val">{formatCurrency(downPaymentAmount)}</span>
                      </div>
                      <div className="calc-row">
                        <span>مبلغ التمويل المطلوب</span>
                        <span className="calc-val">{formatCurrency(loanAmount)}</span>
                      </div>
                      <div className="calc-row">
                        <span>القسط الشهري التقريبي</span>
                        <span className="calc-val">{formatCurrency(monthlyInstallment)}</span>
                      </div>
                      <div className="calc-row">
                        <span>نسبة القسط من الدخل</span>
                        <span className="calc-val">
                          {incomeRatio}% {incomeRatio > 40 ? "⚠️" : "✓"}
                        </span>
                      </div>
                    </div>
                    <div className="info-badge">ℹ️ البنوك توصي بألا يتجاوز القسط 40% من الدخل</div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <div className="section-title">🏦 اختر البنك</div>
                    <div className="banks-grid">
                      {BANKS.map((bank) => (
                        <button
                          key={bank.name}
                          type="button"
                          className={`bank-card ${selectedBank === bank.name ? "selected" : ""}`}
                          onClick={() => setSelectedBank(bank.name)}
                        >
                          <div className="bank-name">{bank.name}</div>
                          <div className="bank-rate">فائدة {bank.rate}%</div>
                          <div className="bank-note">{bank.note}</div>
                        </button>
                      ))}
                    </div>
                    <div className="info-badge">✓ سيتواصل معك ممثل البنك خلال 48 ساعة عمل</div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <div className="section-title">📄 المستندات المطلوبة</div>
                    <div className="doc-list">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          className={`doc-item ${doc.uploaded ? "uploaded" : ""}`}
                          onClick={() => toggleDocument(doc.id)}
                        >
                          <div className="doc-icon">{doc.icon}</div>
                          <div className="doc-text">
                            <div className="doc-name">{doc.name}</div>
                            <div className="doc-sub">{doc.sub}</div>
                          </div>
                          <div className={`doc-status ${doc.uploaded ? "ok" : "pending"}`}>
                            {doc.uploaded ? "✓ تم" : "+ رفع"}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="info-badge">📤 يمكنك رفع المستندات لاحقاً من لوحة التحكم</div>
                  </div>
                )}
              </div>

              <div className="flow-footer">
                <button type="button" className="btn-full" onClick={nextStep}>
                  {nextLabels[currentStep]}
                </button>
              </div>
            </>
          )}

          {showSuccess && (
            <div className="success-screen-wrap">
              <div className="success-screen">
                <div className="success-icon">🏆</div>
                <div className="success-title">تم تقديم طلبك بنجاح!</div>
                <div className="success-sub">
                  سيتواصل معك فريقنا خلال 48 ساعة عمل
                  <br />
                  لمتابعة طلب التمويل العقاري الخاص بك
                </div>
                <div className="ref-box">
                  <div className="ref-lbl">رقم الطلب</div>
                  <div className="ref-num">
                    MRG-2026-{String(property.id || 8847).padStart(4, "0")}
                  </div>
                </div>
                <div className="timeline">
                  <div className="tl-item">
                    <div className="tl-dot" />
                    <div>
                      <div className="tl-text tl-text-strong">✅ تم استلام الطلب</div>
                      <div className="tl-time">الآن</div>
                    </div>
                  </div>
                  <div className="tl-item">
                    <div className="tl-dot gray" />
                    <div>
                      <div className="tl-text">مراجعة المستندات</div>
                      <div className="tl-time">خلال 2-3 أيام عمل</div>
                    </div>
                  </div>
                  <div className="tl-item">
                    <div className="tl-dot gray" />
                    <div>
                      <div className="tl-text">تقييم العقار</div>
                      <div className="tl-time">خلال أسبوع</div>
                    </div>
                  </div>
                  <div className="tl-item">
                    <div className="tl-dot gray" />
                    <div>
                      <div className="tl-text">قرار البنك</div>
                      <div className="tl-time">خلال 2-4 أسابيع</div>
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-full" onClick={resetFlow}>
                  العودة للخريطة
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {showImage && (
          <div className="image-modal" onClick={() => setShowImage(null)}>
            <img src={showImage} alt={title} />
          </div>
        )}

        {showVideo && property.video && (
          <div className="video-modal">
            <button
              type="button"
              className="close-video-btn"
              onClick={() => setShowVideo(false)}
              aria-label="إغلاق الفيديو"
            >
              ×
            </button>
            {property.video.startsWith("blob:") ? (
              <video src={property.video} title={`فيديو ${title}`} controls autoPlay />
            ) : (
              <iframe
                src={`${property.video}${property.video.includes("?") ? "&" : "?"}autoplay=1`}
                title={`فيديو ${title}`}
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
 
