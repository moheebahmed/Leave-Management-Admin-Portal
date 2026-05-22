import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../api/config";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data.data;

      if (user.role !== "HR") {
        setError("Access denied. Only HR accounts can login to this portal.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isAuthenticated", "true");

      window.dispatchEvent(new Event("auth-change"));

      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || "Server error. Please try again.";
      setError(message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Logo/Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 app-bg items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-4 mb-5">
            <div className="w-20 h-18 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <a href="#"><img src="/logo.png" className="w-full h-full object-contain" /></a>
            </div>
            <div className="text-left">
              <div className="font-syne font-bold text-4xl text-white leading-tight mb-1">
                <a href="#">RecallHRM</a>
              </div>
              <div className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                Remember Talent. Retain Excellence.
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-lg max-w-md mx-auto">
            RecallHRM is an intelligent HR management system designed to help organizations track,
            nurture, and retain their most valuable asset people.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-side w-full lg:w-1/2 flex items-center justify-center p-8 bg-base">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-15 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <div className="font-syne font-bold text-2xl text-white leading-tight">
                  RecallHRM
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  HR Suite
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="login-welcome mb-8 ">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="font-syne text-4xl font-bold text-white">Welcome </h1>
            </div>

            <p className="text-slate-300 text-sm uppercase tracking-wider">  Please login to Admin Dashboard  </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="form-input-base"
                disabled={loading}
              />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="form-input-base pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ color: "#ffffff", fontWeight: 700 }}
              className={`btn-primary w-full justify-center py-3 text-base disabled:cursor-not-allowed ${loading ? "bg-accent/60 hover:bg-accent/60 shadow-none" : ""}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                className="forgot-btn text-sm text-slate-400 hover:text-slate-300 transition-colors uppercase tracking-wider"
              >
                Forgotten Your Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
