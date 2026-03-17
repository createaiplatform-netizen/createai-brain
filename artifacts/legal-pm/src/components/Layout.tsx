import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Briefcase, Users, Clock, FileText, 
  CheckSquare, Scale, Search, Bell, Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matters", label: "Matters", icon: Briefcase },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/time", label: "Time & Expenses", icon: Clock },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 flex items-center gap-3 text-white font-serif text-2xl font-bold tracking-tight border-b border-slate-800/80">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2 rounded-xl shadow-lg shadow-indigo-900/50">
            <Scale className="h-5 w-5 text-white" />
          </div>
          LexOS
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium group",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-colors", 
                  isActive ? "text-indigo-200" : "text-slate-500 group-hover:text-slate-300"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800/80">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Robert Sterling</p>
              <p className="text-xs text-slate-500 truncate">Managing Partner</p>
            </div>
            <Settings className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 relative">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search matters, clients, or documents..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-full text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <Link href="/time" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Start Timer
            </Link>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
