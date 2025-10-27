import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./contexts/GameContext";
import TabLayout from "./app/(tabs)/_layout";
import StatusScreen from "./app/(tabs)/index";
import QuestsScreen from "./app/(tabs)/quests";
import ClassesScreen from "./app/(tabs)/classes";
import MarketplaceScreen from "./app/(tabs)/marketplace";
import ProgressScreen from "./app/(tabs)/progress";
import ProTipsScreen from "./app/(tabs)/protips";
import SettingsScreen from "./app/(tabs)/settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="w-full max-w-[56.25vh] h-screen max-h-[177.78vw] mx-auto relative">
          <BrowserRouter>
            <GameProvider>
              <Routes>
                <Route path="/" element={<TabLayout><StatusScreen /></TabLayout>} />
                <Route path="/quests" element={<TabLayout><QuestsScreen /></TabLayout>} />
                <Route path="/classes" element={<TabLayout><ClassesScreen /></TabLayout>} />
                <Route path="/marketplace" element={<TabLayout><MarketplaceScreen /></TabLayout>} />
                <Route path="/progress" element={<TabLayout><ProgressScreen /></TabLayout>} />
                <Route path="/protips" element={<TabLayout><ProTipsScreen /></TabLayout>} />
                <Route path="/settings" element={<TabLayout><SettingsScreen /></TabLayout>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </GameProvider>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
