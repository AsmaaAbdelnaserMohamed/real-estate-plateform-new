import { useState, useRef, useEffect } from "react";
import {
  fileMetadata,
  getWorkflowRequests,
  saveWorkflowFiles,
  saveWorkflowRequest,
} from "../../utils/requestWorkflow";

const CONSULTATION_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const CONSULTATION_FILE_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;
const CONSULTATION_FILE_MAX_SIZE = 10 * 1024 * 1024;

function isValidConsultationFile(file) {
  return (
    CONSULTATION_FILE_EXTENSIONS.test(file.name)
    && file.size <= CONSULTATION_FILE_MAX_SIZE
    && (!file.type || CONSULTATION_FILE_TYPES.has(file.type))
  );
}

function createConsultationRequestNumber() {
  const timestamp = Date.now().toString().slice(-8);
  let requestNumber = `CON-${timestamp}`;
  let suffix = 1;
  const existingIds = new Set(getWorkflowRequests().map((request) => String(request.id)));
  while (existingIds.has(requestNumber)) {
    requestNumber = `CON-${timestamp}-${suffix}`;
    suffix += 1;
  }
  return requestNumber;
}
import "./RequestForm.css";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const FORM_TYPES = {
  financing: "financing",
  consultation: "consultation",
};

const PROPERTY_TYPES = [
  "شقة سكنية",
  "فيلا أو منزل",
  "أرض فضاء",
  "محل تجاري",
  "عقار إداري",
  "مخزن أو مستودع",
];

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحيرة",
  "الشرقية", "القليوبية", "كفر الشيخ", "الغربية", "المنوفية",
  "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان",
  "بورسعيد", "الإسماعيلية", "السويس", "دمياط", "الفيوم",
  "بني سويف", "شمال سيناء", "جنوب سيناء", "البحر الأحمر",
  "الوادي الجديد", "مطروح",
];

const CONSULT_TOPICS = [
  "تسجيل عقاري",
  "نزاع على ملكية",
  "عقد بيع أو إيجار",
  "توثيق الملكية",
  "مشكلة في التمويل",
  "استفسار قانوني عام",
];

const STEP_TITLES = {
  financing:    ["اختر نوع الطلب", "بيانات العقار والتمويل", "رفع المستندات", "البيانات الشخصية", "مراجعة وإرسال"],
  consultation: ["اختر نوع الطلب", "تفاصيل الاستشارة", "بيانات العقار", "مراجعة وإرسال"],
};

// ─────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────
function StepIndicator({ step, formType }) {
  const steps =
    formType === FORM_TYPES.financing
      ? ["نوع الطلب", "بيانات العقار", "المستندات", "البيانات الشخصية", "المراجعة"]
      : ["نوع الطلب", "بيانات الاستشارة", "بيانات العقار", "المراجعة"];

  return (
    <div className="rf-step-indicator">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const isActive = num === step;
        const isDone = num < step;
        return (
          <div key={label} className="rf-step-wrap">
            <div className={`rf-step-circle ${isActive ? "rf-step-active" : isDone ? "rf-step-done" : ""}`}>
              {isDone ? "✓" : num}
            </div>
            <span className={`rf-step-label ${isActive ? "rf-step-label-active" : ""}`}>{label}</span>
            {idx < steps.length - 1 && (
              <div className={`rf-step-line ${isDone ? "rf-step-line-done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FileUploadZone({ label, hint, name, files, onChange }) {
  const inputRef = useRef();
  const handleDrop = (e) => {
    e.preventDefault();
    onChange(name, [...(files || []), ...Array.from(e.dataTransfer.files)]);
  };
  const handleChange = (e) => {
    onChange(name, [...(files || []), ...Array.from(e.target.files)]);
  };
  const removeFile = (idx) =>
    onChange(name, (files || []).filter((_, i) => i !== idx));

  return (
    <div className="rf-upload-zone" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <input ref={inputRef} type="file" multiple hidden onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
      <div className="rf-upload-icon">📎</div>
      <p className="rf-upload-label">{label}</p>
      <p className="rf-upload-hint">{hint || "PDF أو JPG أو PNG — بحد أقصى 10 ميجا لكل ملف"}</p>
      <button type="button" className="rf-upload-btn" onClick={() => inputRef.current.click()}>
        اختر الملفات
      </button>
      {files && files.length > 0 && (
        <ul className="rf-file-list">
          {files.map((f, i) => (
            <li key={i} className="rf-file-item">
              <span className="rf-file-icon">📄</span>
              <span className="rf-file-name">{f.name}</span>
              <button type="button" className="rf-file-remove" onClick={() => removeFile(i)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormField({ label, required, error, children, fullWidth }) {
  return (
    <div className={`rf-field ${error ? "rf-field-error" : ""} ${fullWidth ? "rf-field-full" : ""}`}>
      <label className="rf-label">
        {label}
        {required && <span className="rf-required">*</span>}
      </label>
      {children}
      {error && <span className="rf-error-msg">{error}</span>}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="rf-review-row">
      <span className="rf-review-label">{label}</span>
      <span className="rf-review-value">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 1 — Type Selection
// ─────────────────────────────────────────────
function TypeStep({ formType, setFormType, setErrors, errors }) {
  return (
    <div className="rf-type-step">
      <div className="rf-type-cards">
        <div
          className={`rf-type-card ${formType === FORM_TYPES.financing ? "rf-type-selected" : ""}`}
          onClick={() => { setFormType(FORM_TYPES.financing); setErrors({}); }}
        >
          <div className="rf-type-icon" style={{ background: "#0ea5e918", border: "1.5px solid #0ea5e940" }}>🏦</div>
          <h3 className="rf-type-title">تسجيل طلب تمويل عقاري</h3>
          <p className="rf-type-desc">
            قدّم طلبك للحصول على تمويل عقاري من أفضل البنوك والشركات المعتمدة.
          </p>
          <ul className="rf-type-features">
            <li>✅ تمويل يصل إلى 5 مليون جنيه</li>
            <li>✅ معالجة في 3 أيام عمل</li>
            <li>✅ 120+ بنك وشركة تمويل</li>
          </ul>
          {formType === FORM_TYPES.financing && <div className="rf-type-check">✓</div>}
        </div>

        <div
          className={`rf-type-card ${formType === FORM_TYPES.consultation ? "rf-type-selected" : ""}`}
          onClick={() => { setFormType(FORM_TYPES.consultation); setErrors({}); }}
        >
          <div className="rf-type-icon" style={{ background: "#10b98118", border: "1.5px solid #10b98140" }}>⚖️</div>
          <h3 className="rf-type-title">طلب استشارة قانونية عقارية</h3>
          <p className="rf-type-desc">
            تواصل مع خبراء قانونيين معتمدين لحل مشكلاتك العقارية والحصول على المشورة المتخصصة.
          </p>
          <ul className="rf-type-features">
            <li>✅ خبراء معتمدون من نقابة المحامين</li>
            <li>✅ رد خلال 24 ساعة</li>
            <li>✅ استشارة أولية مجانية</li>
          </ul>
          {formType === FORM_TYPES.consultation && <div className="rf-type-check">✓</div>}
        </div>
      </div>
      {errors.formType && <p className="rf-error-msg rf-center-error">{errors.formType}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Financing — Step 2
// ─────────────────────────────────────────────
function FinancingStep2({ data, set, errors }) {
  return (
    <div className="rf-grid">
      <FormField label="نوع العقار" required error={errors.propertyType}>
        <select className="rf-select" value={data.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
          <option value="">-- اختر نوع العقار --</option>
          {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </FormField>

      <FormField label="المحافظة" required error={errors.governorate}>
        <select className="rf-select" value={data.governorate} onChange={(e) => set("governorate", e.target.value)}>
          <option value="">-- اختر المحافظة --</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </FormField>

      <FormField label="الحي / المنطقة" error={errors.district}>
        <input className="rf-input" placeholder="مثال: المعادي، مدينة نصر..." value={data.district} onChange={(e) => set("district", e.target.value)} />
      </FormField>

      <FormField label="عنوان العقار كاملاً" required error={errors.address}>
        <input className="rf-input" placeholder="الشارع، رقم العمارة، الطابق..." value={data.address} onChange={(e) => set("address", e.target.value)} />
      </FormField>

      <FormField label="المساحة (م²)" required error={errors.area}>
        <input className="rf-input" type="number" placeholder="مثال: 120" value={data.area} onChange={(e) => set("area", e.target.value)} />
      </FormField>

      <FormField label="مبلغ التمويل المطلوب (جنيه)" required error={errors.loanAmount}>
        <input className="rf-input" type="number" placeholder="مثال: 500000" value={data.loanAmount} onChange={(e) => set("loanAmount", e.target.value)} />
      </FormField>

      <FormField label="مدة السداد المفضلة" error={errors.duration}>
        <select className="rf-select" value={data.duration} onChange={(e) => set("duration", e.target.value)}>
          <option value="">-- اختر المدة --</option>
          {[5, 7, 10, 15, 20, 25, 30].map((y) => <option key={y} value={y}>{y} سنة</option>)}
        </select>
      </FormField>

      <FormField label="الدخل الشهري الإجمالي (جنيه)" error={errors.income}>
        <input className="rf-input" type="number" placeholder="مثال: 15000" value={data.income} onChange={(e) => set("income", e.target.value)} />
      </FormField>

      <FormField label="تفضيل جهة التمويل (اختياري)" error={errors.bankPref}>
        <input className="rf-input" placeholder="اسم البنك أو الشركة إن وُجد" value={data.bankPref} onChange={(e) => set("bankPref", e.target.value)} />
      </FormField>
    </div>
  );
}

// ─────────────────────────────────────────────
// Financing — Step 3
// ─────────────────────────────────────────────
function FinancingStep3({ data, setFiles, errors }) {
  return (
    <div className="rf-docs-step">
      <div className="rf-docs-info">
        <span className="rf-docs-info-icon">ℹ️</span>
        <p>يرجى رفع المستندات التالية لإتمام طلب التمويل. التنسيقات المقبولة: PDF، JPG، PNG.</p>
      </div>
      <div className="rf-docs-grid">
        <div className="rf-doc-group">
          <h4 className="rf-doc-group-title">🏠 مستندات إثبات ملكية العقار</h4>
          <p className="rf-doc-group-sub">عقد بيع، شهادة تسجيل، كشف التسجيل العقاري...</p>
          <FileUploadZone label="ارفع مستندات الملكية" name="titleDocs" files={data.titleDocs} onChange={setFiles} />
          {errors.docs && <p className="rf-error-msg">{errors.docs}</p>}
        </div>
        <div className="rf-doc-group">
          <h4 className="rf-doc-group-title">📋 مستندات الطلب الأخرى</h4>
          <p className="rf-doc-group-sub">كشف راتب، إفادة بنكية، رخصة بناء...</p>
          <FileUploadZone label="ارفع المستندات الداعمة" name="docs" files={data.docs} onChange={setFiles} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Financing — Step 4
// ─────────────────────────────────────────────
function FinancingStep4({ data, set, errors }) {
  return (
    <div className="rf-grid">
      <FormField label="الاسم الكامل" required error={errors.ownerName}>
        <input className="rf-input" placeholder="الاسم الرباعي" value={data.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
      </FormField>

      <FormField label="الرقم القومي" required error={errors.nationalId}>
        <input className="rf-input" maxLength={14} placeholder="14 رقماً" value={data.nationalId} onChange={(e) => set("nationalId", e.target.value.replace(/\D/g, ""))} />
      </FormField>

      <FormField label="رقم الهاتف" required error={errors.phone}>
        <input className="rf-input" placeholder="01XXXXXXXXX" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
      </FormField>

      <FormField label="البريد الإلكتروني" error={errors.email}>
        <input className="rf-input" type="email" placeholder="example@email.com" value={data.email} onChange={(e) => set("email", e.target.value)} />
      </FormField>
    </div>
  );
}

// ─────────────────────────────────────────────
// Attachments Review — shared between both flows
// ─────────────────────────────────────────────
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

function getFileExt(name) {
  return (name.split(".").pop() || "").toLowerCase();
}

function isImage(file) {
  return IMAGE_EXTS.includes(getFileExt(file.name));
}

function FilePreviewCard({ file, onRemove }) {
  const [preview, setPreview] = useState(null);
  const [lightbox, setLightbox] = useState(false);
  const img = isImage(file);

  // generate object URL once and revoke on unmount
  useEffect(() => {
    if (img) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, img]);

  const ext = getFileExt(file.name).toUpperCase();
  const sizeKB = (file.size / 1024).toFixed(0);
  const sizeTxt = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${sizeKB} KB`;

  return (
    <>
      <div className="rf-attach-card">
        {/* Thumbnail */}
        <div
          className={`rf-attach-thumb ${img ? "rf-attach-thumb-img" : "rf-attach-thumb-file"}`}
          onClick={() => img && setLightbox(true)}
          style={img && preview ? { backgroundImage: `url(${preview})` } : {}}
        >
          {!img && <span className="rf-attach-ext">{ext}</span>}
          {img && <span className="rf-attach-zoom">🔍</span>}
        </div>

        {/* Info */}
        <div className="rf-attach-info">
          <p className="rf-attach-name" title={file.name}>{file.name}</p>
          <p className="rf-attach-meta">{ext} &bull; {sizeTxt}</p>
        </div>

        {/* Actions */}
        <div className="rf-attach-actions">
          {img && (
            <button
              type="button"
              className="rf-attach-action rf-attach-preview"
              onClick={() => setLightbox(true)}
              title="معاينة"
            >
              👁
            </button>
          )}
          <a
            className="rf-attach-action rf-attach-download"
            href={URL.createObjectURL(file)}
            download={file.name}
            title="تحميل"
          >
            ⬇
          </a>
          {onRemove && (
            <button
              type="button"
              className="rf-attach-action rf-attach-delete"
              onClick={onRemove}
              title="حذف"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && img && preview && (
        <div className="rf-lightbox" onClick={() => setLightbox(false)}>
          <div className="rf-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="rf-lightbox-close" onClick={() => setLightbox(false)}>✕</button>
            <img src={preview} alt={file.name} className="rf-lightbox-img" />
            <p className="rf-lightbox-name">{file.name}</p>
          </div>
        </div>
      )}
    </>
  );
}

function AttachmentsReview({ groups, onRemove }) {
  const allEmpty = groups.every((g) => !g.files || g.files.length === 0);

  return (
    <div className="rf-review-section">
      <h4 className="rf-review-heading">📎 المرفقات والمستندات</h4>

      {allEmpty ? (
        <div className="rf-attach-empty">
          <span className="rf-attach-empty-icon">📭</span>
          <p>لم يتم إرفاق أي مستندات</p>
        </div>
      ) : (
        <div className="rf-attach-groups">
          {groups.map((group) =>
            group.files && group.files.length > 0 ? (
              <div key={group.label} className="rf-attach-group">
                <p className="rf-attach-group-label">
                  {group.label}
                  <span className="rf-attach-count">{group.files.length} ملف</span>
                </p>
                <div className="rf-attach-list">
                  {group.files.map((file, idx) => (
                    <FilePreviewCard
                      key={`${file.name}-${idx}`}
                      file={file}
                      onRemove={onRemove ? () => onRemove(group.name, idx) : null}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Financing — Step 5 (Review)
// ─────────────────────────────────────────────
function FinancingReview({ data }) {
  return (
    <div className="rf-review">
      <div className="rf-review-section">
        <h4 className="rf-review-heading">🏠 بيانات العقار والتمويل</h4>
        <div className="rf-review-grid">
          <ReviewRow label="نوع العقار"   value={data.propertyType} />
          <ReviewRow label="المحافظة"     value={data.governorate} />
          <ReviewRow label="المنطقة"      value={data.district || "—"} />
          <ReviewRow label="العنوان"      value={data.address} />
          <ReviewRow label="المساحة"      value={data.area ? `${data.area} م²` : "—"} />
          <ReviewRow label="مبلغ التمويل" value={data.loanAmount ? `${Number(data.loanAmount).toLocaleString("ar-EG")} جنيه` : "—"} />
          <ReviewRow label="مدة السداد"   value={data.duration ? `${data.duration} سنة` : "—"} />
          <ReviewRow label="الدخل الشهري" value={data.income ? `${Number(data.income).toLocaleString("ar-EG")} جنيه` : "—"} />
        </div>
      </div>
      <AttachmentsReview
        groups={[
          { label: "🏠 مستندات إثبات الملكية", files: data.titleDocs },
          { label: "📋 مستندات داعمة",          files: data.docs },
        ]}
      />
      <div className="rf-review-section">
        <h4 className="rf-review-heading">👤 البيانات الشخصية</h4>
        <div className="rf-review-grid">
          <ReviewRow label="الاسم"       value={data.ownerName} />
          <ReviewRow label="الرقم القومي" value={data.nationalId} />
          <ReviewRow label="الهاتف"      value={data.phone} />
          <ReviewRow label="البريد"      value={data.email || "—"} />
        </div>
      </div>
      <div className="rf-review-notice">
        <span>🔒</span>
        <p>بياناتك محمية بتشفير 256-bit. بالمتابعة فأنت توافق على سياسة الخصوصية وشروط الاستخدام.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Consultation — Step 2
// ─────────────────────────────────────────────
function ConsultStep2({ data, set, errors }) {
  return (
    <div className="rf-grid">
      <FormField label="الاسم الكامل" required error={errors.consultantName}>
        <input className="rf-input" placeholder="الاسم الرباعي" value={data.consultantName} onChange={(e) => set("consultantName", e.target.value)} />
      </FormField>

      <FormField label="رقم الهاتف" required error={errors.consultantPhone}>
        <input className="rf-input" placeholder="01XXXXXXXXX" value={data.consultantPhone} onChange={(e) => set("consultantPhone", e.target.value)} />
      </FormField>

      <FormField label="البريد الإلكتروني" error={errors.consultantEmail}>
        <input className="rf-input" type="email" placeholder="example@email.com" value={data.consultantEmail} onChange={(e) => set("consultantEmail", e.target.value)} />
      </FormField>

      <FormField label="موضوع الاستشارة" required error={errors.consultTopic}>
        <select className="rf-select" value={data.consultTopic} onChange={(e) => set("consultTopic", e.target.value)}>
          <option value="">-- اختر الموضوع --</option>
          {CONSULT_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </FormField>

      <FormField label="درجة الاستعجال" error={errors.urgency}>
        <div className="rf-radio-group">
          {["عادي", "عاجل", "عاجل جداً"].map((u) => (
            <label key={u} className={`rf-radio-label ${data.urgency === u ? "rf-radio-active" : ""}`}>
              <input type="radio" name="urgency" value={u} checked={data.urgency === u} onChange={() => set("urgency", u)} />
              {u}
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="طريقة التواصل المفضلة" error={errors.preferredContact}>
        <div className="rf-radio-group">
          {["هاتف", "واتساب", "بريد إلكتروني"].map((c) => (
            <label key={c} className={`rf-radio-label ${data.preferredContact === c ? "rf-radio-active" : ""}`}>
              <input type="radio" name="contact" value={c} checked={data.preferredContact === c} onChange={() => set("preferredContact", c)} />
              {c}
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="تفاصيل الاستشارة" required error={errors.consultDetails} fullWidth>
        <textarea
          className="rf-textarea"
          rows={5}
          placeholder="اشرح مشكلتك أو استفسارك بالتفصيل لمساعدتك بشكل أفضل..."
          value={data.consultDetails}
          onChange={(e) => set("consultDetails", e.target.value)}
        />
        <span className="rf-char-count">{data.consultDetails.length} حرف</span>
      </FormField>
    </div>
  );
}

// ─────────────────────────────────────────────
// Consultation — Step 3
// ─────────────────────────────────────────────
function ConsultStep3({ data, set, setFiles, errors }) {
  return (
    <div className="rf-grid">
      <div className="rf-section-note">
        <span>ℹ️</span>
        <span>بيانات العقار محل الاستشارة — يمكن تركها فارغة إن لم تكن ذات صلة</span>
      </div>

      <FormField label="نوع العقار" error={errors.propertyType}>
        <select className="rf-select" value={data.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
          <option value="">-- اختر نوع العقار --</option>
          {PROPERTY_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </FormField>

      <FormField label="المحافظة" error={errors.governorate}>
        <select className="rf-select" value={data.governorate} onChange={(e) => set("governorate", e.target.value)}>
          <option value="">-- اختر المحافظة --</option>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </FormField>

      <FormField label="الحي / المنطقة" error={errors.district}>
        <input className="rf-input" placeholder="اختياري" value={data.district} onChange={(e) => set("district", e.target.value)} />
      </FormField>

      <FormField label="العنوان التفصيلي" error={errors.address}>
        <input className="rf-input" placeholder="اختياري" value={data.address} onChange={(e) => set("address", e.target.value)} />
      </FormField>

      <div className="rf-doc-group rf-field-full">
        <h4 className="rf-doc-group-title">📎 مستندات داعمة للاستشارة (اختياري)</h4>
        <p className="rf-doc-group-sub">عقود، صور، وثائق رسمية ذات صلة بموضوع الاستشارة</p>
        <FileUploadZone label="ارفع المستندات" name="docs" files={data.docs} onChange={setFiles} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Consultation — Step 4 (Review)
// ─────────────────────────────────────────────
function ConsultReview({ data }) {
  return (
    <div className="rf-review">
      <div className="rf-review-section">
        <h4 className="rf-review-heading">⚖️ تفاصيل الاستشارة</h4>
        <div className="rf-review-grid">
          <ReviewRow label="الاسم"            value={data.consultantName} />
          <ReviewRow label="الهاتف"           value={data.consultantPhone} />
          <ReviewRow label="البريد"           value={data.consultantEmail || "—"} />
          <ReviewRow label="الموضوع"          value={data.consultTopic} />
          <ReviewRow label="درجة الاستعجال"   value={data.urgency} />
          <ReviewRow label="التواصل المفضل"   value={data.preferredContact} />
        </div>
        <div className="rf-review-details-box">
          <p className="rf-review-details-label">تفاصيل الاستشارة:</p>
          <p className="rf-review-details-text">{data.consultDetails}</p>
        </div>
      </div>
      {(data.propertyType || data.governorate) && (
        <div className="rf-review-section">
          <h4 className="rf-review-heading">🏠 بيانات العقار</h4>
          <div className="rf-review-grid">
            <ReviewRow label="نوع العقار"  value={data.propertyType || "—"} />
            <ReviewRow label="المحافظة"    value={data.governorate || "—"} />
            <ReviewRow label="المنطقة"     value={data.district || "—"} />
            <ReviewRow label="العنوان"     value={data.address || "—"} />
          </div>
        </div>
      )}
      <AttachmentsReview
        groups={[
          { label: "📎 مستندات الاستشارة", files: data.docs },
        ]}
      />
      <div className="rf-review-notice">
        <span>🔒</span>
        <p>ستُعرض استشارتك على خبراء معتمدين فقط. بياناتك محمية ومشفرة بالكامل.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function RequestForm({ onClose, defaultType = null }) {
  const [formType, setFormType]   = useState(defaultType);
  const [step, setStep]           = useState(defaultType ? 2 : 1);
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [errors, setErrors]       = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const submissionLock = useRef(false);
  const submissionId = useRef("");

  const [data, setData] = useState({
    propertyType: "", governorate: "", district: "", address: "", area: "",
    loanAmount: "", duration: "", income: "", bankPref: "",
    ownerName: "", nationalId: "", phone: "", email: "",
    docs: [], titleDocs: [],
    consultTopic: "", consultDetails: "",
    urgency: "عادي", preferredContact: "هاتف",
    consultantName: "", consultantPhone: "", consultantEmail: "",
  });

  const set      = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
  const setFiles = (field, files) => setData((prev) => ({ ...prev, [field]: files }));

  const totalSteps = formType === FORM_TYPES.financing ? 5 : 4;

  const validate = () => {
    const e = {};
    if (step === 1 && !formType) e.formType = "يرجى اختيار نوع الطلب";

    if (formType === FORM_TYPES.financing) {
      if (step === 2) {
        if (!data.propertyType) e.propertyType = "يرجى اختيار نوع العقار";
        if (!data.governorate)  e.governorate  = "يرجى اختيار المحافظة";
        if (!data.address)      e.address      = "يرجى إدخال عنوان العقار";
        if (!data.area)         e.area         = "يرجى إدخال المساحة";
        if (!data.loanAmount)   e.loanAmount   = "يرجى إدخال مبلغ التمويل المطلوب";
      }
      if (step === 3 && !data.titleDocs.length && !data.docs.length)
        e.docs = "يرجى رفع مستند واحد على الأقل";
      if (step === 4) {
        if (!data.ownerName)   e.ownerName  = "يرجى إدخال الاسم";
        if (!data.nationalId || data.nationalId.length !== 14)
          e.nationalId = "الرقم القومي يجب أن يكون 14 رقماً";
        if (!data.phone) e.phone = "يرجى إدخال رقم الهاتف";
      }
    }

    if (formType === FORM_TYPES.consultation && step === 2) {
      if (!data.consultTopic)  e.consultTopic  = "يرجى اختيار موضوع الاستشارة";
      if (!data.consultDetails || data.consultDetails.length < 20)
        e.consultDetails = "يرجى وصف الاستشارة بتفصيل أكثر (20 حرف على الأقل)";
      if (!data.consultantName)  e.consultantName  = "يرجى إدخال الاسم";
      if (!data.consultantPhone) e.consultantPhone = "يرجى إدخال رقم الهاتف";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (submissionLock.current) return;
    if (!validate()) return;
    if (step < totalSteps) setStep((s) => s + 1);
    else {
      submissionLock.current = true;
      setIsSubmitting(true);
      setSubmissionError("");
      try {
        const currentRequestNumber = submissionId.current || (
          formType === FORM_TYPES.consultation
            ? createConsultationRequestNumber()
            : `${formType === FORM_TYPES.financing ? "REQ" : "CON"}-${Date.now().toString().slice(-8)}`
        );
        submissionId.current = currentRequestNumber;

        const consultationFiles = formType === FORM_TYPES.consultation ? data.docs : [];
        const invalidFile = consultationFiles.find((file) => !isValidConsultationFile(file));
        if (invalidFile) {
          setSubmissionError(`الملف "${invalidFile.name}" غير مدعوم أو يتجاوز الحد الأقصى 10 ميجا.`);
          return;
        }

        const attachments = formType === FORM_TYPES.financing
        ? [...data.docs.map((file) => fileMetadata(file, "مستند تمويل")), ...data.titleDocs.map((file) => fileMetadata(file, "مستند ملكية"))]
        : data.docs.map((file, index) => ({
          ...fileMetadata(file, "مستند استشارة"),
          fileKey: `consult-doc-${index}`,
        }));

        if (formType === FORM_TYPES.consultation && consultationFiles.length) {
          await saveWorkflowFiles(
            currentRequestNumber,
            consultationFiles.map((file, index) => ({ key: `consult-doc-${index}`, file })),
          );
        }

        saveWorkflowRequest({
          id: currentRequestNumber,
          kind: formType,
          requestNumber: currentRequestNumber,
          createdAt: new Date().toISOString(),
          status: "review",
          data: formType === FORM_TYPES.consultation ? { ...data, docs: [] } : { ...data },
          documents: attachments.filter(Boolean),
        });
        setRequestNumber(currentRequestNumber);
        setSubmitted(true);
      } catch (error) {
        console.error("Failed to save request and attachments", error);
        setSubmissionError("تعذر حفظ الطلب أو مرفقاته. تحقق من التخزين ثم حاول الإرسال مرة أخرى.");
      } finally {
        setIsSubmitting(false);
        submissionLock.current = false;
      }
    }
  };

  const back = () => {
    if (step === 1 || (step === 2 && defaultType)) { onClose(); return; }
    setErrors({});
    setStep((s) => s - 1);
  };

  const currentTitle = formType ? STEP_TITLES[formType][step - 1] : "اختر نوع الطلب";

  const renderStep = () => {
    if (!formType || step === 1)
      return <TypeStep formType={formType} setFormType={setFormType} setErrors={setErrors} errors={errors} />;

    if (formType === FORM_TYPES.financing) {
      if (step === 2) return <FinancingStep2 data={data} set={set} errors={errors} />;
      if (step === 3) return <FinancingStep3 data={data} setFiles={setFiles} errors={errors} />;
      if (step === 4) return <FinancingStep4 data={data} set={set} errors={errors} />;
      if (step === 5) return <FinancingReview data={data} />;
    }

    if (formType === FORM_TYPES.consultation) {
      if (step === 2) return <ConsultStep2 data={data} set={set} errors={errors} />;
      if (step === 3) return <ConsultStep3 data={data} set={set} setFiles={setFiles} errors={errors} />;
      if (step === 4) return <ConsultReview data={data} />;
    }
  };

  if (submitted) {
    return (
      <div className="rf-overlay" onClick={onClose}>
        <div className="rf-modal rf-success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="rf-success-icon">🎉</div>
          <h2 className="rf-success-title">تم إرسال طلبك بنجاح!</h2>
          <p className="rf-success-sub">
            {formType === FORM_TYPES.financing
              ? "سيتواصل معك فريقنا خلال 3 أيام عمل لاستكمال إجراءات طلب التمويل."
              : "سيرد عليك أحد الخبراء القانونيين المعتمدين خلال 24 ساعة."}
          </p>
          <div className="rf-success-ref">
              رقم الطلب: <strong>{requestNumber || `REQ-${Date.now().toString().slice(-8)}`}</strong>
          </div>
          <button className="btn-primary" onClick={onClose}>حسناً، شكراً</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rf-overlay" onClick={onClose}>
      <div className="rf-modal" onClick={(e) => e.stopPropagation()}>

        <div className="rf-header">
          <div>
            <div className="rf-header-tag">
              {formType === FORM_TYPES.financing
                ? "🏦 تمويل عقاري"
                : formType === FORM_TYPES.consultation
                ? "⚖️ استشارة قانونية"
                : "📝 طلب جديد"}
            </div>
            <h2 className="rf-header-title">{currentTitle}</h2>
          </div>
          <button className="rf-close-btn" onClick={onClose}>✕</button>
        </div>

        {formType && <StepIndicator step={step} formType={formType} />}

        <div className="rf-body">{renderStep()}</div>

        {submissionError && (
          <p className="rf-error-msg" role="alert">
            {submissionError}
          </p>
        )}

        <div className="rf-footer">
          <button className="rf-btn-back" onClick={back} disabled={isSubmitting}>
            {step === 1 || (step === 2 && defaultType) ? "إلغاء" : "→ السابق"}
          </button>
          <button className="btn-primary rf-btn-next" onClick={next} disabled={isSubmitting}>
            {isSubmitting ? "جارٍ حفظ الطلب..." : step === totalSteps ? "إرسال الطلب ✓" : "التالي ←"}
          </button>
        </div>

      </div>
    </div>
  );
}
