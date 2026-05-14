import { useState, useEffect } from "react";
import { Save, Calendar, Loader } from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { useApp } from "../layouts/DashboardLayout";

const PayrollSettings = () => {
  const { showToast } = useApp();
  const [settings, setSettings] = useState({
    payroll_start_day: 1,
    payroll_end_day: 30,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load settings from API on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setFetching(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/settings/payroll`, {
        headers,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSettings({
            payroll_start_day: json.data.payroll_start_day || 1,
            payroll_end_day: json.data.payroll_end_day || 30,
          });
        }
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem("payroll_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({
            payroll_start_day: parsed.payroll_start_day || 1,
            payroll_end_day: parsed.payroll_end_day || 30,
          });
        }
      }
    } catch (err) {
      console.error("Load settings error:", err);
      // Fallback to localStorage
      const saved = localStorage.getItem("payroll_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          payroll_start_day: parsed.payroll_start_day || 1,
          payroll_end_day: parsed.payroll_end_day || 30,
        });
      }
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: parseInt(value),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      // Save to API
      const res = await fetch(`${API_BASE_URL}/settings/payroll`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_start_day: settings.payroll_start_day,
          payroll_end_day: settings.payroll_end_day,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Also save to localStorage as backup
          localStorage.setItem("payroll_settings", JSON.stringify(settings));
          setSaved(true);
          showToast("Payroll settings saved successfully", "success");
          setTimeout(() => setSaved(false), 3000);
        } else {
          showToast(json.message || "Failed to save settings", "error");
        }
      } else {
        // Fallback: save to localStorage only
        localStorage.setItem("payroll_settings", JSON.stringify(settings));
        setSaved(true);
        showToast("Settings saved locally (API unavailable)", "info");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
      // Fallback: save to localStorage
      localStorage.setItem("payroll_settings", JSON.stringify(settings));
      setSaved(true);
      showToast("Settings saved locally", "info");
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">Payroll</span>{" "}
          <span className="text-white font-bold">Settings</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Configure payroll period and generation parameters
        </p>
      </div>

      {/* Loading State */}
      {fetching ? (
        <div className="card-base flex items-center justify-center py-12">
          <Loader size={20} className="text-accent animate-spin mr-2" />
          <span className="text-slate-400">Loading settings...</span>
        </div>
      ) : (
        <>
          {/* Settings Card */}
          <div className="card-base space-y-6 p-6">
            {/* Payroll Period */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Calendar size={16} className="text-accent" />
                Payroll Period
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Start Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.payroll_start_day}
                    onChange={(e) =>
                      handleChange("payroll_start_day", e.target.value)
                    }
                    className="form-input-base"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Payroll period starts on day {settings.payroll_start_day}
                  </p>
                </div>

                {/* End Day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    End Day of Month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settings.payroll_end_day}
                    onChange={(e) =>
                      handleChange("payroll_end_day", e.target.value)
                    }
                    className="form-input-base"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Payroll period ends on day {settings.payroll_end_day}
                  </p>
                </div>
              </div>

              {/* Period Preview */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Current Period:</p>
                <p className="text-sm font-semibold text-slate-200">
                  Day {settings.payroll_start_day} to Day{" "}
                  {settings.payroll_end_day} of each month
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
              <button
                onClick={handleSave}
                disabled={loading || saved}
                className="btn-primary px-4 py-2 text-sm font-semibold flex items-center gap-2"
              >
                <Save size={16} />
                {saved ? "Saved!" : loading ? "Saving..." : "Save Settings"}
              </button>
              {saved && (
                <span className="text-xs text-emerald font-semibold">
                  ✓ Settings saved
                </span>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="card-base bg-blue-500/5 border border-blue-500/20 p-4">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">ℹ️ Note:</span> These settings
              define the payroll period for attendance calculation and payroll
              generation. Adjust based on your organization's payroll cycle.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollSettings;
