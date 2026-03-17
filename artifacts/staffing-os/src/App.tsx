import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/dashboard";
import Candidates from "@/pages/candidates";
import CandidateDetail from "@/pages/candidate-detail";
import Clients from "@/pages/clients";
import Requisitions from "@/pages/requisitions";
import Interviews from "@/pages/interviews";
import Placements from "@/pages/placements";

const queryClient = new QueryClient();

// Simple Toaster implementation using the custom hook
function AppToaster() {
  const { toasts } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div 
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl shadow-lg border pointer-events-auto w-[300px] ${
              t.variant === 'destructive' 
                ? 'bg-destructive text-destructive-foreground border-destructive/20' 
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <h4 className="font-bold text-sm">{t.title}</h4>
            {t.description && <p className="text-xs opacity-90 mt-1">{t.description}</p>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/candidates" component={Candidates} />
        <Route path="/candidates/:id" component={CandidateDetail} />
        <Route path="/clients" component={Clients} />
        <Route path="/requisitions" component={Requisitions} />
        <Route path="/interviews" component={Interviews} />
        <Route path="/placements" component={Placements} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <AppToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
