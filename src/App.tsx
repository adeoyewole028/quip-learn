import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  Moon,
  Sun,
  GraduationCap,
  LogOut,
  BookOpen,
  MessagesSquare,
  Settings,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/hooks/useTheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import LessonPage from '@/pages/LessonPage';
import LoginPage from '@/pages/LoginPage';
import CommunityPage from '@/pages/CommunityPage';
import AskQuestionPage from '@/pages/AskQuestionPage';
import CommunityThreadPage from '@/pages/CommunityThreadPage';
import SettingsPage from '@/pages/SettingsPage';

interface NavItem {
  label: string;
  to: string;
  description: string;
  icon: typeof BookOpen;
  matches: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Courses',
    to: '/courses',
    description: 'Courses, modules, and lessons',
    icon: BookOpen,
    matches: (pathname) => pathname.startsWith('/courses') || pathname.startsWith('/lessons'),
  },
  {
    label: 'Community',
    to: '/community',
    description: 'Peer questions and shared answers',
    icon: MessagesSquare,
    matches: (pathname) => pathname.startsWith('/community'),
  },
  {
    label: 'Settings',
    to: '/settings',
    description: 'Profile and account security',
    icon: Settings,
    matches: (pathname) => pathname.startsWith('/settings'),
  },
];

function AppFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const activeItem = navItems.find((item) => item.matches(location.pathname)) ?? navItems[0];
  const firstName = user?.first_name?.trim() || user?.name?.split(' ')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18.5rem_minmax(0,1fr)]">
      <aside className="hidden border-r bg-sidebar text-sidebar-foreground lg:flex lg:min-h-screen lg:flex-col">
        <div className="border-b px-5 py-5">
          <Link
            to="/courses"
            className="flex items-center gap-3 font-semibold tracking-tight transition-opacity hover:opacity-85"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg leading-none">
                quip<span className="text-primary">learn</span>
              </span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Learn, ask, and keep growing.
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </div>
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.matches(location.pathname);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-start gap-3 rounded-2xl px-3 py-3 transition-all ${
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${
                      active ? 'bg-black/10' : 'bg-background/70 text-primary shadow-sm ring-1 ring-border'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        active ? 'text-sidebar-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t p-4">
          <div className="rounded-2xl border border-sidebar-border bg-background/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{user?.name || firstName}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex-1"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="ghost" size="icon" aria-label="Sign out" />}
                >
                  <LogOut className="h-4 w-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out of quiplearn?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to sign in again to continue your lessons.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={logout}>Log out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  quip<span className="text-primary">learn</span>
                </span>
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {activeItem.label}
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  {activeItem.description}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground md:block">
                {user?.name || firstName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="rounded-full lg:hidden"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="ghost" size="icon" aria-label="Sign out" className="rounded-full lg:hidden" />}
                >
                  <LogOut className="h-4 w-4" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out of quiplearn?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to sign in again to continue your lessons.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={logout}>Log out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="border-t px-4 py-3 lg:hidden sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.matches(location.pathname);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>

        <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8 lg:text-left">
          <span className="inline-flex items-center gap-1.5">
            © {new Date().getFullYear()} LifeBank · quiplearn
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </footer>
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/courses" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <AppFrame>
              <CoursesPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <AppFrame>
              <CourseDetailPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lessons/:id"
        element={
          <ProtectedRoute>
            <AppFrame>
              <LessonPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <AppFrame>
              <CommunityPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/ask"
        element={
          <ProtectedRoute>
            <AppFrame>
              <AskQuestionPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
      <Route
        path="/community/thread/:questionId"
        element={
          <ProtectedRoute>
            <AppFrame>
              <CommunityThreadPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppFrame>
              <SettingsPage />
            </AppFrame>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;