import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Sparkles,
    Send,
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
    Code,
    Eye,
    Compass,
    FileText,
    X,
    Loader2,
    PanelLeft,
    PanelLeftClose,
    CheckCircle2,
    RotateCw,
} from 'lucide-react';

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
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeConv, setActiveConv] = useState<Conversation | null>(initial_conversation);
    const [messages, setMessages] = useState<Message[]>(initial_conversation?.messages || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [selectedCapability, setSelectedCapability] = useState<string>(
        initial_conversation?.capability_profile || 'auto'
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isGenerating]);

    // Select conversation
    const handleSelectConversation = async (conv: Conversation) => {
        if (activeConv?.uuid === conv.uuid) return;
        try {
            const res = await axios.get(`/api/conversations/${conv.uuid}`);
            setActiveConv(res.data);
            setMessages(res.data.messages || []);
            setSelectedCapability(res.data.capability_profile || 'auto');
        } catch (e) {
            toast.error('Failed to load discussion history.');
        }
    };

    // Create new conversation
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
            toast.error('Failed to create new discussion.');
        }
    };

    // Pin/Unpin conversation
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
            toast.success(res.data.is_pinned ? 'Conversation pinned' : 'Conversation unpinned');
        } catch (e) {
            toast.error('Could not update pin status.');
        }
    };

    // Delete conversation
    const handleDeleteConversation = async (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this conversation?')) return;
        try {
            await axios.delete(`/api/conversations/${conv.uuid}`);
            const updated = conversations.filter((c) => c.uuid !== conv.uuid);
            setConversations(updated);
            if (activeConv?.uuid === conv.uuid) {
                setActiveConv(updated[0] || null);
                setMessages(updated[0]?.messages || []);
            }
            toast.success('Conversation deleted.');
        } catch (e) {
            toast.error('Failed to delete conversation.');
        }
    };

    // File attachment handler
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
            toast.error(err.response?.data?.message || 'File upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    // Send Message
    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text || isGenerating) return;

        let currentConv = activeConv;

        // If no active conversation, create one
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

                // Update conversation list title
                setConversations((prev) =>
                    prev.map((c) =>
                        c.uuid === currentConv!.uuid
                            ? { ...c, title: res.data.conversation.title, updated_at: new Date().toISOString() }
                            : c
                    )
                );
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to generate response.';
            toast.error(errorMsg);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `⚠️ Connection Error: ${errorMsg}. Please verify AI provider configuration in Admin Settings.`,
                    capability_profile: selectedCapability,
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsGenerating(false);
        }
    };

    // Copy response content
    const handleCopy = (content: string, id: number) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied to clipboard');
    };

    // Filter conversations
    const filteredConversations = conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const capabilityIcons: Record<string, any> = {
        auto: Sparkles,
        fast: Zap,
        deep_thinking: Brain,
        coding: Code,
        vision: Eye,
        research: Compass,
        creative: Sparkles,
    };

    return (
        <AppLayout fullWidth>
            <Head title="Chat & Reasoning - Dynime AI" />

            <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-white dark:bg-slate-950">
                {/* 1. Sidebar */}
                <aside
                    className={`fixed inset-y-14 left-0 z-30 md:static flex flex-col w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 backdrop-blur-md transition-all duration-300 ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none'
                    }`}
                >
                    {/* Top Action / New Chat */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
                        <Button
                            onClick={handleNewChat}
                            className="w-full justify-start gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Discussion</span>
                        </Button>

                        {/* Search input */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-8 rounded-lg text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredConversations.length === 0 ? (
                            <div className="text-center py-8 px-4 text-xs text-slate-400">
                                No discussions found. Start a new chat!
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isActive = activeConv?.uuid === conv.uuid;
                                return (
                                    <div
                                        key={conv.uuid}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`group relative flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                            isActive
                                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-medium border border-purple-200/60 dark:border-purple-800/40'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            {conv.is_pinned && (
                                                <Pin className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                                            )}
                                            <span className="truncate">{conv.title}</span>
                                        </div>

                                        {/* Action Buttons on Hover */}
                                        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={(e) => handleTogglePin(e, conv)}
                                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500"
                                                title={conv.is_pinned ? 'Unpin' : 'Pin'}
                                            >
                                                <Pin className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteConversation(e, conv)}
                                                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600"
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

                    {/* Active Providers Status Footer */}
                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{active_providers.length} Engine{active_providers.length === 1 ? '' : 's'} Online</span>
                        </div>
                        <span className="text-[10px] text-slate-400">DComposer v2</span>
                    </div>
                </aside>

                {/* 2. Main Chat Center Canvas */}
                <main className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-slate-950">
                    {/* Top Capability Selector Bar */}
                    <div className="h-12 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                title="Toggle Sidebar"
                            >
                                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                            </button>

                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                                {activeConv?.title || 'New Discussion'}
                            </span>
                        </div>

                        {/* Capability Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
                            {capabilities.map((cap) => {
                                const Icon = capabilityIcons[cap.id] || Sparkles;
                                const isSelected = selectedCapability === cap.id;
                                return (
                                    <button
                                        key={cap.id}
                                        type="button"
                                        onClick={() => setSelectedCapability(cap.id)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                                            isSelected
                                                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{cap.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white">
                                    Dynime AI Enterprise Studio
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                    Unified multi-model intelligence. Ask complex strategic questions, generate clean code, analyze files, or brainstorm.
                                </p>

                                {/* Quick Starter Chips */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full text-left">
                                    {[
                                        { title: 'Full-Stack Architecture', sub: 'Generate scalable API services', cap: 'coding' },
                                        { title: 'Strategic Analysis', sub: 'Deep reasoning & business intelligence', cap: 'deep_thinking' },
                                        { title: 'Document Synthesis', sub: 'Analyze logs, reports & text data', cap: 'research' },
                                        { title: 'Rapid Automation', sub: 'Concise workflow orchestration', cap: 'fast' },
                                    ].map((starter, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setSelectedCapability(starter.cap);
                                                setInputValue(starter.title + ': ');
                                                if (textareaRef.current) textareaRef.current.focus();
                                            }}
                                            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500/50 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all text-xs"
                                        >
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{starter.title}</p>
                                            <p className="text-[11px] text-slate-500">{starter.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div
                                        key={msg.id || index}
                                        className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                                                isUser
                                                    ? 'bg-slate-800 text-white dark:bg-slate-700'
                                                    : 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                                            }`}
                                        >
                                            {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>

                                        {/* Message Bubble Content */}
                                        <div
                                            className={`group relative rounded-xl p-4 text-xs ${
                                                isUser
                                                    ? 'bg-purple-600 text-white rounded-tr-none'
                                                    : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                                            }`}
                                        >
                                            <div className="prose-ai whitespace-pre-wrap">{msg.content}</div>

                                            {/* Meta & Copy Button */}
                                            {!isUser && (
                                                <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 text-[10px] text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        {msg.provider && (
                                                            <span className="uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-400">
                                                                {msg.provider}
                                                            </span>
                                                        )}
                                                        {msg.latency_ms && <span>• {msg.latency_ms}ms</span>}
                                                    </div>

                                                    <button
                                                        onClick={() => handleCopy(msg.content, msg.id)}
                                                        className="flex items-center gap-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    >
                                                        {copiedId === msg.id ? (
                                                            <>
                                                                <Check className="w-3 h-3 text-emerald-500" />
                                                                <span className="text-emerald-500">Copied</span>
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
                            })
                        )}

                        {/* Generating indicator */}
                        {isGenerating && (
                            <div className="flex gap-3 max-w-3xl mr-auto">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="rounded-xl rounded-tl-none p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                    <span>Dynime AI is synthesizing response...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Composer Box */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                        {/* Attachments preview */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map((att, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-300"
                                    >
                                        <FileText className="w-3 h-3" />
                                        <span className="max-w-[150px] truncate">{att.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="hover:text-rose-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 focus-within:border-purple-500 transition-colors">
                            {/* Attach File Button */}
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
                                className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                title="Attach Document or File"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                            </button>

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
                                placeholder="Message Dynime AI (Shift+Enter for newline)..."
                                rows={1}
                                className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 resize-none max-h-36 py-1.5"
                            />

                            {/* Send Button */}
                            <Button
                                type="button"
                                size="sm"
                                disabled={!inputValue.trim() || isGenerating}
                                onClick={handleSendMessage}
                                className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white h-8 px-3"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
