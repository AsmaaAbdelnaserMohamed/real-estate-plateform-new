import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import edgeProLogo from "../../assets/edge_prologo.png";
import bankMarkzyLogo from "../../assets/bank_markzy.png";
import { setAuthenticated } from "../../utils/auth";
import { authenticateUser } from "../../utils/localStorage";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      if (effectRef.current) {
        effectRef.current.destroy();
      }
    };
  }, []);

  const handleLogin = () => {
    if (!username || !password) {
      alert("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    const user = authenticateUser(username, password);
    if (user) {
      setAuthenticated(user);
      const from = location.state?.from;
      const destination = from ? `${from.pathname || "/"}${from.search || ""}${from.hash || ""}` : "/";
      navigate(destination, { replace: true });
    } else {
      alert("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="login-page" ref={vantaRef}>
      <div className="login-container">
        <div className="login-card">
          <div className="logo-section">
            <div className="logoImages">
              <div className="edge-logo">
                <img src={edgeProLogo} alt="Edge Pro Logo" />
              </div>
              <div className="bank-markzylogo">
                <img src={bankMarkzyLogo} alt="Real Estate Platform Logo" />
              </div>
            </div>

            <div className="logoTitle">
              <h1>Real Estate Platform</h1>
            </div>

            <p className="subtitle">
              المنصة الموحدة للخدمات العقارية في جمهورية مصر العربية
            </p>
          </div>

          <form
            className="login-form"
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
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">كلمة المرور</label>
              <input
                type="password"
                id="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <a href="#" className="forgot-password">
                نسيت كلمة المرور؟
              </a>
            </div>

            <button type="submit" className="login-btn">
              تسجيل الدخول
            </button>
          </form>

          <div className="register-section">
            <p>
              ليس لديك حساب؟{" "}
              <Link className="register-link" to="/register">
                سجل مستخدم جديد
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
