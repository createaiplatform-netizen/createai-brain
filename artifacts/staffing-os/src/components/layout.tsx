import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  CalendarDays, 
  Award,
  Menu,
  Bell,
  Search,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Candidates", href: "/candidates", icon: Users },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Requisitions", href: "/requisitions", icon: Briefcase },
  { name: "Interviews", href: "/interviews", icon: CalendarDays },
  { name: "Placements", href: "/placements", icon: Award },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2">
          <div className="bg-accent rounded-lg p-1.5">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg">StaffingOS</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-72 md:flex-shrink-0 shadow-2xl md:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="bg-accent rounded-xl p-2 shadow-lg shadow-accent/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-white">StaffingOS</span>
        </div>

        <div className="px-4 py-2 mt-4 md:mt-0">
          <p className="px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">Main Menu</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group cursor-pointer",
                    isActive 
                      ? "bg-accent text-white shadow-md shadow-accent/20" 
                      : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
                  )}>
                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-white")} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Jane Doe</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Lead Recruiter</p>
            </div>
            <LogOut className="w-4 h-4 text-sidebar-foreground/50 hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search candidates, requisitions, clients..." 
                className="w-full bg-slate-100/50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
            </button>
            <Button variant="default" size="sm" className="hidden sm:flex">New Placement</Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 pb-24">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/50 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
