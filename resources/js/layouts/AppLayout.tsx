import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Bot,
    Shield,
    Settings,
    LogOut,
    Sun,
    Moon,
    ExternalLink,
    Sparkles,
    User as UserIcon,
    Menu,
    X,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface Props {
    children: React.ReactNode;
    title?: string;
    fullWidth?: boolean;
}

export default function AppLayout({ children, title = 'Dynime AI', fullWidth = false }: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [isDark, setIsDark] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('dynime_ai_theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('dynime_ai_theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('dynime_ai_theme', 'dark');
            setIsDark(true);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
            {/* Header / Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
                    {/* Left: Brand / Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/chat" className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-purple-950 to-purple-800 dark:from-white dark:via-purple-200 dark:to-purple-400 bg-clip-text text-transparent">
                                    Dynime AI
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                                    Studio
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Nav Links */}
                        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                            <Link
                                href="/chat"
                                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                            >
                                Chat & Reasoning
                            </Link>

                            {user?.role === 'admin' && (
                                <>
                                    <Link
                                        href="/admin"
                                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                                    >
                                        Admin Dashboard
                                    </Link>
                                    <Link
                                        href="/admin/settings"
                                        className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                                    >
                                        AI Engine Providers
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Right: Actions, Theme, User Profile */}
                    <div className="flex items-center gap-2">
                        {/* Dynime Account Center link */}
                        <a
                            href="https://account.dynime.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                        >
                            <span>Account Center</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>

                        {/* Dark / Light Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            type="button"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                        </button>

                        {/* User Dropdown */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.name}
                                                className="w-7 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-md bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="hidden lg:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                                            {user.name}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{user.name}</p>
                                            <p className="text-[11px] leading-none text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                    {user.role === 'admin' && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin" className="cursor-pointer flex items-center gap-2 text-xs">
                                                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/settings" className="cursor-pointer flex items-center gap-2 text-xs">
                                                    <Settings className="w-3.5 h-3.5 text-purple-600" />
                                                    <span>AI Providers Settings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                        </>
                                    )}
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="cursor-pointer text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 flex items-center gap-2"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Sign out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link href="/login">
                                <Button size="sm" className="rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white">
                                    Sign In
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
                        <Link
                            href="/chat"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Chat & Reasoning
                        </Link>
                        {user?.role === 'admin' && (
                            <>
                                <Link
                                    href="/admin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Admin Dashboard
                                </Link>
                                <Link
                                    href="/admin/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    AI Engine Providers
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content Body */}
            <main className={`flex-1 flex flex-col ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto w-full px-4 sm:px-6 py-6'}`}>
                {children}
            </main>
        </div>
    );
}
