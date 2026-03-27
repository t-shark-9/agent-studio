import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";

// SEO pages (eager load for fast FCP)
import Landing from "./pages/Landing.tsx";
import Features from "./pages/Features.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import StraightforwardDesign from "./pages/StraightforwardDesign.tsx";
import AppBuilder from "./pages/AppBuilder.tsx";
import Pricing from "./pages/Pricing.tsx";
import PricingComparison from "./pages/PricingComparison.tsx";
import BlogHub from "./pages/BlogHub.tsx";
import BlogArticlePage from "./pages/BlogArticlePage.tsx";
import Support from "./pages/Support.tsx";
import NotFound from "./pages/NotFound.tsx";
import { usePageTracking } from "./hooks/usePageTracking";

// App (lazy load - heavier bundle)
const AppStudio = lazy(() => import("./pages/Index.tsx"));

const queryClient = new QueryClient();
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRoutes() {
  usePageTracking();
  return (
    <Routes>
      {/* SEO Landing Pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/straightforward-design" element={<StraightforwardDesign />} />
      <Route path="/app-builder" element={<AppBuilder />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/pricing-comparison" element={<PricingComparison />} />
      <Route path="/support" element={<Support />} />
      <Route path="/faq" element={<BlogHub />} />
      <Route path="/answers/:slug" element={<BlogArticlePage />} />

      {/* Jimply App */}
      <Route
        path="/app"
        element={
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-background">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading Jimply...
              </div>
            </div>
          }>
            <AppStudio />
          </Suspense>
        }
      />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBase} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
