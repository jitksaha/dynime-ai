import React, { useState } from 'react';
import {
    X,
    Monitor,
    Apple,
    Smartphone,
    Globe,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    Bell,
    Download,
    Laptop,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AppsModal: React.FC<AppsModalProps> = ({ isOpen, onClose }) => {
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');

    if (!isOpen) return null;

    const handleJoinWaitlist = (e: React.FormEvent) => {
        e.preventDefault();
        if (!waitlistEmail.trim() || !waitlistEmail.includes('@')) {
            toast.error('Please enter a valid work email address.');
            return;
        }
        setIsSubmitted(true);
        toast.success("You're on the early access list! We'll notify you upon release.");
    };

    const platforms = [
        {
            id: 'web',
            category: 'desktop',
            name: 'Web Application',
            arch: 'All Modern Browsers',
            status: 'live',
            statusLabel: 'Available Now',
            icon: Globe,
            desc: 'Real-time multi-model orchestration, deep research, and high-density financial modeling.',
            action: 'Install PWA / Open',
            badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        },
        {
            id: 'macos',
            category: 'desktop',
            name: 'macOS Client',
            arch: 'Apple Silicon (M1–M4) & Intel',
            status: 'coming_soon',
            statusLabel: 'Coming Soon',
            icon: Apple,
            desc: 'Native macOS menu bar quick prompt, global spotlight shortcuts, and offline-ready local cache.',
            action: 'Notify Me',
            badgeColor: 'bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] border-[#635bff]/25',
        },
        {
            id: 'windows',
            category: 'desktop',
            name: 'Windows 11 / 10',
            arch: 'x64 & ARM64 Native',
            status: 'coming_soon',
            statusLabel: 'Coming Soon',
            icon: Monitor,
            desc: 'System tray widget, Windows Copilot keyboard integration, and enterprise SSO credentials.',
            action: 'Notify Me',
            badgeColor: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25',
        },
        {
            id: 'linux',
            category: 'desktop',
            name: 'Linux',
            arch: 'AppImage · .deb · Flatpak',
            status: 'coming_soon',
            statusLabel: 'Coming Soon',
            icon: Laptop,
            desc: 'Developer-first CLI integration, terminal pipe execution, and Wayland compatibility.',
            action: 'Notify Me',
            badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
        },
        {
            id: 'ios',
            category: 'mobile',
            name: 'iOS & iPadOS',
            arch: 'iPhone & iPad · TestFlight',
            status: 'coming_soon',
            statusLabel: 'Coming Soon',
            icon: Smartphone,
            desc: 'Voice transcription, document camera scanner, Siri shortcuts, and split-view iPad multitasking.',
            action: 'Notify Me',
            badgeColor: 'bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] border-[#635bff]/25',
        },
        {
            id: 'android',
            category: 'mobile',
            name: 'Android',
            arch: 'APK & Google Play Store',
            status: 'coming_soon',
            statusLabel: 'Coming Soon',
            icon: Smartphone,
            desc: 'Adaptive Material You design, edge-to-edge synthesis, and background audio streaming.',
            action: 'Notify Me',
            badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        },
    ];

    const filtered = platforms.filter((p) => p.category === activeTab);

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121216] border border-neutral-200/90 dark:border-white/10 rounded-[10px] max-w-2xl w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-white animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[#635bff]/10 dark:bg-[#635bff]/20 flex items-center justify-center text-[#635bff] dark:text-[#9bb1ff]">
                            <Download className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                                <span>Get Dynime AI Apps</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] font-semibold uppercase">
                                    Multi-Platform
                                </span>
                            </h3>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                Native high-velocity enterprise intelligence on all your devices.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-[8px] text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-5 pt-3 flex items-center gap-2 border-b border-neutral-100 dark:border-white/[0.04] flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('desktop')}
                        className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                            activeTab === 'desktop'
                                ? 'border-[#635bff] text-[#635bff] dark:text-[#9bb1ff]'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        Desktop & Web ({platforms.filter((p) => p.category === 'desktop').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('mobile')}
                        className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                            activeTab === 'mobile'
                                ? 'border-[#635bff] text-[#635bff] dark:text-[#9bb1ff]'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        Mobile & Tablet ({platforms.filter((p) => p.category === 'mobile').length})
                    </button>
                </div>

                {/* Platform Cards Grid */}
                <div className="p-5 overflow-y-auto space-y-3 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.map((item) => {
                            const IconComponent = item.icon;
                            const isLive = item.status === 'live';

                            return (
                                <div
                                    key={item.id}
                                    className="p-3.5 rounded-[10px] border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/70 dark:bg-white/[0.02] flex flex-col justify-between hover:border-[#635bff]/40 transition-all shadow-2xs"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-[8px] bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 flex-shrink-0">
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-[10px] text-neutral-400 font-mono">
                                                        {item.arch}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-[9.5px] px-2 py-0.5 rounded-[4px] border font-medium uppercase font-mono ${item.badgeColor}`}
                                            >
                                                {item.statusLabel}
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>

                                    <div className="pt-3 mt-2 border-t border-neutral-200/50 dark:border-white/[0.04] flex items-center justify-between">
                                        {isLive ? (
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    toast.success('You are using the latest Dynime AI Web Platform.');
                                                }}
                                                className="w-full py-1.5 px-3 rounded-[8px] bg-[#635bff] hover:bg-[#5465ff] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <span>Active Session</span>
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    const el = document.getElementById('waitlist-input');
                                                    if (el) el.focus();
                                                }}
                                                className="w-full py-1.5 px-3 rounded-[8px] bg-neutral-200/70 hover:bg-neutral-300/70 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <Bell className="w-3 h-3 text-[#635bff] dark:text-[#9bb1ff]" />
                                                <span>Join Waitlist</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Early Access Notification Banner */}
                    <div className="mt-4 p-4 rounded-[10px] border border-[#635bff]/25 bg-gradient-to-r from-[#635bff]/[0.08] to-[#5465ff]/[0.03] dark:from-[#635bff]/15 dark:to-transparent">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles className="w-4 h-4 text-[#635bff] dark:text-[#9bb1ff]" />
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                Early Access & Beta Release Waitlist
                            </h4>
                        </div>
                        <p className="text-[11.5px] text-neutral-600 dark:text-neutral-300 mb-3">
                            Be the first to receive native desktop DMG, Windows installers, and iOS TestFlight invites.
                        </p>

                        {isSubmitted ? (
                            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-[8px]">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>Thank you! Your spot is reserved. We'll send build alerts to your inbox.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                                <input
                                    id="waitlist-input"
                                    type="email"
                                    required
                                    value={waitlistEmail}
                                    onChange={(e) => setWaitlistEmail(e.target.value)}
                                    placeholder="Enter your work email address..."
                                    className="flex-1 px-3 py-1.5 rounded-[8px] bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-[8px] bg-[#635bff] hover:bg-[#5465ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                                >
                                    <span>Notify Me</span>
                                    <ArrowRight className="w-3 h-3" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-neutral-100 dark:border-white/[0.06] bg-neutral-50 dark:bg-black/20 flex items-center justify-between text-[11px] text-neutral-400 flex-shrink-0">
                    <span>Dynime AI Operating Layer · 2026 Edition</span>
                    <button
                        onClick={onClose}
                        className="hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
