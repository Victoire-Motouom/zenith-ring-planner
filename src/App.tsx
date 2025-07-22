import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { processRecurringTransactions } from "./lib/database";
import { ROUTER_BASE } from "./utils/constants";

const queryClient = new QueryClient();

// Add dark mode class to html element
const updateThemeClass = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

const App = () => {
  // Check for saved theme preference or use system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('zenith-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      updateThemeClass(savedTheme === 'dark');
    } else {
      updateThemeClass(prefersDark);
    }

    // Process recurring transactions on app load
    processRecurringTransactions();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={createBrowserRouter(
            createRoutesFromElements(
              <Route path="/" element={<Index />}>
                <Route index element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            ),
            {
              basename: ROUTER_BASE,
              future: {
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }
            }
          )} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
