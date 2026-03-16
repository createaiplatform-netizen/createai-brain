import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import StandalonePage from "@/pages/StandalonePage";
import CreationPage from "@/pages/CreationPage";
import ProjectPage from "@/pages/ProjectPage";

import { OSProvider } from "@/os/OSContext";
import { OSLayout } from "@/os/osLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* OS — root only */}
      <Route path="/" component={OSLayout} />

      {/* Standalone project pages — full SaaS layout, no OS chrome */}
      <Route path="/project/:projectId" component={ProjectPage} />

      {/* Creation Engine outputs — full standalone products */}
      <Route path="/standalone/creation/:creationId" component={CreationPage} />
      <Route path="/standalone/:projectId" component={StandalonePage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OSProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </OSProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
