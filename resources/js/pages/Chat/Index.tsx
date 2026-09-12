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
    ExternalLink,
    CheckCircle2,
    Globe,
    Layers,
    FileSpreadsheet,
    Palette,
    CheckSquare,
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
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

    const filteredConversations = conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const capabilityLabels: Record<string, string> = {
        auto: 'Instant',
        fast: 'Fast ⚡',
        deep_thinking: 'High Reasoning 🧠',
        coding: 'Code Specialist 💻',
        vision: 'Vision & Multimodal 👁️',
        research: 'Deep Research 🔍',
        creative: 'Creative Copy ✨',
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0f0f12] text-[#ececed] font-sans antialiased selection:bg-purple-600 selection:text-white">
            <Head title="Dynime AI - Enterprise Intelligence" />

            {/* Left Kimi-Style Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 md:static flex flex-col w-64 bg-[#141418] border-r border-[#222228] transition-all duration-300 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none'
                }`}
            >
                {/* Brand & Collapse Header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-[#222228]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-600/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-heading font-bold text-base tracking-wide text-white">
                            DYNIME
                        </span>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* + New Chat Button with ⌘K */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#202026] hover:bg-[#282830] border border-white/5 text-white text-xs font-medium transition-colors shadow-sm group"
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform duration-200" />
                            <span>New Chat</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                            ⌘ K
                        </kbd>
                    </button>
                </div>

                {/* Discussions List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <div className="px-2 pt-2 pb-1 text-[11px] font-medium text-neutral-400">
                        Discussions
                    </div>

                    {filteredConversations.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-neutral-400">
                            No chat history yet.
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isActive = activeConv?.uuid === conv.uuid;
                            return (
                                <div
                                    key={conv.uuid}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                        isActive
                                            ? 'bg-purple-950/40 text-purple-200 border border-purple-800/40'
                                            : 'text-neutral-300 hover:bg-[#1f1f25] hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-1">
                                        {conv.is_pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                                        <span className="truncate">{conv.title}</span>
                                    </div>

                                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleTogglePin(e, conv)}
                                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-amber-400"
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
                <div className="p-3 border-t border-[#222228] bg-[#121216]">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <img
                                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6d28d9&color=fff`}
                                    alt={user.name}
                                    className="w-7 h-7 rounded-md object-cover border border-white/10"
                                />
                                <div className="truncate">
                                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                                    <a
                                        href="https://account.dynime.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5"
                                    >
                                        <span>Account Center</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                </div>
                            </div>

                            <button
                                onClick={() => router.post('/logout')}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800"
                                title="Sign out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <a
                            href={ssoLoginUrl}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shadow-sm"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Log in via Dynime Account</span>
                        </a>
                    )}
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col h-full bg-[#0f0f12] overflow-hidden relative">
                {/* Top Nav Bar */}
                <header className="h-14 px-4 flex items-center justify-between border-b border-[#1c1c22] bg-[#0f0f12]/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
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
                            className="text-xs text-neutral-400 hover:text-purple-400 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <span>account.dynime.com</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>

                        {!user && (
                            <a
                                href={ssoLoginUrl}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20"
                            >
                                Log in
                            </a>
                        )}
                    </div>
                </header>

                {/* Content Area */}
                {messages.length === 0 ? (
                    /* KIMI-STYLE HERO CENTER CANVAS */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-3xl mx-auto w-full">
                        {/* Huge KIMI-Style Brand Title */}
                        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-widest text-white mb-8 select-none">
                            DYNIME
                        </h1>

                        {/* Centered Input Card */}
                        <div className="w-full bg-[#1b1b20] border border-white/10 rounded-2xl p-3 shadow-2xl focus-within:border-purple-500/80 transition-all duration-200">
                            {/* Attachments preview */}
                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2 px-1">
                                    {attachments.map((att, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-[11px] text-purple-300"
                                        >
                                            <FileText className="w-3 h-3" />
                                            <span className="max-w-[140px] truncate">{att.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="hover:text-rose-400"
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
                                className="w-full bg-transparent border-none text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none px-2 py-1 leading-relaxed"
                            />

                            {/* Bottom Card Controls */}
                            <div className="flex items-center justify-between pt-2 px-1 border-t border-white/5">
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
                                            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-white/5">
                                                <span>{capabilityLabels[selectedCapability] || 'Instant'}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-[#1a1a20] border-[#2d2d35] text-white">
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

                                    {/* Send Button (Kimi circle with up-arrow) */}
                                    <button
                                        type="button"
                                        disabled={!inputValue.trim() || isGenerating}
                                        onClick={handleSendMessage}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                            inputValue.trim() && !isGenerating
                                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ArrowUp className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Chips (Kimi Style) */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                            {[
                                { id: 'deep_thinking', label: 'Deep Research', icon: Compass },
                                { id: 'coding', label: 'Code Specialist', icon: Code2 },
                                { id: 'research', label: 'Web & Docs', icon: Globe },
                                { id: 'fast', label: 'Instant Chat', icon: Zap },
                                { id: 'creative', label: 'Creative Copy', icon: Palette },
                            ].map((chip) => {
                                const Icon = chip.icon;
                                return (
                                    <button
                                        key={chip.id}
                                        onClick={() => {
                                            setSelectedCapability(chip.id);
                                            if (textareaRef.current) textareaRef.current.focus();
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181c] hover:bg-[#222228] border border-white/5 text-xs text-neutral-300 hover:text-white transition-all shadow-sm"
                                    >
                                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                                        <span>{chip.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* ACTIVE CHAT CANVAS */
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
                            {messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`flex gap-3.5 ${isUser ? 'ml-auto flex-row-reverse max-w-xl' : 'mr-auto max-w-2xl'}`}
                                    >
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                                                isUser
                                                    ? 'bg-neutral-800 text-white'
                                                    : 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                                            }`}
                                        >
                                            {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                        </div>

                                        <div
                                            className={`rounded-2xl p-4 text-xs ${
                                                isUser
                                                    ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/10'
                                                    : 'bg-[#18181c] border border-white/5 text-[#ececed] rounded-tl-none'
                                            }`}
                                        >
                                            <div className="prose-ai whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                                            {!isUser && (
                                                <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-white/5 text-[10px] text-neutral-400">
                                                    <div className="flex items-center gap-2">
                                                        {msg.provider && (
                                                            <span className="uppercase tracking-wider font-semibold text-purple-400">
                                                                {msg.provider}
                                                            </span>
                                                        )}
                                                        {msg.latency_ms && <span>• {msg.latency_ms}ms</span>}
                                                    </div>

                                                    <button
                                                        onClick={() => handleCopy(msg.content, msg.id)}
                                                        className="flex items-center gap-1 p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
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
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {isGenerating && (
                                <div className="flex gap-3 max-w-2xl mr-auto">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-none p-4 bg-[#18181c] border border-white/5 text-xs text-neutral-400 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                        <span>Dynime AI is synthesizing response...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Input Box */}
                        <div className="p-4 border-t border-[#1c1c22] bg-[#0f0f12]/90 backdrop-blur-md">
                            <div className="max-w-3xl mx-auto w-full bg-[#1b1b20] border border-white/10 rounded-xl p-2.5 shadow-lg focus-within:border-purple-500/80">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {attachments.map((att, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-[11px] text-purple-300"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <span className="max-w-[120px] truncate">{att.name}</span>
                                                <button onClick={() => removeAttachment(index)} className="hover:text-rose-400">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-end gap-2">
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
                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </button>

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
                                        placeholder="Message Dynime AI..."
                                        rows={1}
                                        className="flex-1 bg-transparent border-none text-xs text-white placeholder-neutral-500 focus:outline-none resize-none max-h-32 py-1"
                                    />

                                    <button
                                        type="button"
                                        disabled={!inputValue.trim() || isGenerating}
                                        onClick={handleSendMessage}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                            inputValue.trim() && !isGenerating
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
