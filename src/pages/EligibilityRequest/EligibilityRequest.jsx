import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { getCurrentUser } from "../../utils/auth";
import { fileMetadata, saveWorkflowRequest } from "../../utils/requestWorkflow";
import "./EligibilityRequest.css";

const steps = [
  { id: 1, title: "الهوية والعائلة", subtitle: "بيانات الهوية والحالة العائلية" },
  { id: 2, title: "العمل والدخل", subtitle: "بيانات العمل والالتزامات المالية" },
  { id: 3, title: "العنوان والإقامة", subtitle: "بيانات محل الإقامة" },
  { id: 4, title: "المراجعة", subtitle: "راجع بياناتك قبل الإرسال" },
];

const initialData = {
  fullName: "",
  birthDate: "",
  phone: "",
  gender: "",
  identityType: "",
  nationalId: "",
  occupation: "",
  maritalStatus: "",
  dependents: "",
  employmentType: "",
  employer: "",
  jobTitle: "",
  contractType: "",
  workDuration: "",
  monthlyIncome: "",
  salaryTransferred: "",
  otherIncome: "",
  loanInstallments: "",
  otherCommitments: "",
  governorate: "",
  area: "",
  address: "",
  housingType: "",
  residenceDuration: "",
};

const initialDocuments = {
  salaryStatement: null,
  identityCard: null,
};

function Field({ label, name, value, onChange, type = "text", required, children, placeholder }) {
  return (
    <label className="eligibility-field">
      <span>{label}{required && <b>*</b>}</span>
      {children || (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      )}
    </label>
  );
}

function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <Field label={label} name={name} value={value} onChange={onChange} required={required}>
      <select name={name} value={value} onChange={onChange} required={required}>
        <option value="">اختر من القائمة</option>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </Field>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="eligibility-section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function ReviewGroup({ title, fields, data }) {
  return (
    <div className="review-group">
      <h3>{title}</h3>
      <div className="review-grid">
        {fields.map(([label, key]) => (
          <div className="review-row" key={key}>
            <span>{label}</span>
            <strong>{data[key] || "لم يتم إدخال قيمة"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EligibilityRequest({
  registrationMode = false,
  initialProfile,
  onComplete,
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(() => {
    const user = registrationMode ? null : getCurrentUser();
    const savedProfile = initialProfile || user?.eligibilityProfile || {};
    const profileData = Object.fromEntries(
      Object.keys(initialData).map((field) => [field, savedProfile[field] ?? ""]),
    );
    return {
      ...initialData,
      ...profileData,
      fullName:
        savedProfile.fullName ||
        [user?.firstName, user?.lastName, initialProfile?.firstName, initialProfile?.lastName]
          .filter(Boolean)
          .join(" "),
      phone:
        savedProfile.phone ||
        user?.phone ||
        initialProfile?.phone ||
        user?.companyPhone ||
        user?.bankPhone ||
        "",
      nationalId: savedProfile.nationalId || user?.nationalId || initialProfile?.nationalId || "",
    };
  });
  const [documents, setDocuments] = useState(initialDocuments);
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const navigate = useNavigate();

  const updateField = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const updateDocument = (event) => {
    const { name, files } = event.target;
    setDocuments((current) => ({ ...current, [name]: files?.[0] || null }));
  };

  const openDocument = (documentKey) => {
    const file = documents[documentKey];
    if (!file) return;
    window.open(URL.createObjectURL(file), "_blank", "noopener,noreferrer");
  };

  const replaceDocument = (documentKey) => {
    document.getElementById(`replace-${documentKey}`)?.click();
  };

  const removeDocument = (documentKey) => {
    setDocuments((current) => ({ ...current, [documentKey]: null }));
  };

  const goNext = (event) => {
    event.preventDefault();
    if (step === 2 && (!documents.salaryStatement || !documents.identityCard)) {
      alert("يرجى إرفاق مفردات المرتب وصورة البطاقة قبل المتابعة.");
      return;
    }
    if (step === 4 && (!documents.salaryStatement || !documents.identityCard)) {
      alert("يرجى إرفاق المستندات المطلوبة قبل إرسال الطلب.");
      return;
    }
    if (step < steps.length) setStep((current) => current + 1);
    else {
      const generatedNumber = `ELG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      if (registrationMode) {
        onComplete({
          data: { ...data },
          documents: { ...documents },
          requestNumber: generatedNumber,
        });
        return;
      }

      saveWorkflowRequest({
        id: generatedNumber, kind: "eligibility", requestNumber: generatedNumber,
        createdAt: new Date().toISOString(), status: "review", data: { ...data },
        documents: [fileMetadata(documents.salaryStatement, "مفردات المرتب"), fileMetadata(documents.identityCard, "صورة بطاقة الهوية")].filter(Boolean),
      });
      setRequestNumber(generatedNumber);
      setSubmitted(true);
    }
  };

  if (submitted && !registrationMode) {
    return (
      <div className="eligibility-page" dir="rtl">
        <Navbar />
        <main className="eligibility-shell">
          <section className="eligibility-success">
            <div className="success-mark">✓</div>
            <span className="form-kicker">تم استلام طلبك بنجاح</span>
            <h1>طلب التحقق من الأهلية قيد المراجعة</h1>
            <p>سيقوم فريقنا بمراجعة بياناتك والتواصل معك خلال يومي عمل.</p>
            <div className="request-number-card">
              <span>رقم الطلب</span>
              <strong>{requestNumber}</strong>
              <small>احتفظ بهذا الرقم لمتابعة حالة طلبك</small>
            </div>
            <button className="primary-action" type="button" onClick={() => navigate("/")}>العودة إلى الرئيسية</button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`eligibility-page${registrationMode ? " eligibility-page--embedded" : ""}`}
      dir="rtl"
    >
      {!registrationMode && <Navbar />}
      <main className="eligibility-shell">
        {registrationMode && (
          <div className="eligibility-registration-note" role="note">
            <span className="eligibility-registration-note-icon" aria-hidden="true">
              🔒
            </span>
            <div>
              <strong>لماذا نطلب هذه البيانات؟</strong>
              <p>
                نستخدمها للتحقق من أهليتك للحصول على تمويل عقاري ومساعدتك في
                الوصول إلى وحدات تناسب قدرتك الشرائية بسرعة أكبر. بياناتك
                الشخصية ومستنداتك سرية ومحمية، وتُستخدم لهذا الغرض فقط.
              </p>
            </div>
          </div>
        )}
        <div className="eligibility-heading">
          <div>
            <span className="form-kicker">خدمة التحقق من الأهلية</span>
            <h1>طلب التحقق من الأهلية</h1>
            <p>أدخل بياناتك بدقة لمساعدتنا على تقييم أهليتك وتقديم الخدمة المناسبة لك.</p>
          </div>
          {!registrationMode && <Link className="back-home" to="/">العودة للرئيسية</Link>}
        </div>

        <section className="eligibility-card">
          <div className="eligibility-progress">
            {steps.map((item) => (
              <div className={`progress-step ${step >= item.id ? "active" : ""} ${step === item.id ? "current" : ""}`} key={item.id}>
                <span>{step > item.id ? "✓" : item.id}</span>
                <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
              </div>
            ))}
          </div>

          <form onSubmit={goNext}>
            {step === 1 && (
              <>
                <SectionTitle eyebrow="الخطوة 1 من 4" title="الهوية والحالة العائلية" description="أدخل بيانات الهوية والحالة الاجتماعية وعدد المعالين والبيانات الأساسية." />
                <div className="form-grid">
                  <Field label="الاسم بالكامل" name="fullName" value={data.fullName} onChange={updateField} required placeholder="مثال: أسماء عبد الناصر محمد" />
                  <Field label="تاريخ الميلاد" name="birthDate" value={data.birthDate} onChange={updateField} type="date" required />
                  <Field label="رقم الهاتف" name="phone" value={data.phone} onChange={updateField} type="tel" required placeholder="01XXXXXXXXX" />
                  <SelectField label="النوع" name="gender" value={data.gender} onChange={updateField} options={["ذكر", "أنثى"]} required />
                  <SelectField label="إثبات الهوية" name="identityType" value={data.identityType} onChange={updateField} options={["رقم قومي", "جواز السفر"]} required />
                  <Field label={data.identityType === "جواز السفر" ? "رقم جواز السفر" : "الرقم القومي"} name="nationalId" value={data.nationalId} onChange={updateField} required placeholder="أدخل رقم الهوية" />
                  <Field label="المهنة المثبتة" name="occupation" value={data.occupation} onChange={updateField} required placeholder="مثال: مطور برمجيات" />
                  <SelectField label="الحالة الاجتماعية" name="maritalStatus" value={data.maritalStatus} onChange={updateField} options={["أعزب", "متزوج", "مطلق", "أرمل"]} required />
                  <Field label="عدد المعالين" name="dependents" value={data.dependents} onChange={updateField} type="number" placeholder="0" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <SectionTitle eyebrow="الخطوة 2 من 4" title="العمل والالتزامات المالية" description="ساعدنا على تكوين صورة دقيقة عن عملك ودخلك والتزاماتك الحالية." />
                <h3 className="subsection-title">بيانات العمل</h3>
                <div className="form-grid">
                  <SelectField label="نوع العمل" name="employmentType" value={data.employmentType} onChange={updateField} options={["قطاع خاص", "قطاع حكومي", "أعمال حرة", "متقاعد", "بدون عمل"]} required />
                  <Field label="اسم جهة العمل" name="employer" value={data.employer} onChange={updateField} required placeholder="مثال: شركة إيدج برو" />
                  <Field label="المسمى الوظيفي" name="jobTitle" value={data.jobTitle} onChange={updateField} required placeholder="مثال: مطور برمجيات" />
                  <SelectField label="نوع عقد العمل" name="contractType" value={data.contractType} onChange={updateField} options={["عقد عمل بدوام كامل", "عقد عمل بدوام جزئي", "عمل حر", "أخرى"]} />
                  <SelectField label="مدة العمل أو النشاط" name="workDuration" value={data.workDuration} onChange={updateField} options={["أقل من سنة", "من سنة إلى 3 سنوات", "أكثر من 3 سنوات"]} required />
                  <Field label="الدخل الشهري" name="monthlyIncome" value={data.monthlyIncome} onChange={updateField} type="number" required placeholder="" />
                </div>
                <h3 className="subsection-title">تفاصيل الدخل والالتزامات</h3>
                <div className="form-grid">
                  <SelectField label="هل يتم تحويل الراتب إلى البنك؟" name="salaryTransferred" value={data.salaryTransferred} onChange={updateField} options={["نعم", "لا"]} required />
                  <SelectField label="هل توجد مصادر دخل أخرى؟" name="otherIncome" value={data.otherIncome} onChange={updateField} options={["نعم", "لا"]} required />
                  <Field label="إجمالي الأقساط الشهرية الحالية للقروض" name="loanInstallments" value={data.loanInstallments} onChange={updateField} type="number" placeholder="اتركه فارغًا إذا لم يوجد" />
                  <Field label="التزامات شهرية أخرى" name="otherCommitments" value={data.otherCommitments} onChange={updateField} type="number" placeholder="اتركه فارغًا إذا لم يوجد" />
                </div>
                <h3 className="subsection-title">المستندات المطلوبة</h3>
                <div className="documents-grid">
                  <label className="document-upload">
                    <span className="document-icon">▣</span>
                    <span className="document-content">
                      <strong>مفردات المرتب</strong>
                      <small>ارفع ملف PDF أو صورة واضحة</small>
                      <em>{documents.salaryStatement?.name || "لم يتم اختيار ملف"}</em>
                    </span>
                    <input name="salaryStatement" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={updateDocument} />
                    <span className="document-button">اختيار ملف</span>
                  </label>
                  <label className="document-upload">
                    <span className="document-icon">▣</span>
                    <span className="document-content">
                      <strong>صورة البطاقة</strong>
                      <small>الوجه الأمامي للبطاقة الشخصية</small>
                      <em>{documents.identityCard?.name || "لم يتم اختيار ملف"}</em>
                    </span>
                    <input name="identityCard" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={updateDocument} />
                    <span className="document-button">اختيار ملف</span>
                  </label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <SectionTitle eyebrow="الخطوة 3 من 4" title="العنوان ومحل الإقامة" description="أدخل عنوان إقامتك الحالي بالتفصيل حتى نتمكن من استكمال طلبك." />
                <div className="form-grid">
                  <SelectField label="المحافظة" name="governorate" value={data.governorate} onChange={updateField} options={["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "المنوفية"]} required />
                  <Field label="المدينة / المنطقة" name="area" value={data.area} onChange={updateField} required placeholder="مثال: حلوان" />
                  <Field label="العنوان بالتفصيل" name="address" value={data.address} onChange={updateField} required placeholder="مثال: شارع علي كامل، حدائق حلوان" />
                  <SelectField label="نوع السكن الحالي" name="housingType" value={data.housingType} onChange={updateField} options={["تمليك", "إيجار", "سكن عائلي", "أخرى"]} required />
                  <SelectField label="مدة الإقامة" name="residenceDuration" value={data.residenceDuration} onChange={updateField} options={["أقل من سنة", "أكثر من سنة", "أكثر من 5 سنوات"]} required />
                </div>
                <div className="privacy-note">🔒 بياناتك محمية وتستخدم فقط لغرض دراسة طلب التحقق من الأهلية.</div>
              </>
            )}

            {step === 4 && (
              <>
                <SectionTitle eyebrow="الخطوة 4 من 4" title="مراجعة البيانات" description="راجع البيانات التالية قبل إرسال طلب التحقق من الأهلية." />
                <ReviewGroup title="الهوية والحالة العائلية" data={data} fields={[["الاسم بالكامل", "fullName"], ["تاريخ الميلاد", "birthDate"], ["رقم الهاتف", "phone"], ["النوع", "gender"], ["إثبات الهوية", "identityType"], ["رقم الهوية", "nationalId"], ["الحالة الاجتماعية", "maritalStatus"], ["عدد المعالين", "dependents"]]} />
                <ReviewGroup title="العمل والدخل" data={data} fields={[["نوع العمل", "employmentType"], ["جهة العمل", "employer"], ["المسمى الوظيفي", "jobTitle"], ["الدخل الشهري", "monthlyIncome"], ["تحويل الراتب", "salaryTransferred"], ["مصادر دخل أخرى", "otherIncome"]]} />
                <ReviewGroup title="العنوان والإقامة" data={data} fields={[["المحافظة", "governorate"], ["المنطقة", "area"], ["العنوان", "address"], ["نوع السكن", "housingType"], ["مدة الإقامة", "residenceDuration"]]} />
                <div className="documents-summary">
                  <strong>المستندات المرفقة</strong>
                  {[
                    ["salaryStatement", "مفردات المرتب"],
                    ["identityCard", "صورة البطاقة"],
                  ].map(([documentKey, label]) => (
                    <div className="document-review-row" key={documentKey}>
                      <div className="document-review-name">
                        <span className="document-review-icon">▣</span>
                        <span>
                          <b>{label}</b>
                          <small>{documents[documentKey]?.name || "لم يتم الإرفاق"}</small>
                        </span>
                      </div>
                      <div className="document-review-actions">
                        <button type="button" className="document-action view" onClick={() => openDocument(documentKey)} disabled={!documents[documentKey]}>فتح</button>
                        <button type="button" className="document-action replace" onClick={() => replaceDocument(documentKey)}>استبدال</button>
                        <button type="button" className="document-action remove" onClick={() => removeDocument(documentKey)} disabled={!documents[documentKey]}>حذف</button>
                        <input id={`replace-${documentKey}`} name={documentKey} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={updateDocument} />
                      </div>
                    </div>
                  ))}
                </div>
                <label className="consent"><input type="checkbox" required /> أقر بصحة البيانات المدخلة وأوافق على استخدامها لدراسة طلب التحقق من الأهلية.</label>
              </>
            )}

            <div className="form-actions">
              {step > 1 && <button type="button" className="secondary-action" onClick={() => setStep((current) => current - 1)}>السابق</button>}
              <button type="submit" className="primary-action">{step === 4 ? "إرسال الطلب" : "التالي"}<span>←</span></button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
