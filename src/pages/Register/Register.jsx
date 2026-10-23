import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthenticated } from "../../utils/auth";
import { saveUser, findUserByUsername, findUserByEmail } from "../../utils/localStorage";
import "./Register.css";

// ─── Validation Functions ─────────────────────────────────────────────────────
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateNationalId(id) {
  // Egyptian National ID should be 14 digits (relaxed for demo)
  if (!id) return false;
  const idRegex = /^[0-9]{10,14}$/;
  return idRegex.test(id);
}

function validatePhone(phone) {
  // Egyptian phone numbers (relaxed for demo)
  if (!phone) return false;
  const phoneRegex = /^01[0-9]{9}$/;
  return phoneRegex.test(phone);
}

function validatePassword(password) {
  // At least 4 characters (relaxed for demo)
  return password && password.length >= 4;
}

// ─── Field config per account type ───────────────────────────────────────────

const AFRAD_FIELDS = {
  personal: {
    title: "البيانات الشخصية",
    rows: [
      [
        {
          id: "firstName",
          label: "الاسم الأول",
          type: "text",
          placeholder: "محمد",
        },
        {
          id: "lastName",
          label: "الاسم الأخير",
          type: "text",
          placeholder: "أحمد",
        },
      ],
      [
        {
          id: "nationalId",
          label: "الرقم القومي",
          type: "text",
          placeholder: "2XXXXXXXXXXXXXXX",
          full: true,
        },
      ],
      [
        {
          id: "phone",
          label: "رقم الهاتف",
          type: "text",
          placeholder: "01XXXXXXXXX",
        },
        {
          id: "email",
          label: "البريد الإلكتروني",
          type: "email",
          placeholder: "example@email.com",
        },
      ],
    ],
  },
  account: {
    title: "بيانات الحساب",
    rows: [
      [
        {
          id: "username",
          label: "اسم المستخدم",
          type: "text",
          placeholder: "username",
          full: true,
        },
      ],
      [
        {
          id: "password",
          label: "كلمة المرور",
          type: "password",
          placeholder: "••••••••",
        },
        {
          id: "confirmPassword",
          label: "تأكيد كلمة المرور",
          type: "password",
          placeholder: "••••••••",
        },
      ],
    ],
  },
};

const SHARIKAT_FIELDS = {
  company: {
    title: "بيانات الشركة",
    rows: [
      [
        {
          id: "companyName",
          label: "اسم الشركة",
          type: "text",
          placeholder: "اسم الشركة الرسمي",
          full: true,
        },
      ],
      [
        {
          id: "commercialReg",
          label: "رقم السجل التجاري",
          type: "text",
          placeholder: "XXXXXXXXXX",
        },
        {
          id: "taxNumber",
          label: "الرقم الضريبي",
          type: "text",
          placeholder: "XXXXXXXXX",
        },
      ],
      [
        {
          id: "activity",
          label: "نشاط الشركة",
          type: "select",
          full: true,
          options: [
            "تطوير عقاري",
            "وساطة عقارية",
            "إدارة أملاك",
            "مقاولات",
            "استشارات عقارية",
          ],
        },
      ],
      [
        {
          id: "companyPhone",
          label: "هاتف الشركة",
          type: "text",
          placeholder: "0XXXXXXXXXXX",
        },
        {
          id: "companyEmail",
          label: "البريد الرسمي",
          type: "email",
          placeholder: "info@company.com",
        },
      ],
    ],
  },
  manager: {
    title: "بيانات المسؤول",
    rows: [
      [
        {
          id: "managerName",
          label: "اسم المسؤول",
          type: "text",
          placeholder: "الاسم الكامل",
        },
        {
          id: "jobTitle",
          label: "المسمى الوظيفي",
          type: "text",
          placeholder: "مدير",
        },
      ],
      [
        {
          id: "password",
          label: "كلمة المرور",
          type: "password",
          placeholder: "••••••••",
        },
        {
          id: "confirmPassword",
          label: "تأكيد كلمة المرور",
          type: "password",
          placeholder: "••••••••",
        },
      ],
    ],
  },
};

const BUNUK_FIELDS = {
  bank: {
    title: "بيانات البنك",
    rows: [
      [
        {
          id: "bankName",
          label: "اسم البنك",
          type: "text",
          placeholder: "اسم البنك الرسمي",
          full: true,
        },
      ],
      [
        {
          id: "bankCode",
          label: "كود البنك",
          type: "text",
          placeholder: "XXX",
        },
        {
          id: "bankType",
          label: "نوع البنك",
          type: "select",
          options: ["بنك حكومي", "بنك خاص", "بنك إسلامي", "بنك أجنبي"],
        },
      ],
      [
        {
          id: "cbeNumber",
          label: "رقم ترخيص البنك المركزي",
          type: "text",
          placeholder: "CBE-XXXXXXXXX",
          full: true,
        },
      ],
      [
        {
          id: "bankPhone",
          label: "هاتف البنك",
          type: "text",
          placeholder: "0XXXXXXXXXXX",
        },
        {
          id: "bankEmail",
          label: "البريد الرسمي",
          type: "email",
          placeholder: "info@bank.com",
        },
      ],
    ],
  },
  manager: {
    title: "بيانات المسؤول",
    rows: [
      [
        {
          id: "managerName",
          label: "اسم المسؤول",
          type: "text",
          placeholder: "الاسم الكامل",
          full: true,
        },
      ],
      [
        {
          id: "role",
          label: "الصلاحية",
          type: "select",
          full: true,
          options: ["مدير النظام", "مشرف", "مستخدم عادي"],
        },
      ],
      [
        {
          id: "password",
          label: "كلمة المرور",
          type: "password",
          placeholder: "••••••••",
        },
        {
          id: "confirmPassword",
          label: "تأكيد كلمة المرور",
          type: "password",
          placeholder: "••••••••",
        },
      ],
    ],
  },
};

const TYPE_CONFIG = {
  افراد: {
    icon: "👤",
    title: "بيانات الأفراد",
    sub: "أدخل بياناتك الشخصية",
    fields: AFRAD_FIELDS,
  },
  شركات: {
    icon: "🏢",
    title: "بيانات الشركة",
    sub: "أدخل بيانات شركتك الرسمية",
    fields: SHARIKAT_FIELDS,
  },
  بنوك: {
    icon: "🏦",
    title: "بيانات البنك",
    sub: "أدخل بيانات البنك الرسمية",
    fields: BUNUK_FIELDS,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepDots({ step }) {
  return (
    <div className="step-dots">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`step-dot ${step >= n ? "active" : ""}`} />
      ))}
    </div>
  );
}

function FieldInput({ field, value, onChange, error }) {
  if (field.type === "select") {
    return (
      <div className="input-group">
        <label htmlFor={field.id}>{field.label}</label>
        <select
          id={field.id}
          value={value || ""}
          onChange={(e) => onChange(field.id, e.target.value)}
        >
          <option value="">اختر...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  }
  return (
    <div className="input-group">
      <label htmlFor={field.id}>{field.label}</label>
      <input
        id={field.id}
        type={field.type}
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onChange(field.id, e.target.value)}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

function FieldsSection({ sections, formData, onChange, errors }) {
  return (
    <>
      {Object.entries(sections).map(([key, section], si) => (
        <div key={key}>
          {si > 0 && <hr className="form-divider" />}
          <p className="section-title">{section.title}</p>
          {section.rows.map((row, ri) => {
            if (row.length === 1 || row[0].full) {
              return (
                <FieldInput
                  key={ri}
                  field={row[0]}
                  value={formData[row[0].id]}
                  onChange={onChange}
                  error={errors?.[row[0].id]}
                />
              );
            }
            return (
              <div key={ri} className="fields-row">
                {row.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={onChange}
                    error={errors?.[field.id]}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Register() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const vantaRef = useRef(null);
  const effectRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.VANTA) {
      effectRef.current = window.VANTA.WAVES({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x2a40,
        shininess: 33.0,
        waveHeight: 21.0,
        waveSpeed: 0.4,
      });
    }
    return () => {
      if (effectRef.current) effectRef.current.destroy();
    };
  }, []);
  // const handleBackToLogin = () => {
  //   navigate("/");
  // };
  const handleFieldChange = (id, value) => {
    console.log("Field changed:", id, value);
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({});
    setErrors({});
  };

  const handleNext = () => {
    if (!selectedType) {
      alert("يرجى اختيار نوع الحساب");
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted", { selectedType, formData, errors });

    const newErrors = {};

    // Normalize selectedType to handle both with and without ألف
    const normalizedType = selectedType === "افراد" ? "أفراد" : selectedType;

    // Validation based on account type
    if (normalizedType === "أفراد") {
      const { firstName, lastName, nationalId, phone, email, username, password, confirmPassword } = formData;

      console.log("Validating individual form:", { firstName, lastName, nationalId, phone, email, username, password, confirmPassword });

      if (!firstName) newErrors.firstName = "يرجى إدخال الاسم الأول";
      if (!lastName) newErrors.lastName = "يرجى إدخال الاسم الأخير";
      if (!nationalId) {
        newErrors.nationalId = "يرجى إدخال الرقم القومي";
      } else if (!validateNationalId(nationalId)) {
        newErrors.nationalId = "الرقم القومي يجب أن يكون 10-14 رقم";
      }
      if (!phone) {
        newErrors.phone = "يرجى إدخال رقم الهاتف";
      } else if (!validatePhone(phone)) {
        newErrors.phone = "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم";
      }
      if (!email) {
        newErrors.email = "يرجى إدخال البريد الإلكتروني";
      } else if (!validateEmail(email)) {
        newErrors.email = "البريد الإلكتروني غير صحيح";
      }
      if (!username) newErrors.username = "يرجى إدخال اسم المستخدم";
      if (!password) {
        newErrors.password = "يرجى إدخال كلمة المرور";
      } else if (!validatePassword(password)) {
        newErrors.password = "كلمة المرور يجب أن تكون 4 أحرف على الأقل";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "يرجى تأكيد كلمة المرور";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "كلمة المرور غير متطابقة";
      }

      if (Object.keys(newErrors).length > 0) {
        console.log("Validation errors:", newErrors);
        setErrors(newErrors);
        return;
      }

      // Check if username already exists
      if (findUserByUsername(username)) {
        newErrors.username = "اسم المستخدم موجود بالفعل";
        setErrors(newErrors);
        return;
      }

      // Check if email already exists
      if (findUserByEmail(email)) {
        newErrors.email = "البريد الإلكتروني مستخدم بالفعل";
        setErrors(newErrors);
        return;
      }

      // Save user
      const user = {
        id: Date.now().toString(),
        type: "أفراد",
        firstName,
        lastName,
        nationalId,
        phone,
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
      };

      saveUser(user);
      clearAuthenticated();
      setStep(3);

    } else if (normalizedType === "شركات") {
      const { companyName, commercialReg, taxNumber, activity, companyPhone, companyEmail, managerName, jobTitle, password, confirmPassword } = formData;

      if (!companyName) newErrors.companyName = "يرجى إدخال اسم الشركة";
      if (!commercialReg) newErrors.commercialReg = "يرجى إدخال السجل التجاري";
      if (!taxNumber) newErrors.taxNumber = "يرجى إدخال الرقم الضريبي";
      if (!activity) newErrors.activity = "يرجى اختيار نشاط الشركة";
      if (!companyPhone) {
        newErrors.companyPhone = "يرجى إدخال هاتف الشركة";
      } else if (!validatePhone(companyPhone)) {
        newErrors.companyPhone = "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم";
      }
      if (!companyEmail) {
        newErrors.companyEmail = "يرجى إدخال البريد الرسمي";
      } else if (!validateEmail(companyEmail)) {
        newErrors.companyEmail = "البريد الإلكتروني غير صحيح";
      }
      if (!managerName) newErrors.managerName = "يرجى إدخال اسم المسؤول";
      if (!jobTitle) newErrors.jobTitle = "يرجى إدخال المسمى الوظيفي";
      if (!password) {
        newErrors.password = "يرجى إدخال كلمة المرور";
      } else if (!validatePassword(password)) {
        newErrors.password = "كلمة المرور يجب أن تكون 4 أحرف على الأقل";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "يرجى تأكيد كلمة المرور";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "كلمة المرور غير متطابقة";
      }

      if (Object.keys(newErrors).length > 0) {
        console.log("Validation errors:", newErrors);
        setErrors(newErrors);
        return;
      }

      // Use company name as username
      const username = companyName;

      // Check if username already exists
      if (findUserByUsername(username)) {
        newErrors.companyName = "اسم الشركة موجود بالفعل";
        setErrors(newErrors);
        return;
      }

      // Save user
      const user = {
        id: Date.now().toString(),
        type: "شركات",
        companyName,
        commercialReg,
        taxNumber,
        activity,
        companyPhone,
        companyEmail,
        managerName,
        jobTitle,
        username,
        password,
        createdAt: new Date().toISOString(),
      };

      saveUser(user);
      clearAuthenticated();
      setStep(3);

    } else if (normalizedType === "بنوك") {
      const { bankName, bankCode, bankType, cbeNumber, bankPhone, bankEmail, managerName, role, password, confirmPassword } = formData;

      if (!bankName) newErrors.bankName = "يرجى إدخال اسم البنك";
      if (!bankCode) newErrors.bankCode = "يرجى إدخال كود البنك";
      if (!bankType) newErrors.bankType = "يرجى اختيار نوع البنك";
      if (!cbeNumber) newErrors.cbeNumber = "يرجى إدخال رقم ترخيص البنك المركزي";
      if (!bankPhone) {
        newErrors.bankPhone = "يرجى إدخال هاتف البنك";
      } else if (!validatePhone(bankPhone)) {
        newErrors.bankPhone = "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقم";
      }
      if (!bankEmail) {
        newErrors.bankEmail = "يرجى إدخال البريد الرسمي";
      } else if (!validateEmail(bankEmail)) {
        newErrors.bankEmail = "البريد الإلكتروني غير صحيح";
      }
      if (!managerName) newErrors.managerName = "يرجى إدخال اسم المسؤول";
      if (!role) newErrors.role = "يرجى اختيار الصلاحية";
      if (!password) {
        newErrors.password = "يرجى إدخال كلمة المرور";
      } else if (!validatePassword(password)) {
        newErrors.password = "كلمة المرور يجب أن تكون 4 أحرف على الأقل";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "يرجى تأكيد كلمة المرور";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "كلمة المرور غير متطابقة";
      }

      if (Object.keys(newErrors).length > 0) {
        console.log("Validation errors:", newErrors);
        setErrors(newErrors);
        return;
      }

      // Use bank name as username
      const username = bankName;

      // Check if username already exists
      if (findUserByUsername(username)) {
        newErrors.bankName = "اسم البنك موجود بالفعل";
        setErrors(newErrors);
        return;
      }

      // Save user
      const user = {
        id: Date.now().toString(),
        type: "بنوك",
        bankName,
        bankCode,
        bankType,
        cbeNumber,
        bankPhone,
        bankEmail,
        managerName,
        role,
        username,
        password,
        createdAt: new Date().toISOString(),
      };

      saveUser(user);
      clearAuthenticated();
      setStep(3);
    }
  };

  const handleBackToType = () => {
    setStep(1);
  };

  const config = selectedType ? TYPE_CONFIG[selectedType] : null;
  return (
    <div className="register-page" ref={vantaRef}>
      <div className="register-container">
        <div className="register-card">
          <StepDots step={step} />

          {/* ── Step 1: Choose type ── */}
          {step === 1 && (
            <>
              <div className="step-header">
                <h2>إنشاء حساب جديد</h2>
                <p>اختر نوع الحساب للمتابعة</p>
              </div>

              <span className="type-label">نوع المستخدم</span>
              <div className="type-grid">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                  <button
                    key={type}
                    className={`type-btn ${selectedType === type ? "active" : ""}`}
                    onClick={() => handleTypeSelect(type)}
                  >
                    <span className="type-icon">{cfg.icon}</span>
                    {type}
                  </button>
                ))}
              </div>

              <button className="register-btn" onClick={handleNext}>
                التالي ←
              </button>

              <div className="login-redirect">
                <p>
                  لديك حساب بالفعل؟{" "}
                  <button
                    type="button"
                    className="back-link"
                    onClick={() => navigate("/login")}
                  >
                    تسجيل الدخول
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── Step 2: Fill form ── */}
          {step === 2 && config && (
            <>
              <div className="step-header">
                <h2>{config.title}</h2>
                <p>{config.sub}</p>
              </div>

              <form className="reg-form" onSubmit={handleSubmit}>
                <div className="fields-scroll">
                  <FieldsSection
                    sections={config.fields}
                    formData={formData}
                    onChange={handleFieldChange}
                    errors={errors}
                  />
                </div>

                <button type="submit" className="register-btn">
                  تسجيل الحساب ←
                </button>
              </form>

              <div className="back-section">
                <button className="back-link" onClick={handleBackToType}>
                  → العودة لاختيار نوع الحساب
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2>تم التسجيل بنجاح!</h2>
              <p>
                تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.
                <br />
                سيتم مراجعة بياناتك خلال 24 ساعة.
              </p>

              <button
                type="button"
                className="register-btn"
                onClick={() => navigate("/login")}
              >
                الذهاب لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
