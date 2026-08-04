import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
// import EmployeeList from "./pages/EmployeeList";
// import EmployeeDetail from "./pages/EmployeeDetail";
import { setDeepLinkNavigator } from "./services/notificationService";
import AnimalDetail from "./pages/AnimalDetail";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import PersonDetail from "./pages/PersonDetail";

function DeepLinkBridge({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const ready = useRef(false);

  useEffect(() => {
    if (ready.current) return;
    ready.current = true;
    setDeepLinkNavigator((path: string) => navigate(path));
  }, [navigate]);

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DeepLinkBridge>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Routes nested here render inside AppLayout, which shows the
                persistent bottom nav (Reports / Dashboard / Profile).
                ProtectedRoute wraps the whole group so none of these are
                reachable without being logged in. */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/person/:id" element={<PersonDetail />} />
              {/* <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} /> */}
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </DeepLinkBridge>
      </BrowserRouter>
    </AuthProvider>
  );
}
