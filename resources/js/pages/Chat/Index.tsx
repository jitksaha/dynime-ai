import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Sparkles,
    ArrowUp,
    Plus,
    Search,
    Paperclip,
    Trash2,
    Pin,
    Copy,
    Check,
    Bot,
    User as UserIcon,
    Zap,
    Brain,
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
    CheckCircle2,
    Globe,
    Layers,
    FileSpreadsheet,
    Palette,
    Clock,
    Share2,
    RefreshCw,
    Network,
    Lightbulb,
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Helper to format assistant markdown content cleanly
    const formatAssistantMessage = (content: string) => {
        // Simple and clean formatting for bold and code
        const parts = content.split('\n');
        return (
            <div className="space-y-2 text-sm leading-relaxed text-neutral-200">
                {parts.map((paragraph, pIdx) => {
                    if (!paragraph.trim()) {
                        return <div key={pIdx} className="h-1.5" />;
                    }

                    // Headers
                    if (paragraph.startsWith('### ')) {
                        return (
                            <h3 key={pIdx} className="text-base font-semibold text-white mt-3 mb-1">
                                {paragraph.replace('### ', '')}
                            </h3>
                        );
                    }
                    if (paragraph.startsWith('## ')) {
                        return (
                            <h2 key={pIdx} className="text-lg font-bold text-white mt-4 mb-2">
                                {paragraph.replace('## ', '')}
                            </h2>
                        );
                    }

                    // Bullet lists
                    if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                        return (
                            <div key={pIdx} className="flex items-start gap-2 ml-1">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{paragraph.trim().slice(2)}</span>
                            </div>
                        );
                    }

                    return <p key={pIdx}>{paragraph}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0f] text-[#ececed] font-sans antialiased selection:bg-purple-600 selection:text-white">
            <Head title="Dynime AI - Enterprise Intelligence" />

            {/* Left Kimi-Style Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 md:static flex flex-col w-64 bg-[#111115] border-r border-white/[0.06] transition-all duration-300 shadow-2xl md:shadow-none ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none'
                }`}
            >
                {/* Brand & Collapse Header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-600/25">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-heading font-bold text-sm tracking-wider text-white">
                            DYNIME
                        </span>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* + New Chat Button with ⌘K */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] hover:border-purple-500/30 border border-white/[0.07] text-white text-xs font-medium transition-all shadow-sm group"
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform duration-200" />
                            <span>New Chat</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-black/50 border border-white/10 group-hover:text-purple-300">
                            ⌘ K
                        </kbd>
                    </button>
                </div>

                {/* Kimi Menu Navigation List */}
                <div className="px-2 py-1 space-y-0.5 text-xs text-neutral-300">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>My Dynime</span>
                    </button>

                    <button
                        onClick={() => toast.info('Scheduled automated agent tasks are active.')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span>Scheduled Tasks</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('auto');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                        <Network className="w-4 h-4 text-neutral-400" />
                        <span>Swarm</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('creative');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                        <Layers className="w-4 h-4 text-neutral-400" />
                        <span>Slides</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('research');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors"
                    >
                        <Compass className="w-4 h-4 text-neutral-400" />
                        <span>Deep Research</span>
                    </button>

                    {/* Collapse Tools Section */}
                    <button
                        onClick={() => setIsToolsCollapsed(!isToolsCollapsed)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11px] uppercase tracking-wider font-semibold">Workspace</span>
                        </div>
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
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
                            >
                                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Websites</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('vision');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Docs</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('coding');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Sheets</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('deep_thinking');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
                            >
                                <Palette className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Design</span>
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedCapability('coding');
                                    handleNewChat();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
                            >
                                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Dynime Code</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Discussions List */}
                <div className="flex-1 overflow-y-auto px-2 mt-2 space-y-1 border-t border-white/[0.05] pt-2">
                    <div className="px-2 pt-1 pb-1 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                        Recent Chats
                    </div>

                    {conversations.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-neutral-500">
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
                                            ? 'bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-transparent text-purple-200 border-l-2 border-purple-500 font-medium'
                                            : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-1">
                                        {conv.is_pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                                        <span className="truncate">{conv.title}</span>
                                    </div>

                                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleTogglePin(e, conv)}
                                            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-amber-400"
                                            title="Pin"
                                        >
                                            <Pin className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteConversation(e, conv)}
                                            className="p-1 rounded hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400"
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

                {/* Footer User / Account Center */}
                <div className="p-3 border-t border-white/[0.06] bg-[#0f0f13]">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6d28d9&color=fff`}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-white/10"
                                />
                                <div className="truncate">
                                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                                    <a
                                        href="https://account.dynime.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-0.5"
                                    >
                                        <span>Account Center</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                </div>
                            </div>

                            <button
                                onClick={() => router.post('/logout')}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                                title="Sign out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <a
                            href={ssoLoginUrl}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-purple-600/20"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Log in via Dynime Account</span>
                        </a>
                    )}
                </div>
            </aside>

            {/* Main Area with subtle gradient lighting */}
            <main className="flex-1 flex flex-col h-full bg-[#0c0c0f] relative overflow-hidden">
                {/* Subtle Luxury Ambient Radial Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-purple-900/15 via-indigo-900/5 to-transparent blur-3xl pointer-events-none -z-0" />

                {/* Top Nav Bar */}
                <header className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0c0c0f]/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                title="Expand sidebar"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        )}
                        {activeConv && (
                            <span className="text-xs font-medium text-neutral-300 truncate max-w-xs sm:max-w-md">
                                {activeConv.title}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.role === 'admin' && (
                            <>
                                <Link
                                    href="/admin"
                                    className="text-xs text-neutral-400 hover:text-purple-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Admin</span>
                                </Link>
                                <Link
                                    href="/admin/settings"
                                    className="text-xs text-neutral-400 hover:text-purple-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Engines</span>
                                </Link>
                            </>
                        )}

                        <a
                            href="https://account.dynime.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-neutral-400 hover:text-purple-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <span>account.dynime.com</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>

                        {!user && (
                            <a
                                href={ssoLoginUrl}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-purple-600/20 transition-all"
                            >
                                Log in
                            </a>
                        )}
                    </div>
                </header>

                {/* Content Canvas */}
                {messages.length === 0 ? (
                    /* KIMI-STYLE HERO CENTER CANVAS WITH SUBTLE GRADIENT TOUCH */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-3xl mx-auto w-full relative z-10">
                        {/* Huge Bold Title with Subtle Gradient */}
                        <div className="text-center mb-8 select-none">
                            <h1 className="font-heading text-5xl sm:text-6xl font-black tracking-[0.2em] bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent drop-shadow-sm">
                                DYNIME
                            </h1>
                        </div>

                        {/* Centered Input Card with subtle glowing border */}
                        <div className="w-full bg-[#16161b]/95 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/30 focus-within:border-purple-500/50 focus-within:shadow-[0_0_30px_rgba(139,92,246,0.12)] rounded-2xl p-3.5 shadow-2xl transition-all duration-300">
                            {/* Attachments preview */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2 px-1">
                                    {attachments.map((att, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 text-[11px] text-purple-300 shadow-sm"
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span className="max-w-[140px] truncate">{att.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="hover:text-rose-400 transition-colors"
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
                                className="w-full bg-transparent border-none text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none px-2 py-1 leading-relaxed"
                            />

                            {/* Bottom Card Controls */}
                            <div className="flex items-center justify-between pt-3 px-1 border-t border-white/[0.05]">
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
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                                    title="Attach document or file"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Plus className="w-4 h-4" />}
                                </button>

                                <div className="flex items-center gap-2">
                                    {/* Capability Selector Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/[0.08] transition-all">
                                                <span>{capabilityLabels[selectedCapability] || 'Instant High'}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52 bg-[#191920] border-white/10 text-white shadow-xl">
                                            {capabilities.map((cap) => (
                                                <DropdownMenuItem
                                                    key={cap.id}
                                                    onClick={() => setSelectedCapability(cap.id)}
                                                    className="text-xs cursor-pointer hover:bg-purple-950/60 flex items-center justify-between py-2"
                                                >
                                                    <span>{cap.name}</span>
                                                    <span className="text-[10px] text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/30">
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
                                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95'
                                                : 'bg-white/[0.06] text-neutral-500 cursor-not-allowed'
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
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] hover:border-purple-500/40 border border-white/[0.07] text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm hover:shadow-purple-900/10 group"
                                    >
                                        <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-400 transition-colors" />
                                        <span>{chip.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explore Inspiration Bottom Pill (from Screenshot 1) */}
                        <div className="mt-14 flex items-center justify-between px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-neutral-400 w-full max-w-sm">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                <span>Explore inspiration</span>
                            </div>
                            <span className="flex items-center gap-1 text-neutral-400">
                                <span>Scroll to explore</span>
                                <ChevronUp className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE CHAT CANVAS */
                    <div className="flex-1 flex flex-col min-h-0 relative z-10">
                        {/* Messages Scroll Area */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
                            {messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`flex gap-3.5 ${isUser ? 'ml-auto flex-row-reverse max-w-xl' : 'mr-auto max-w-2xl'}`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                                                isUser
                                                    ? 'bg-neutral-800 text-neutral-300 border border-white/10'
                                                    : 'bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                                            }`}
                                        >
                                            {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`rounded-2xl p-4 text-xs transition-all ${
                                                isUser
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-purple-950/30 text-sm leading-relaxed'
                                                    : 'bg-[#15151a]/95 border border-white/[0.08] text-neutral-200 rounded-tl-sm shadow-sm backdrop-blur-md'
                                            }`}
                                        >
                                            {isUser ? (
                                                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                            ) : (
                                                formatAssistantMessage(msg.content)
                                            )}

                                            {!isUser && (
                                                <div className="flex items-center justify-between gap-4 mt-3.5 pt-2.5 border-t border-white/[0.06] text-[10px] text-neutral-400">
                                                    <div className="flex items-center gap-2">
                                                        {msg.provider && (
                                                            <span className="uppercase tracking-wider font-semibold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/30">
                                                                {msg.provider}
                                                            </span>
                                                        )}
                                                        {msg.latency_ms && <span>• {msg.latency_ms}ms</span>}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleCopy(msg.content, msg.id)}
                                                            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                                            title="Copy text"
                                                        >
                                                            {copiedId === msg.id ? (
                                                                <>
                                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                                    <span className="text-emerald-400">Copied</span>
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
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {isGenerating && (
                                <div className="flex gap-3 max-w-2xl mr-auto">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-md shadow-purple-600/30">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-sm p-4 bg-[#15151a]/95 border border-white/[0.08] text-xs text-neutral-400 flex items-center gap-2.5 backdrop-blur-md">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                        <span>Dynime AI is synthesizing response...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Floating Input Box with subtle gradient glow */}
                        <div className="p-4 border-t border-white/[0.06] bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/95 to-transparent backdrop-blur-xl">
                            <div className="max-w-3xl mx-auto w-full bg-[#16161b]/95 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/30 focus-within:border-purple-500/50 focus-within:shadow-[0_0_25px_rgba(139,92,246,0.12)] rounded-2xl p-2.5 shadow-2xl transition-all">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 px-1">
                                        {attachments.map((att, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-[11px] text-purple-300"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <span className="max-w-[120px] truncate">{att.name}</span>
                                                <button onClick={() => removeAttachment(index)} className="hover:text-rose-400 transition-colors">
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
                                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
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
                                        className="flex-1 bg-transparent border-none text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none max-h-32 py-1.5 leading-relaxed"
                                    />

                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/[0.08]">
                                                    <span>{capabilityLabels[selectedCapability] || 'Instant'}</span>
                                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 bg-[#191920] border-white/10 text-white shadow-xl">
                                                {capabilities.map((cap) => (
                                                    <DropdownMenuItem
                                                        key={cap.id}
                                                        onClick={() => setSelectedCapability(cap.id)}
                                                        className="text-xs cursor-pointer hover:bg-purple-950/60"
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
                                                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 hover:scale-105'
                                                    : 'bg-white/[0.06] text-neutral-500 cursor-not-allowed'
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
