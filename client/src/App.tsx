import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Component /> : <Login />;
}

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Login />;
  if (!isAdmin) return <Login />;
  return <Component />;
}

function ProtectedHome() {
  return <ProtectedRoute component={Home} />;
}

function ProtectedAdmin() {
  return <AdminRoute component={Admin} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/terms" component={Terms} />
      <Route path="/admin" component={ProtectedAdmin} />
      <Route path="/" component={ProtectedHome} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <LanguageProvider>
            <TooltipProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "oklch(0.18 0.02 260)",
                    border: "1px solid oklch(0.25 0.02 260)",
                    color: "oklch(0.9 0.01 250)",
                  },
                }}
              />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
