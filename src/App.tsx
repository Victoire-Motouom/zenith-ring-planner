import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { processRecurringTransactions } from "./lib/database";

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

  // Get the correct base path for the router
  const getBasename = () => {
    // In development, use no basename
    if (import.meta.env.DEV) return '/';
    
    // For GitHub Pages, use the repository name as basename
    return '/zenith-ring-planner';
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Index />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    ),
    {
      basename: getBasename(),
      future: {
        // Enable future flags for React Router
        // @ts-ignore - These are valid future flags but not in the type definitions yet
        v7_startTransition: true,
        // @ts-ignore
        v7_relativeSplatPath: true
      }
    }
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
