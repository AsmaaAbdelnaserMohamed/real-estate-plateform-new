import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "../../components/Brand/Brand";
import { setAuthenticated } from "../../utils/auth";
import { authenticateUser } from "../../utils/localStorage";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const vantaRef = useRef(null);
  const effectRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.VANTA) {
      effectRef.current = window.VANTA.WAVES({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: 0x0d1c2d,
        backgroundColor: 0x071725,
        shininess: 28,
        waveHeight: 12,
        waveSpeed: 0.38,
        zoom: 0.85,
      });
    }

    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
      }
    };
  }, []);

  const handleLogin = () => {
    if (!username || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    const user = authenticateUser(username, password);
    if (user) {
      setAuthenticated(user);
      const from = location.state?.from;
      const destination = from ? `${from.pathname || "/"}${from.search || ""}${from.hash || ""}` : "/";
      navigate(destination, { replace: true });
    } else {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <main className="login-page" ref={vantaRef}>
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-content">
          <div
            className="login-card-image"
            role="img"
            aria-label="منزل عصري ضمن منصة الخدمات العقارية"
          >
            <span>منصة العقارات والتمويل</span>
          </div>

          <div className="logo-section">
            <h1 className="login-brand-heading">
              <Brand className="login-brand-lockup" />
            </h1>

            <h2 className="login-heading" id="login-heading">
              أهلًا بعودتك
            </h2>
            <p className="login-intro">
              سجّل الدخول لمتابعة خدماتك العقارية بكل سهولة.
            </p>
          </div>

          <form
            className="login-form"
            aria-describedby={error ? "login-error" : undefined}
            onSubmit={(event) => {
              event.preventDefault();
              handleLogin();
            }}
          >
            <div className="input-group">
              <label htmlFor="username">اسم المستخدم</label>
              <input
                type="text"
                id="username"
                placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                aria-invalid={Boolean(error)}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">كلمة المرور</label>
              <div className="login-input-wrap">
                <input
                  className="login-password-input"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  required
                />
                <button
                  className="password-visibility"
                  type="button"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </div>

            <div className="form-options">
              <a href="#" className="forgot-password">
                نسيت كلمة المرور؟
              </a>
            </div>

            {error && (
              <p className="login-error" id="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-btn">
              تسجيل الدخول
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M19 12H5m6-6-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <div className="login-register">
            <p>
              ليس لديك حساب؟{" "}
              <Link className="register-link" to="/register">
                سجل مستخدم جديد
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
