import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Sparkles,
    ArrowUp,
    Plus,
    Paperclip,
    Trash2,
    Pin,
    Copy,
    Check,
    Bot,
    User as UserIcon,
    Zap,
    Code2,
    Compass,
    FileText,
    X,
    Loader2,
    PanelLeft,
    PanelLeftClose,
    Shield,
    Sliders,
    LogOut,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Globe,
    Layers,
    FileSpreadsheet,
    Palette,
    Clock,
    RefreshCw,
    Network,
    Lightbulb,
    Sun,
    Moon,
    Laptop,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    capability_profile?: string;
    provider?: string;
    model?: string;
    latency_ms?: number;
    created_at?: string;
}

interface Conversation {
    id: number;
    uuid: string;
    title: string;
    capability_profile: string;
    is_pinned: boolean;
    updated_at: string;
    messages?: Message[];
}

interface Capability {
    id: string;
    name: string;
    description: string;
    badge: string;
}

interface Provider {
    id: number;
    provider: string;
    display_name: string;
    default_model: string;
}

interface Props {
    conversations: Conversation[];
    initial_conversation: Conversation | null;
    active_providers: Provider[];
    capabilities: Capability[];
}

export default function ChatIndex({
    conversations: initialConversations = [],
    initial_conversation = null,
    active_providers = [],
    capabilities = [],
}: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // Theme state: default 'light'
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeConv, setActiveConv] = useState<Conversation | null>(initial_conversation);
    const [messages, setMessages] = useState<Message[]>(initial_conversation?.messages || []);
    const [inputValue, setInputValue] = useState('');
    const [selectedCapability, setSelectedCapability] = useState<string>(
        initial_conversation?.capability_profile || 'auto'
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Theme on mount (Default: Light)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('dynime_theme') || 'light';
            setTheme(saved as 'light' | 'dark');
            if (saved === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (e) {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Telegram-Style Circular Transition Theme Switcher
    const toggleTheme = (e?: React.MouseEvent) => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';

        const applyTheme = () => {
            setTheme(nextTheme);
            if (nextTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            try {
                localStorage.setItem('dynime_theme', nextTheme);
            } catch (err) {}
        };

        // Check for View Transitions API support
        if (!(document as any).startViewTransition || !e) {
            applyTheme();
            return;
        }

        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = (document as any).startViewTransition(() => {
            applyTheme();
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ];
            document.documentElement.animate(
                {
                    clipPath: clipPath,
                },
                {
                    duration: 500,
                    easing: 'cubic-bezier(0.2, 0, 0, 1)',
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        });
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    // Keyboard shortcut ⌘K for new chat
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                handleNewChat();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCapability]);

    const ssoLoginUrl = `https://account.dynime.com/login?client_id=dynime_ai_app&redirect=${encodeURIComponent(
        window.location.origin + '/auth/sso/callback'
    )}`;

    const avatarSrc =
        user?.avatar_url ||
        user?.avatar ||
        (user?.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff` : null);

    const handleSelectConversation = async (conv: Conversation) => {
        if (activeConv?.uuid === conv.uuid) return;
        try {
            const res = await axios.get(`/api/conversations/${conv.uuid}`);
            setActiveConv(res.data);
            setMessages(res.data.messages || []);
            setSelectedCapability(res.data.capability_profile || 'auto');
        } catch (e) {
            toast.error('Failed to load conversation history.');
        }
    };

    const handleNewChat = async () => {
        try {
            const res = await axios.post('/api/conversations', {
                capability: selectedCapability,
            });
            const newConv = res.data;
            setConversations([newConv, ...conversations]);
            setActiveConv(newConv);
            setMessages([]);
            setInputValue('');
            setAttachments([]);
            if (textareaRef.current) textareaRef.current.focus();
        } catch (e) {
            setActiveConv(null);
            setMessages([]);
            setInputValue('');
            setAttachments([]);
        }
    };

    const handleTogglePin = async (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        try {
            const res = await axios.put(`/api/conversations/${conv.uuid}`, {
                is_pinned: !conv.is_pinned,
            });
            setConversations(
                conversations
                    .map((c) => (c.uuid === conv.uuid ? { ...c, is_pinned: res.data.is_pinned } : c))
                    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
            );
        } catch (e) {
            toast.error('Failed to update pin.');
        }
    };

    const handleDeleteConversation = async (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        if (!confirm('Delete this discussion?')) return;
        try {
            await axios.delete(`/api/conversations/${conv.uuid}`);
            const updated = conversations.filter((c) => c.uuid !== conv.uuid);
            setConversations(updated);
            if (activeConv?.uuid === conv.uuid) {
                setActiveConv(updated[0] || null);
                setMessages(updated[0]?.messages || []);
            }
            toast.success('Discussion deleted.');
        } catch (e) {
            toast.error('Failed to delete discussion.');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/chat/attachments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAttachments([...attachments, res.data]);
            toast.success(`Attached ${file.name}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text || isGenerating) return;

        let currentConv = activeConv;

        if (!currentConv) {
            try {
                const res = await axios.post('/api/conversations', {
                    capability: selectedCapability,
                    title: text.slice(0, 36),
                });
                currentConv = res.data;
                setActiveConv(currentConv);
                setConversations([currentConv!, ...conversations]);
            } catch (e) {
                toast.error('Failed to initialize conversation.');
                return;
            }
        }

        const tempUserMsg: Message = {
            id: Date.now(),
            role: 'user',
            content: text,
            capability_profile: selectedCapability,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempUserMsg]);
        setInputValue('');
        const currentAttachments = [...attachments];
        setAttachments([]);
        setIsGenerating(true);

        try {
            const res = await axios.post('/api/chat/send', {
                conversation_uuid: currentConv!.uuid,
                message: text,
                capability: selectedCapability,
                attachments: currentAttachments,
            });

            if (res.data.success) {
                setMessages((prev) => [...prev, res.data.response]);
                setConversations((prev) =>
                    prev.map((c) =>
                        c.uuid === currentConv!.uuid
                            ? { ...c, title: res.data.conversation.title, updated_at: new Date().toISOString() }
                            : c
                    )
                );
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Connection error with AI Engine.';
            toast.error(errorMsg);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `⚠️ Error: ${errorMsg}. Please verify provider keys in Admin Settings.`,
                    capability_profile: selectedCapability,
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (content: string, id: number) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied to clipboard');
    };

    const capabilityLabels: Record<string, string> = {
        auto: 'Instant High',
        fast: 'Fast ⚡',
        deep_thinking: 'High Reasoning 🧠',
        coding: 'Code Specialist 💻',
        vision: 'Vision & Multimodal 👁️',
        research: 'Deep Research 🔍',
        creative: 'Creative Copy ✨',
    };

    // Quick action chips matching Kimi AI screenshot
    const quickActionChips = [
        { id: 'auto', label: 'Swarm', icon: Network },
        { id: 'creative', label: 'Slides', icon: Layers },
        { id: 'research', label: 'Deep Research', icon: Compass },
        { id: 'fast', label: 'Websites', icon: Globe },
        { id: 'vision', label: 'Docs', icon: FileText },
        { id: 'coding', label: 'Sheets', icon: FileSpreadsheet },
        { id: 'deep_thinking', label: 'Design', icon: Palette },
    ];

    // Helper to format assistant markdown content cleanly with rich typography
    const formatAssistantMessage = (content: string) => {
        const parts = content.split('\n');
        return (
            <div className="space-y-3 text-[15px] leading-7 text-neutral-800 dark:text-neutral-200">
                {parts.map((paragraph, pIdx) => {
                    if (!paragraph.trim()) {
                        return <div key={pIdx} className="h-2" />;
                    }

                    // Headers
                    if (paragraph.startsWith('### ')) {
                        return (
                            <h3 key={pIdx} className="text-base font-semibold text-neutral-900 dark:text-white mt-4 mb-1">
                                {paragraph.replace('### ', '')}
                            </h3>
                        );
                    }
                    if (paragraph.startsWith('## ')) {
                        return (
                            <h2 key={pIdx} className="text-lg font-bold text-neutral-900 dark:text-white mt-5 mb-2">
                                {paragraph.replace('## ', '')}
                            </h2>
                        );
                    }
                    if (paragraph.startsWith('# ')) {
                        return (
                            <h1 key={pIdx} className="text-xl font-extrabold text-neutral-900 dark:text-white mt-6 mb-2">
                                {paragraph.replace('# ', '')}
                            </h1>
                        );
                    }

                    // Bullet lists
                    if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                        return (
                            <div key={pIdx} className="flex items-start gap-2.5 ml-1">
                                <span className="text-purple-600 dark:text-purple-400 mt-1.5 text-xs select-none">•</span>
                                <span className="flex-1">{paragraph.trim().slice(2)}</span>
                            </div>
                        );
                    }

                    return <p key={pIdx} className="leading-relaxed">{paragraph}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0c0c0f] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-purple-600 selection:text-white transition-colors duration-200">
            <Head title="Dynime AI - Enterprise Intelligence" />

            {/* Left Kimi-Style Sidebar (Fixed Width 256px, flex-shrink-0 to never squish) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 md:static flex flex-col w-64 min-w-[16rem] max-w-[16rem] flex-shrink-0 bg-[#f7f7f9] dark:bg-[#111115] border-r border-neutral-200/80 dark:border-white/[0.06] transition-all duration-300 shadow-2xl md:shadow-none select-none ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:min-w-0 md:border-none md:overflow-hidden'
                }`}
            >
                {/* Brand Header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] flex-shrink-0">
                    <div className="flex items-center">
                        <img
                            src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/dynime-logo.png"
                            alt="Dynime AI"
                            className="h-7 w-auto object-contain dark:brightness-0 dark:invert transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* + New Chat Button with ⌘K */}
                <div className="p-3 flex-shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border border-neutral-200/80 dark:border-white/[0.07] text-neutral-800 dark:text-white text-xs font-medium transition-all shadow-xs group"
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:rotate-90 transition-transform duration-200" />
                            <span>New Chat</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-white/10 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                            ⌘ K
                        </kbd>
                    </button>
                </div>

                {/* Kimi Menu Navigation List */}
                <div className="px-2 py-1 space-y-0.5 text-xs text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium">My Dynime</span>
                    </button>

                    <button
                        onClick={() => toast.info('Scheduled automated agent tasks are active.')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span>Scheduled Tasks</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('auto');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Network className="w-4 h-4 text-neutral-400" />
                        <span>Swarm</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('creative');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Layers className="w-4 h-4 text-neutral-400" />
                        <span>Slides</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('research');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Compass className="w-4 h-4 text-neutral-400" />
                        <span>Deep Research</span>
                    </button>

                    {/* Collapse Tools Section */}
                    <button
                        onClick={() => setIsToolsCollapsed(!isToolsCollapsed)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <span className="text-[11px] uppercase tracking-wider font-semibold">Workspace</span>
                        {isToolsCollapsed ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronUp className="w-3.5 h-3.5" />
                        )}
                    </button>

                    {!isToolsCollapsed && (
                        <div className="pl-3 space-y-0.5">
                            <button
                                onClick={() => {
                                    setSelectedCapability('fast');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Websites</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('vision');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Docs</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('coding');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Sheets</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('deep_thinking');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                <Palette className="w-3.5 h-3.5" />
                                <span>Design</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('coding');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Dynime Code</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Discussions List */}
                <div className="flex-1 overflow-y-auto px-2 mt-2 space-y-1 border-t border-neutral-200/80 dark:border-white/[0.05] pt-2">
                    <div className="px-2 pt-1 pb-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                        Recent Chats
                    </div>

                    {conversations.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-neutral-400">
                            No chat history yet.
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const isActive = activeConv?.uuid === conv.uuid;
                            return (
                                <div
                                    key={conv.uuid}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-200 border-l-2 border-purple-600 font-semibold'
                                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-white/[0.04] hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-1">
                                        {conv.is_pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                        <span className="truncate">{conv.title}</span>
                                    </div>

                                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleTogglePin(e, conv)}
                                            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-400 hover:text-amber-500"
                                            title="Pin"
                                        >
                                            <Pin className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteConversation(e, conv)}
                                            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-neutral-400 hover:text-rose-500"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer User Profile & Controls */}
                <div className="p-3 border-t border-neutral-200/80 dark:border-white/[0.06] bg-[#f0f0f3] dark:bg-[#0f0f13] flex-shrink-0">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                    src={avatarSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-white/10 shadow-xs"
                                />
                                <div className="truncate">
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                                    <a
                                        href="https://account.dynime.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                                    >
                                        <span>Account Center</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleTheme}
                                    className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors"
                                    title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                                >
                                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
                                </button>
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-white/[0.06] transition-colors"
                                    title="Sign out"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <a
                            href={ssoLoginUrl}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-all shadow-sm"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Log in</span>
                        </a>
                    )}
                </div>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 min-w-0 flex flex-col h-full bg-white dark:bg-[#0c0c0f] relative overflow-hidden transition-colors duration-200">
                {/* Top Nav Bar */}
                <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0c0f]/80 backdrop-blur-xl z-20 transition-colors duration-200 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
                                title="Expand sidebar"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        )}
                        {activeConv && (
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate max-w-xs sm:max-w-md">
                                {activeConv.title}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Telegram Theme Switcher Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-all flex items-center gap-1.5 text-xs"
                            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="w-4 h-4 text-amber-400" />
                                    <span className="hidden sm:inline">Light</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4 text-purple-600" />
                                    <span className="hidden sm:inline">Dark</span>
                                </>
                            )}
                        </button>

                        {user?.role === 'admin' && (
                            <>
                                <Link
                                    href="/admin"
                                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Admin</span>
                                </Link>
                                <Link
                                    href="/admin/settings"
                                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Engines</span>
                                </Link>
                            </>
                        )}

                        {/* Top Header Right: Dynamic Profile Avatar Icon with Dropdown Menu */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="relative flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-purple-500/40 focus:outline-none transition-all group"
                                        title={`${user.name} (Dynime Account)`}
                                    >
                                        <img
                                            src={avatarSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`}
                                            alt={user.name}
                                            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-white/20 shadow-xs group-hover:scale-105 transition-transform"
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c0c0f]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 bg-white dark:bg-[#16161b] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-2xl rounded-2xl p-1.5">
                                    <div className="px-3 py-2.5 border-b border-neutral-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                                    </div>
                                    <DropdownMenuItem asChild>
                                        <a
                                            href="https://account.dynime.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between text-xs py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer font-medium text-neutral-700 dark:text-neutral-200"
                                        >
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <span>Dynime Account Center</span>
                                            </div>
                                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <a
                                            href="https://account.dynime.com/security"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between text-xs py-2 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer text-neutral-600 dark:text-neutral-300"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-neutral-400" />
                                                <span>Security & Login</span>
                                            </div>
                                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                                        </a>
                                    </DropdownMenuItem>
                                    <div className="my-1 border-t border-neutral-100 dark:border-white/5" />
                                    <DropdownMenuItem
                                        onClick={() => router.post('/logout')}
                                        className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <a
                                href={ssoLoginUrl}
                                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all"
                            >
                                Log in
                            </a>
                        )}
                    </div>
                </header>

                {/* Content Canvas */}
                {messages.length === 0 ? (
                    /* KIMI-STYLE HERO CENTER CANVAS */
                    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 sm:px-6 max-w-3xl mx-auto w-full relative z-10 py-8">
                        {/* Huge Bold Title with Official Dynime Logo */}
                        <div className="text-center mb-8 select-none flex flex-col items-center">
                            <img
                                src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/dynime-logo.png"
                                alt="Dynime"
                                className="h-12 sm:h-14 w-auto object-contain mb-3 drop-shadow-sm transition-transform hover:scale-105 duration-200 dark:brightness-0 dark:invert"
                            />
                        </div>

                        {/* Centered Input Card */}
                        <div className="w-full bg-white dark:bg-[#16161b] border border-neutral-200/90 dark:border-white/[0.08] hover:border-purple-500/40 dark:hover:border-purple-500/30 focus-within:border-purple-600 dark:focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/10 dark:focus-within:ring-0 dark:focus-within:shadow-[0_0_30px_rgba(139,92,246,0.12)] rounded-2xl p-3.5 shadow-lg dark:shadow-2xl transition-all duration-300">
                            {/* Attachments preview */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2 px-1">
                                    {attachments.map((att, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-[11px] text-purple-700 dark:text-purple-300 shadow-xs"
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span className="max-w-[140px] truncate">{att.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="hover:text-rose-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Ask anything, or task an agent..."
                                rows={2}
                                className="w-full bg-transparent border-none text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none px-2 py-1 leading-relaxed"
                            />

                            {/* Bottom Card Controls */}
                            <div className="flex items-center justify-between pt-3 px-1 border-t border-neutral-100 dark:border-white/[0.05]">
                                {/* Attach File */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={isUploading || isGenerating}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
                                    title="Attach document or file"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Plus className="w-4 h-4" />}
                                </button>

                                <div className="flex items-center gap-2">
                                    {/* Capability Selector Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/[0.04] hover:bg-neutral-200 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08] transition-all">
                                                <span>{capabilityLabels[selectedCapability] || 'Instant High'}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-[#191920] border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-xl">
                                            {capabilities.map((cap) => (
                                                <DropdownMenuItem
                                                    key={cap.id}
                                                    onClick={() => setSelectedCapability(cap.id)}
                                                    className="text-xs cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/60 flex items-center justify-between py-2"
                                                >
                                                    <span>{cap.name}</span>
                                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/30">
                                                        {cap.badge}
                                                    </span>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Send Button (Kimi circle with up-arrow) */}
                                    <button
                                        type="button"
                                        disabled={!inputValue.trim() || isGenerating}
                                        onClick={handleSendMessage}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                            inputValue.trim() && !isGenerating
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 hover:scale-105 active:scale-95'
                                                : 'bg-neutral-200 dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        ) : (
                                            <ArrowUp className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Chips Matching Kimi AI Screenshot */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                            {quickActionChips.map((chip) => {
                                const Icon = chip.icon;
                                return (
                                    <button
                                        key={chip.id}
                                        onClick={() => {
                                            setSelectedCapability(chip.id);
                                            if (textareaRef.current) textareaRef.current.focus();
                                        }}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.03] hover:bg-neutral-50 dark:hover:bg-white/[0.08] border border-neutral-200/80 dark:border-white/[0.07] hover:border-purple-400 dark:hover:border-purple-500/40 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs group"
                                    >
                                        <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                                        <span>{chip.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explore Inspiration Bottom Pill (from Screenshot 1) */}
                        <div className="mt-12 flex items-center justify-between px-4 py-2 rounded-full bg-neutral-100/80 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.06] text-[11px] text-neutral-500 dark:text-neutral-400 w-full max-w-sm">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                <span>Explore inspiration</span>
                            </div>
                            <span className="flex items-center gap-1 text-neutral-400">
                                <span>Scroll to explore</span>
                                <ChevronUp className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE CHAT CANVAS (ELEGANT OPEN FLOW - KIMI STYLE) */
                    <div className="flex-1 flex flex-col min-h-0 relative z-10">
                        {/* Messages Scroll Stream - Cleanly Centered at max-w-3xl */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-7 max-w-3xl mx-auto w-full">
                            {messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div key={msg.id || index} className="w-full">
                                        {isUser ? (
                                            /* User Message: Elegant Right-Aligned Clean Bubble */
                                            <div className="flex justify-end">
                                                <div className="bg-[#f0f1f5] dark:bg-[#1e1e24] text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tr-md px-5 py-3 text-[14.5px] leading-relaxed max-w-xl shadow-xs border border-neutral-200/60 dark:border-white/[0.06] whitespace-pre-wrap font-normal break-words">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Assistant Response: Borderless, Open Typography Flow (Kimi Style) */
                                            <div className="flex flex-col gap-2.5">
                                                {/* Header Row with Dynime Logo & Model Badge */}
                                                <div className="flex items-center gap-2 select-none">
                                                    <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center shadow-xs">
                                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <span className="font-heading font-semibold text-xs text-neutral-900 dark:text-white">
                                                        Dynime AI
                                                    </span>
                                                    {msg.provider && (
                                                        <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/40">
                                                            {msg.provider}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Message Content */}
                                                <div className="pl-8 pr-2">
                                                    {formatAssistantMessage(msg.content)}

                                                    {/* Toolbar: Copy, Retry, Latency */}
                                                    <div className="flex items-center justify-between gap-4 mt-4 pt-2 text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-white/[0.05]">
                                                        <div className="flex items-center gap-2">
                                                            {msg.latency_ms && (
                                                                <span className="flex items-center gap-1 text-neutral-400">
                                                                    <Zap className="w-3 h-3 text-amber-500" />
                                                                    <span>{msg.latency_ms}ms</span>
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                                className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                                title="Copy text"
                                                            >
                                                                {copiedId === msg.id ? (
                                                                    <>
                                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                                        <span className="text-emerald-500 font-medium">Copied</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="w-3 h-3" />
                                                                        <span>Copy</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isGenerating && (
                                <div className="flex items-center gap-3 pl-1">
                                    <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center animate-pulse">
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                        <span>Dynime AI is synthesizing response...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Floating Input Card (In Active Chat) */}
                        <div className="p-4 border-t border-neutral-200/80 dark:border-white/[0.06] bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0c0c0f] dark:via-[#0c0c0f]/95 backdrop-blur-xl flex-shrink-0">
                            <div className="max-w-3xl mx-auto w-full bg-white dark:bg-[#16161b] border border-neutral-200/90 dark:border-white/[0.08] hover:border-purple-500/40 dark:hover:border-purple-500/30 focus-within:border-purple-600 dark:focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/10 dark:focus-within:ring-0 rounded-2xl p-2.5 shadow-lg dark:shadow-2xl transition-all">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 px-1">
                                        {attachments.map((att, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-[11px] text-purple-700 dark:text-purple-300"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <span className="max-w-[120px] truncate">{att.name}</span>
                                                <button onClick={() => removeAttachment(index)} className="hover:text-rose-500 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        disabled={isUploading || isGenerating}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>

                                    <textarea
                                        ref={chatInputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Message Dynime AI..."
                                        rows={1}
                                        className="flex-1 bg-transparent border-none text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-none max-h-32 py-1.5 leading-relaxed"
                                    />

                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/[0.04] hover:bg-neutral-200 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.08]">
                                                    <span>{capabilityLabels[selectedCapability] || 'Instant High'}</span>
                                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-[#191920] border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-xl">
                                                {capabilities.map((cap) => (
                                                    <DropdownMenuItem
                                                        key={cap.id}
                                                        onClick={() => setSelectedCapability(cap.id)}
                                                        className="text-xs cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/60"
                                                    >
                                                        {cap.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <button
                                            type="button"
                                            disabled={!inputValue.trim() || isGenerating}
                                            onClick={handleSendMessage}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                inputValue.trim() && !isGenerating
                                                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 hover:scale-105'
                                                    : 'bg-neutral-200 dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                                            }`}
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-[11px] text-neutral-400 mt-2">
                                Dynime AI can make mistakes. Verify important business and financial data.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
