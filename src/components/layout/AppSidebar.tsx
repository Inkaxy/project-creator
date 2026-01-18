import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  CheckCircle,
  ClipboardList,
  Settings,
  Shield,
  GraduationCap,
  AlertTriangle,
  Flame,
  DollarSign,
  Clock,
  Home,
  ChevronDown,
  ChevronRight,
  UserPlus,
  BookOpen,
  CalendarClock,
  Calculator,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navigation: NavSection[] = [
  {
    title: "DAGLIG BRUK",
    items: [
      { title: "Dashboard", href: "/", icon: Home },
      { title: "Kalender", href: "/kalender", icon: Calendar },
      { title: "Vaktplan", href: "/vaktplan", icon: CalendarClock },
      { title: "Min side", href: "/min-side", icon: Users },
    ],
  },
  {
    title: "PERSONAL & ADMIN",
    items: [
      { title: "Ansatte", href: "/ansatte", icon: Users, badge: 12 },
      { title: "Godkjenninger", href: "/godkjenninger", icon: CheckCircle, badge: 3 },
      { title: "Rekruttering", href: "/rekruttering", icon: UserPlus },
      { title: "Personalhåndbok", href: "/personalhandbok", icon: BookOpen },
      { title: "Disiplinærsaker", href: "/disiplinaersaker", icon: AlertTriangle },
    ],
  },
  {
    title: "INTERNKONTROLL",
    items: [
      { title: "E-læring", href: "/e-laering", icon: GraduationCap },
      { title: "IK-Mat", href: "/ik-mat", icon: ClipboardList },
      { title: "HMS", href: "/hms", icon: Shield },
      { title: "Brann", href: "/brann", icon: Flame },
      { title: "Meld avvik", href: "/meld-avvik", icon: AlertTriangle },
    ],
  },
  {
    title: "LØNN & RAPPORTER",
    items: [
      { title: "Timelister", href: "/timelister", icon: Clock },
      { title: "Lønnskjøring", href: "/lonnskjoring", icon: DollarSign },
      { title: "Rapporter", href: "/rapporter", icon: BarChart3 },
    ],
  },
  {
    title: "OPPSETT",
    items: [
      { title: "Vaktoppsett", href: "/vaktoppsett", icon: Settings },
      { title: "Lønnssatser", href: "/lonnssatser", icon: Calculator },
      { title: "Innstillinger", href: "/innstillinger", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(["DAGLIG BRUK", "PERSONAL & ADMIN"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (roles: string[]) => {
    if (roles.includes('superadmin')) return 'Superadmin';
    if (roles.includes('daglig_leder')) return 'Daglig leder';
    if (roles.includes('avdelingsleder')) return 'Avdelingsleder';
    return 'Ansatt';
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Calendar className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">ShiftFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navigation.map((section) => (
          <div key={section.title} className="mb-2">
            <button
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-sidebar-accent"
            >
              {section.title}
              {expandedSections.includes(section.title) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedSections.includes(section.title) && (
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {profile?.full_name ? getInitials(profile.full_name) : '??'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name || 'Laster...'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {getRoleDisplay(roles)}
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleSignOut}
              title="Logg ut"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
