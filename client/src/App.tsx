import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import RestaurantForm from "@/pages/admin/restaurant-form";
import MenuManagement from "@/pages/admin/menu-management";
import { ThemeProvider } from "./contexts/ThemeContext";

function HomePage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/admin/login");
  }, [setLocation]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/restaurants/new" component={RestaurantForm} />
      <Route path="/admin/restaurants/:id/edit" component={RestaurantForm} />
      <Route path="/admin/restaurants/:restaurantId/menu" component={MenuManagement} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
