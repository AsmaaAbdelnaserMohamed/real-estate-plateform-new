import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import { getCurrentUser, setAuthenticated } from "../../utils/auth";
import { getUsers, updateUser } from "../../utils/localStorage";
import "./UserProfile.css";

const eligibilityFields = [
  { key: "fullName", label: "الاسم بالكامل", type: "text" },
  { key: "birthDate", label: "تاريخ الميلاد", type: "date" },
  { key: "phone", label: "رقم الهاتف", type: "tel" },
  { key: "gender", label: "النوع", options: ["ذكر", "أنثى"] },
  { key: "identityType", label: "إثبات الهوية", options: ["رقم قومي", "جواز السفر"] },
  { key: "nationalId", label: "رقم الهوية", type: "text" },
  { key: "occupation", label: "المهنة المثبتة", type: "text" },
  { key: "maritalStatus", label: "الحالة الاجتماعية", options: ["أعزب", "متزوج", "مطلق", "أرمل"] },
  { key: "dependents", label: "عدد المعالين", type: "number" },
  { key: "employmentType", label: "نوع العمل", options: ["قطاع خاص", "قطاع حكومي", "أعمال حرة", "متقاعد", "بدون عمل"] },
  { key: "employer", label: "اسم جهة العمل", type: "text" },
  { key: "jobTitle", label: "المسمى الوظيفي", type: "text" },
  { key: "contractType", label: "نوع عقد العمل", options: ["عقد عمل بدوام كامل", "عقد عمل بدوام جزئي", "عمل حر", "أخرى"] },
  { key: "workDuration", label: "مدة العمل أو النشاط", options: ["أقل من سنة", "من سنة إلى 3 سنوات", "أكثر من 3 سنوات"] },
  { key: "monthlyIncome", label: "الدخل الشهري", type: "number" },
  { key: "salaryTransferred", label: "هل يتم تحويل الراتب إلى البنك؟", options: ["نعم", "لا"] },
  { key: "otherIncome", label: "هل توجد مصادر دخل أخرى؟", options: ["نعم", "لا"] },
  { key: "loanInstallments", label: "إجمالي الأقساط الشهرية الحالية للقروض", type: "number" },
  { key: "otherCommitments", label: "التزامات شهرية أخرى", type: "number" },
  { key: "governorate", label: "المحافظة", options: ["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "المنوفية"] },
  { key: "area", label: "المدينة / المنطقة", type: "text" },
  { key: "address", label: "العنوان بالتفصيل", type: "text" },
  { key: "housingType", label: "نوع السكن الحالي", options: ["تمليك", "إيجار", "سكن عائلي", "أخرى"] },
  { key: "residenceDuration", label: "مدة الإقامة", options: ["أقل من سنة", "أكثر من سنة", "أكثر من 5 سنوات"] },
];

const registrationFields = {
  أفراد: [
    { key: "firstName", label: "الاسم الأول", type: "text", required: true },
    { key: "lastName", label: "الاسم الأخير", type: "text", required: true },
    { key: "nationalId", label: "الرقم القومي", type: "text", required: true },
    { key: "phone", label: "رقم الهاتف", type: "tel", required: true },
    { key: "email", label: "البريد الإلكتروني", type: "email", required: true },
    { key: "username", label: "اسم المستخدم", type: "text", required: true },
  ],
  شركات: [
    { key: "companyName", label: "اسم الشركة", type: "text", required: true },
    { key: "commercialReg", label: "رقم السجل التجاري", type: "text", required: true },
    { key: "taxNumber", label: "الرقم الضريبي", type: "text", required: true },
    { key: "activity", label: "نشاط الشركة", options: ["تطوير عقاري", "وساطة عقارية", "إدارة أملاك", "مقاولات", "استشارات عقارية"], required: true },
    { key: "companyPhone", label: "هاتف الشركة", type: "tel", required: true },
    { key: "companyEmail", label: "البريد الرسمي", type: "email", required: true },
    { key: "managerName", label: "اسم المسؤول", type: "text", required: true },
    { key: "jobTitle", label: "المسمى الوظيفي", type: "text", required: true },
    { key: "username", label: "اسم المستخدم", type: "text", required: true },
  ],
  بنوك: [
    { key: "bankName", label: "اسم البنك", type: "text", required: true },
    { key: "bankCode", label: "كود البنك", type: "text", required: true },
    { key: "bankType", label: "نوع البنك", options: ["بنك حكومي", "بنك خاص", "بنك إسلامي", "بنك أجنبي"], required: true },
    { key: "cbeNumber", label: "رقم ترخيص البنك المركزي", type: "text", required: true },
    { key: "bankPhone", label: "هاتف البنك", type: "tel", required: true },
    { key: "bankEmail", label: "البريد الرسمي", type: "email", required: true },
    { key: "managerName", label: "اسم المسؤول", type: "text", required: true },
    { key: "role", label: "الصلاحية", options: ["مدير النظام", "مشرف", "مستخدم عادي"], required: true },
    { key: "username", label: "اسم المستخدم", type: "text", required: true },
  ],
};

const eligibilityDefaults = Object.fromEntries(eligibilityFields.map(({ key }) => [key, ""]));

function ProfileField({ field, value, onChange }) {
  return (
    <label className="profile-field">
      <span>{field.label}</span>
      {field.options ? (
        <select name={field.key} value={value || ""} onChange={onChange} required={field.required}>
          <option value="">اختر...</option>
          {field.options.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      ) : (
        <input
          name={field.key}
          type={field.type || "text"}
          value={value || ""}
          onChange={onChange}
          required={field.required}
        />
      )}
    </label>
  );
}

function getInitialEligibility(user) {
  const initial = { ...eligibilityDefaults, ...user.eligibilityProfile };
  if (!initial.fullName) {
    initial.fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  if (!initial.phone) initial.phone = user.phone || user.companyPhone || user.bankPhone || "";
  if (!initial.nationalId) initial.nationalId = user.nationalId || "";
  return initial;
}

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [formData, setFormData] = useState(() => {
    const user = getCurrentUser();
    return user ? { ...user, eligibilityProfile: getInitialEligibility(user) } : {};
  });
  const [profileImage, setProfileImage] = useState(() => getCurrentUser()?.profileImage || "");
  const [error, setError] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const updateRegistrationField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      const eligibilityProfile = { ...current.eligibilityProfile };
      if (name === "phone" || name === "companyPhone" || name === "bankPhone") eligibilityProfile.phone = value;
      if (name === "nationalId") eligibilityProfile.nationalId = value;
      if (name === "firstName" || name === "lastName") {
        const firstName = name === "firstName" ? value : current.firstName || "";
        const lastName = name === "lastName" ? value : current.lastName || "";
        eligibilityProfile.fullName = `${firstName} ${lastName}`.trim();
      }
      return { ...current, [name]: value, eligibilityProfile };
    });
  };

  const updateEligibilityField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      eligibilityProfile: { ...current.eligibilityProfile, [name]: value },
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة صالح.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.");
      return;
    }

    setError("");
    setSavingImage(true);
    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      setProfileImage(canvas.toDataURL("image/jpeg", 0.82));
    } catch {
      setError("تعذر معالجة الصورة. يرجى اختيار صورة أخرى.");
    } finally {
      setSavingImage(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    const originalUsername = currentUser?.username || "";
    const nextUser = {
      ...currentUser,
      ...Object.fromEntries((registrationFields[currentUser?.type] || []).map(({ key }) => [key, formData[key] || ""])),
      eligibilityProfile: formData.eligibilityProfile,
      profileImage,
    };
    if (newPassword && newPassword.length < 4) {
      setError("كلمة المرور الجديدة يجب ألا تقل عن 4 أحرف.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("تأكيد كلمة المرور غير مطابق.");
      return;
    }
    if (newPassword) nextUser.password = newPassword;

    const users = getUsers();
    const isCurrentAccount = (user) => currentUser?.id
      ? user.id === currentUser.id
      : user.username?.trim().toLocaleLowerCase() === originalUsername.trim().toLocaleLowerCase();
    const duplicateUsername = users.some((user) =>
      !isCurrentAccount(user) && user.username?.trim().toLocaleLowerCase() === nextUser.username?.trim().toLocaleLowerCase()
    );
    if (duplicateUsername) {
      setError("اسم المستخدم مستخدم بالفعل.");
      return;
    }

    const emailKey = nextUser.email ? "email" : nextUser.companyEmail ? "companyEmail" : "bankEmail";
    const email = nextUser[emailKey];
    const duplicateEmail = email && users.some((user) =>
      !isCurrentAccount(user) && [user.email, user.companyEmail, user.bankEmail]
        .some((savedEmail) => savedEmail?.trim().toLocaleLowerCase() === email.trim().toLocaleLowerCase())
    );
    if (duplicateEmail) {
      setError("البريد الإلكتروني مستخدم بالفعل.");
      return;
    }

    try {
      updateUser(nextUser, originalUsername);
      setAuthenticated(nextUser);
      setCurrentUser(nextUser);
      setFormData({ ...nextUser, eligibilityProfile: { ...eligibilityDefaults, ...nextUser.eligibilityProfile } });
      setNewPassword("");
      setConfirmPassword("");
      window.alert("تم حفظ بيانات الملف الشخصي بنجاح.");
      navigate("/");
    } catch {
      setError("تعذر حفظ التغييرات. يرجى التأكد من وجود مساحة تخزين كافية والمحاولة مرة أخرى.");
    }
  };

  if (!currentUser) return null;

  const fields = registrationFields[currentUser.type] || [];
  const fullName = currentUser.type === "أفراد"
    ? `${formData.firstName || ""} ${formData.lastName || ""}`.trim()
    : formData.companyName || formData.bankName || formData.username;

  return (
    <div className="user-profile-page" dir="rtl">
      <Navbar />
      <main className="profile-shell">
        <header className="profile-heading">
          <div>
            <span className="profile-kicker">حسابك الشخصي</span>
            <h1>الملف الشخصي</h1>
            <p>حدّث بيانات حسابك وبيانات طلب التحقق من الأهلية في أي وقت.</p>
          </div>
          <button type="button" className="profile-back" onClick={() => navigate(-1)}>العودة</button>
        </header>

        <form className="profile-card" onSubmit={handleSubmit}>
          <section className="profile-identity">
            <div className="profile-photo-wrap">
              {profileImage ? <img className="profile-photo" src={profileImage} alt="الصورة الشخصية" /> : (
                <span className="profile-photo-placeholder" aria-hidden="true">{fullName?.charAt(0) || "م"}</span>
              )}
              <label className="profile-photo-button">
                {savingImage ? "جارٍ تجهيز الصورة..." : "تغيير الصورة"}
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={savingImage} />
              </label>
              {profileImage && (
                <button type="button" className="profile-photo-remove" onClick={() => setProfileImage("")}>
                  إزالة الصورة
                </button>
              )}
            </div>
            <div className="profile-identity-copy">
              <strong>{fullName || currentUser.username}</strong>
              <span>{currentUser.type}</span>
              <small>الصورة ستظهر في حسابك وفي أيقونة شريط التنقل.</small>
            </div>
          </section>

          {error && <div className="profile-alert" role="alert">{error}</div>}
          <section className="profile-section">
            <div className="profile-section-heading">
              <h2>بيانات التسجيل</h2>
              <p>البيانات الأساسية المسجلة عند إنشاء الحساب.</p>
            </div>
            <div className="profile-fields-grid">
              {fields.map((field) => (
                <ProfileField key={field.key} field={field} value={formData[field.key]} onChange={updateRegistrationField} />
              ))}
              <label className="profile-field">
                <span>كلمة مرور جديدة (اختياري)</span>
                <input type="password" autoComplete="new-password" minLength={4} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <label className="profile-field">
                <span>تأكيد كلمة المرور الجديدة</span>
                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </label>
            </div>
          </section>

          {/* <section className="profile-section">
            <div className="profile-section-heading">
              <h2>بيانات التحقق من الأهلية</h2>
              <p>احفظ بياناتك هنا لتكون جاهزة عند تقديم طلب التحقق من الأهلية.</p>
            </div>
            <div className="profile-fields-grid">
              {eligibilityFields.map((field) => (
                <ProfileField
                  key={field.key}
                  field={field}
                  value={formData.eligibilityProfile?.[field.key]}
                  onChange={updateEligibilityField}
                />
              ))}
            </div>
            <p className="profile-privacy-note">لن يتم إرسال هذه البيانات ضمن طلب إلا عند تقديمك الطلب بنفسك.</p>
          </section> */}

          <footer className="profile-actions">
            <button type="submit" className="profile-save-button">حفظ التغييرات</button>
          </footer>
        </form>
      </main>
    </div>
  );
}
