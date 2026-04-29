import { useAuthStore } from "./store/authStore";
import LoginPage     from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import "./styles/globals.css";

export default function App() {
  const token        = useAuthStore((s) => s.token);
  const hasHydrated  = useAuthStore((s) => s._hasHydrated);

  // Zustand localStorage'dan okumayı tamamlayana kadar bekle
  if (!hasHydrated) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#F8FAFC",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid #EEF2FF",
          borderTopColor: "#4F46E5",
          borderRadius: "50%",
          animation: "spin .7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#94A3B8", fontSize: 14 }}>Yükleniyor...</span>
      </div>
    );
  }

  return token ? <DashboardPage /> : <LoginPage />;
}
