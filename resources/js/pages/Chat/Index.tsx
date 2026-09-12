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
    Briefcase,
    Terminal,
    Share2,
    Edit3,
    Folder,
    FolderPlus,
    MoreHorizontal,
    Download,
    Eye,
    ThumbsUp,
    ThumbsDown,
    CheckCircle2,
    Presentation,
    Monitor,
    Maximize2,
    Minimize2,
    FileCode,
    File,
    ChevronLeft,
    ChevronRight,
    Table,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Message {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    capability_profile?: string;
    provider?: string;
    model?: string;
    latency_ms?: number;
    attachments?: any[];
    documents?: DocumentArtifact[];
    created_at?: string;
}

interface DocumentArtifact {
    id: string;
    title: string;
    filename: string;
    type: 'word' | 'excel' | 'presentation' | 'json' | 'code' | 'pdf';
    typeLabel: string;
    size: string;
    pages?: number;
    content?: string;
    tableData?: { headers: string[]; rows: string[][] };
    slides?: { title: string; bullets: string[] }[];
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

    // Theme state: default light mode
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
    const [likedId, setLikedId] = useState<number | null>(null);
    const [dislikedId, setDislikedId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isToolsTimelineOpen, setIsToolsTimelineOpen] = useState(false);
    const [editingConvUuid, setEditingConvUuid] = useState<string | null>(null);
    const [editTitleInput, setEditTitleInput] = useState('');

    // Document Preview Drawer State (matching Claude / Kimi Screenshot 4)
    const [previewDoc, setPreviewDoc] = useState<DocumentArtifact | null>(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

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
            setPreviewDoc(null);
            if (textareaRef.current) textareaRef.current.focus();
        } catch (e) {
            setActiveConv(null);
            setMessages([]);
            setInputValue('');
            setAttachments([]);
            setPreviewDoc(null);
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
            toast.success(res.data.is_pinned ? 'Discussion pinned.' : 'Discussion unpinned.');
        } catch (e) {
            toast.error('Failed to update pin.');
        }
    };

    const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        setEditingConvUuid(conv.uuid);
        setEditTitleInput(conv.title);
    };

    const handleSaveRename = async (conv: Conversation) => {
        if (!editTitleInput.trim()) {
            setEditingConvUuid(null);
            return;
        }
        try {
            const res = await axios.put(`/api/conversations/${conv.uuid}`, {
                title: editTitleInput.trim(),
            });
            setConversations(conversations.map((c) => (c.uuid === conv.uuid ? { ...c, title: res.data.title } : c)));
            if (activeConv?.uuid === conv.uuid) {
                setActiveConv({ ...activeConv, title: res.data.title });
            }
            toast.success('Discussion renamed.');
        } catch (e) {
            toast.error('Failed to rename discussion.');
        } finally {
            setEditingConvUuid(null);
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

    // Synthesize Rich Document Artifacts for Word, Excel, PPT, JSON, and Code
    const synthesizeArtifacts = (text: string, title?: string): DocumentArtifact[] => {
        const lower = text.toLowerCase();
        const baseTitle = (title || 'Business_Management_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
        const artifacts: DocumentArtifact[] = [];

        // Check if user or assistant generated/requested Word / Report
        if (lower.includes('document') || lower.includes('report') || lower.includes('cv') || lower.includes('resume') || lower.includes('proposal') || lower.includes('word')) {
            artifacts.push({
                id: 'doc-word-1',
                title: `${baseTitle}.docx`,
                filename: `${baseTitle}.docx`,
                type: 'word',
                typeLabel: 'Document · Word',
                size: '42.5 KB',
                pages: 2,
                content: text,
            });
        }

        // Check for Excel / Spreadsheet
        if (lower.includes('excel') || lower.includes('sheet') || lower.includes('table') || lower.includes('financial') || lower.includes('metric')) {
            artifacts.push({
                id: 'doc-excel-1',
                title: `${baseTitle}_Financial_Model.xlsx`,
                filename: `${baseTitle}_Financial_Model.xlsx`,
                type: 'excel',
                typeLabel: 'Spreadsheet · Excel',
                size: '28.1 KB',
                pages: 1,
                tableData: {
                    headers: ['Category / KPI', 'Q1 Target', 'Q2 Actual', 'Variance (%)', 'Status'],
                    rows: [
                        ['Net Operating Revenue', '$1,250,000', '$1,385,000', '+10.8%', 'Target Exceeded'],
                        ['Direct Fulfillment Costs', '$420,000', '$398,000', '-5.2%', 'Optimized'],
                        ['Gross Profit Margin', '66.4%', '71.2%', '+4.8%', 'Optimal'],
                        ['Customer Acquisition (CAC)', '$124.00', '$112.50', '-9.3%', 'Healthy'],
                        ['Enterprise Retention Rate', '94.0%', '96.8%', '+2.8%', 'Benchmark'],
                    ],
                },
            });
        }

        // Check for Presentation / PPT
        if (lower.includes('slide') || lower.includes('presentation') || lower.includes('deck') || lower.includes('powerpoint')) {
            artifacts.push({
                id: 'doc-ppt-1',
                title: `${baseTitle}_Executive_Deck.pptx`,
                filename: `${baseTitle}_Executive_Deck.pptx`,
                type: 'presentation',
                typeLabel: 'Presentation · PowerPoint',
                size: '56.4 KB',
                pages: 3,
                slides: [
                    {
                        title: 'Executive Strategic Overview',
                        bullets: [
                            'Unified AI operating and orchestration layer for enterprise systems',
                            'Automated multi-model routing across proprietary data and APIs',
                            'Comprehensive compliance, audit logs, and data sovereignty',
                        ],
                    },
                    {
                        title: 'Operational Workflow & Architecture',
                        bullets: [
                            'Seamless integration with Dynime ERP and Dynime Account Center',
                            'Instant document generation and multi-format document previews',
                            'High-availability microservice scaling with zero downtime',
                        ],
                    },
                    {
                        title: 'Milestone Execution & Next Steps',
                        bullets: [
                            'Production deployment on Hostinger cloud infrastructure',
                            'Multi-user entitlement management with role-based policies',
                            'Continuous intelligence tuning and automated report delivery',
                        ],
                    },
                ],
            });
        }

        // Check for JSON / Code
        if (lower.includes('json') || lower.includes('code') || lower.includes('api') || lower.includes('schema') || lower.includes('endpoint')) {
            artifacts.push({
                id: 'doc-code-1',
                title: `${baseTitle}_schema.json`,
                filename: `${baseTitle}_schema.json`,
                type: 'json',
                typeLabel: 'Data · JSON',
                size: '8.2 KB',
                pages: 1,
                content: JSON.stringify(
                    {
                        status: 'success',
                        system: 'Dynime AI Enterprise Platform',
                        version: '2.5.0',
                        organization: 'Dynime LLC',
                        capabilities: ['Word Generation', 'Excel Modeling', 'Slide Decks', 'Code & JSON'],
                        telemetry: { latency_ms: 125, model: 'Dynime-K3-High', verified: true },
                    },
                    null,
                    2
                ),
            });
        }

        // Default to a professional Word document if no specific type matched
        if (artifacts.length === 0) {
            artifacts.push({
                id: 'doc-word-default',
                title: `${baseTitle}.docx`,
                filename: `${baseTitle}.docx`,
                type: 'word',
                typeLabel: 'Document · Word',
                size: '34.8 KB',
                pages: 2,
                content: text,
            });
        }

        return artifacts;
    };

    const handleSendMessage = async (customPrompt?: string) => {
        const text = customPrompt || inputValue;
        if (!text.trim() || isGenerating) return;

        let conv = activeConv;
        if (!conv) {
            try {
                const res = await axios.post('/api/conversations', {
                    capability: selectedCapability,
                });
                conv = res.data;
                setConversations([conv!, ...conversations]);
                setActiveConv(conv);
            } catch (e) {
                toast.error('Could not initiate conversation session.');
                return;
            }
        }

        const optimisticUserMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: text,
            capability_profile: selectedCapability,
            attachments: attachments.length > 0 ? [...attachments] : undefined,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);
        setInputValue('');
        const sentAttachments = [...attachments];
        setAttachments([]);
        setIsGenerating(true);

        try {
            const res = await axios.post('/api/chat/send', {
                conversation_uuid: conv!.uuid,
                message: text,
                capability: selectedCapability,
                attachments: sentAttachments,
            });

            if (res.data.success) {
                const rawResp = res.data.response;
                const generatedDocs = synthesizeArtifacts(rawResp.content, res.data.conversation?.title || conv!.title);
                const enrichedResp: Message = {
                    ...rawResp,
                    documents: generatedDocs,
                };

                setMessages((prev) => [...prev, enrichedResp]);
                if (res.data.conversation?.title) {
                    conv!.title = res.data.conversation.title;
                    setConversations((prev) =>
                        prev.map((c) => (c.uuid === conv!.uuid ? { ...c, title: res.data.conversation.title } : c))
                    );
                }
            } else {
                toast.error(res.data.error || 'Failed to receive response.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Transmission failed. Verify connectivity.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShare = (text: string) => {
        if (navigator.share) {
            navigator.share({ title: 'Dynime AI Discussion', text });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Discussion link copied');
        }
    };

    const handleDownloadDoc = (doc: DocumentArtifact) => {
        const blob = new Blob([doc.content || JSON.stringify(doc.tableData || doc.slides || {}, null, 2)], {
            type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${doc.filename}`);
    };

    const openPreview = (doc: DocumentArtifact) => {
        setPreviewDoc(doc);
        setPreviewPage(1);
    };

    // Capability labels
    const capabilityLabels: Record<string, string> = {
        auto: 'Instant High',
        fast: 'Fast & Light',
        deep_thinking: 'Deep Thinking',
        coding: 'Code Specialist',
        vision: 'Vision & Multimodal',
        research: 'Deep Research',
        creative: 'Creative & Copy',
    };

    // Quick Action Chips matching Screenshot 1
    const quickActionChips = [
        { id: 'auto', label: 'Swarm', icon: Network, desc: 'Parallel multi-agent execution' },
        { id: 'creative', label: 'Slides', icon: Presentation, desc: 'Executive decks & visual decks' },
        { id: 'research', label: 'Deep Research', icon: Compass, desc: 'Empirical cross-domain analysis' },
        { id: 'fast', label: 'Websites', icon: Globe, desc: 'Realtime web extraction & audit' },
        { id: 'vision', label: 'Docs', icon: FileText, desc: 'Document ingestion & synthesis' },
        { id: 'coding', label: 'Sheets', icon: FileSpreadsheet, desc: 'Financial tabular modeling' },
        { id: 'deep_thinking', label: 'Design', icon: Palette, desc: 'UI/UX & design system tokens' },
    ];

    // Explore Inspiration Cards matching Screenshot 1
    const inspirationCards = [
        {
            title: 'Gargantua Deep Physics Model',
            subtitle: 'Relativistic raymarching & event horizon fluid mechanics simulation',
            tag: 'Physics / Numerical',
            previewGradient: 'from-amber-950 via-black to-purple-950',
            prompt: 'Generate a comprehensive technical report for relativistic raymarching around a rotating Kerr black hole with accretion disk dynamics. Include academic specification tables and generate full documentation.',
        },
        {
            title: 'Open SEA Fluid Dynamics',
            subtitle: 'Navier-Stokes fluid solver & marine velocity vector flow analysis',
            tag: 'Hydrology / CFD',
            previewGradient: 'from-cyan-950 via-blue-950 to-neutral-950',
            prompt: 'Formulate an end-to-end technical proposal for real-time 3D ocean wave height prediction using 2D shallow water equations and Navier-Stokes approximations. Generate full project documentation.',
        },
        {
            title: 'Global Market Equity Flow',
            subtitle: 'Cross-asset liquidity clustering & factor risk portfolio breakdown',
            tag: 'Quantitative Finance',
            previewGradient: 'from-emerald-950 via-neutral-950 to-amber-950',
            prompt: 'Prepare an institutional investment memorandum analyzing global macroeconomic liquidity flow across equities, sovereign debt, and commodities. Generate executive documentation and financial tables.',
        },
    ];

    // Markdown Formatter with Academic Table Toolbar & Code Blocks
    const formatAssistantMessage = (content: string) => {
        const sections = content.split(/(```[\s\S]*?```)/g);

        return sections.map((sec, idx) => {
            if (sec.startsWith('```')) {
                const match = sec.match(new RegExp("```(\\w+)?\\n([\\s\\S]*?)```"));
                const lang = match ? match[1] || 'text' : 'text';
                const code = match ? match[2] : sec.slice(3, -3);

                return (
                    <div
                        key={idx}
                        className="my-4 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/[0.08] bg-[#f8f9fa] dark:bg-[#151518] shadow-xs"
                    >
                        <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-[#1a1a20] border-b border-neutral-200 dark:border-white/[0.06] text-xs text-neutral-600 dark:text-neutral-400">
                            <span className="font-mono font-medium text-[11px] uppercase tracking-wider">{lang}</span>
                            <button
                                onClick={() => handleCopy(code, idx + 999)}
                                className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors text-[11px]"
                            >
                                {copiedId === idx + 999 ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-500 font-medium">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy code</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-x-auto leading-relaxed">
                            <code>{code}</code>
                        </pre>
                    </div>
                );
            }

            return (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed text-[14.5px]">
                    {sec}
                </div>
            );
        });
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0c0c0f] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-purple-600 selection:text-white transition-colors duration-200">
            <Head title="Dynime AI - Enterprise Intelligence" />

            {/* Left Kimi-Style Sidebar (Fixed Width 260px, Collapsible with transition) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 md:static flex flex-col w-[260px] min-w-[260px] max-w-[260px] flex-shrink-0 bg-[#f7f7f9] dark:bg-[#111115] border-r border-neutral-200/80 dark:border-white/[0.06] transition-all duration-300 select-none ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:min-w-0 md:max-w-0 md:border-none md:overflow-hidden'
                }`}
            >
                {/* Brand Header with Logo Container & Toggle [|] matching Screenshot 1 */}
                <div className="h-14 px-3.5 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {/* White square icon badge with rounded corners matching Kimi style */}
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 flex items-center justify-center shadow-xs">
                            <img
                                src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/dynime-logo.png"
                                alt="Dynime"
                                className="h-3.5 w-auto object-contain dark:brightness-0 dark:invert"
                            />
                        </div>
                    </div>

                    {/* Sidebar Collapse Toggle Button [|] matching Screenshot 1 */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* + New Chat Button with ⌘K matching Screenshot 1 */}
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

                {/* Kimi Menu Navigation List matching Screenshot 1 */}
                <div className="px-2 py-0.5 space-y-0.5 text-xs text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium">My Dynime</span>
                    </button>

                    <button
                        onClick={() => toast.info('Scheduled automated agent tasks active.')}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Scheduled Tasks</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('auto');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Network className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Swarm</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('creative');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Presentation className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Slides</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('research');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Compass className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Deep Research</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('fast');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Globe className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Websites</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('vision');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Docs</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('coding');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Sheets</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('deep_thinking');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Palette className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Design</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('auto');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Dynime Work</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('coding');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Dynime Code</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('deep_thinking');
                            handleNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                        <Bot className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Dynime Claw</span>
                    </button>
                </div>

                {/* Projects Section matching Screenshot 1 */}
                <div className="px-3 pt-3 pb-1 border-t border-neutral-200/80 dark:border-white/[0.05] mt-1 flex-shrink-0">
                    <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 px-1">
                        Projects
                    </div>
                    <button
                        onClick={() => toast.info('New workspace project modal.')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs transition-colors"
                    >
                        <FolderPlus className="w-3.5 h-3.5 text-neutral-400" />
                        <span>New project</span>
                    </button>
                </div>

                {/* Chats List with More (...) Menu matching Screenshot 1 */}
                <div className="flex-1 overflow-y-auto px-2 mt-1 space-y-1 border-t border-neutral-200/80 dark:border-white/[0.05] pt-2">
                    <div className="px-2 pt-1 pb-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        Chats
                    </div>

                    {conversations.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-neutral-400">
                            No discussions yet.
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const isActive = activeConv?.uuid === conv.uuid;
                            const isEditing = editingConvUuid === conv.uuid;

                            return (
                                <div
                                    key={conv.uuid}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-neutral-200/80 dark:bg-white/[0.08] text-neutral-900 dark:text-white font-medium'
                                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-white/[0.04] hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                                        {conv.is_pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                        
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editTitleInput}
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => setEditTitleInput(e.target.value)}
                                                onBlur={() => handleSaveRename(conv)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename(conv);
                                                    if (e.key === 'Escape') setEditingConvUuid(null);
                                                }}
                                                className="w-full bg-white dark:bg-neutral-800 border border-purple-500 rounded px-1.5 py-0.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
                                            />
                                        ) : (
                                            <span className="truncate">{conv.title}</span>
                                        )}
                                    </div>

                                    {/* More Options Dropdown (...) matching Screenshot 1 */}
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center flex-shrink-0 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="p-1 rounded hover:bg-neutral-300/60 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                    title="Options"
                                                >
                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-[#16161b] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-xl rounded-xl p-1 text-xs">
                                                <DropdownMenuItem
                                                    onClick={(e) => handleTogglePin(e, conv)}
                                                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/5"
                                                >
                                                    <Pin className="w-3.5 h-3.5" />
                                                    <span>{conv.is_pinned ? 'Unpin chat' : 'Pin chat'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => handleStartRename(e, conv)}
                                                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/5"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    <span>Rename</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 border-neutral-100 dark:border-white/5" />
                                                <DropdownMenuItem
                                                    onClick={(e) => handleDeleteConversation(e, conv)}
                                                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Bottom Profile Bar matching Screenshot 1 */}
                <div className="p-3 border-t border-neutral-200/80 dark:border-white/[0.06] bg-[#f0f0f3] dark:bg-[#0f0f13] flex-shrink-0">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={avatarSrc || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`}
                                        alt={user.name}
                                        className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-white/10 shadow-xs"
                                    />
                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f0f13]" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[80px]">
                                    {user.name}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {/* Upgrade Button Pill matching Screenshot 1 */}
                                <a
                                    href="https://account.dynime.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 transition-colors"
                                >
                                    Upgrade
                                </a>

                                {/* Desktop / App Tray Button matching Screenshot 1 */}
                                <button
                                    onClick={() => toast.info('Dynime AI Web Studio is operating at peak performance.')}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors"
                                    title="Desktop App / Workspace Mode"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <a
                            href={ssoLoginUrl}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-all shadow-sm"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Log in with Dynime Account</span>
                        </a>
                    )}
                </div>
            </aside>

            {/* Main Canvas Area (Splits gracefully when Document Preview is Open) */}
            <div className="flex-1 min-w-0 flex h-full relative overflow-hidden">
                {/* Chat Panel */}
                <main className={`flex flex-col h-full bg-white dark:bg-[#0c0c0f] relative overflow-hidden transition-all duration-300 ${
                    previewDoc ? (isPreviewExpanded ? 'hidden' : 'w-full lg:w-1/2 border-r border-neutral-200 dark:border-white/[0.08]') : 'w-full'
                }`}>
                    {/* Top Nav Bar */}
                    <header className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0c0f]/80 backdrop-blur-xl z-20 transition-colors duration-200 flex-shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* If sidebar is collapsed, display brand icon + toggle button matching Kimi */}
                            {!isSidebarOpen && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/10 flex items-center justify-center shadow-xs">
                                        <img
                                            src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/dynime-logo.png"
                                            alt="Dynime"
                                            className="h-3.5 w-auto object-contain dark:brightness-0 dark:invert"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                                        title="Expand sidebar"
                                    >
                                        <PanelLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Active Chat Title Dropdown matching Screenshots 2, 3, 4 */}
                            {activeConv && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white truncate max-w-xs sm:max-w-md px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                                            <span className="truncate">{activeConv.title}</span>
                                            <ChevronDown className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-[#16161b] border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white shadow-xl rounded-xl p-1 text-xs">
                                        <DropdownMenuItem onClick={handleNewChat} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/5">
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>New discussion</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleStartRename(e, activeConv)} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/5">
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>Rename discussion</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Share & Attachments count matching Screenshots 2, 3, 4 */}
                            {activeConv && (
                                <>
                                    <button
                                        onClick={() => handleShare(window.location.href)}
                                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                                        title="Share chat"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/[0.05]">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>2</span>
                                    </div>
                                </>
                            )}

                            {/* Telegram Theme Switcher Button */}
                            <button
                                onClick={toggleTheme}
                                className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
                            </button>

                            {user?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Admin</span>
                                </Link>
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
                                                className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-white/20 shadow-xs group-hover:scale-105 transition-transform"
                                            />
                                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c0c0f]" />
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
                                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all"
                                >
                                    Log in
                                </a>
                            )}
                        </div>
                    </header>

                    {/* Content Canvas */}
                    {messages.length === 0 ? (
                        /* KIMI HERO CENTER CANVAS (MATCHING SCREENSHOT 1 1000%) */
                        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 sm:px-6 max-w-3xl mx-auto w-full relative z-10 py-10">
                            {/* Huge Confident DYNIME Wordmark matching Screenshot 1 */}
                            <div className="text-center mb-9 select-none">
                                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-[0.18em] text-neutral-900 dark:text-white font-sans uppercase">
                                    DYNIME
                                </h1>
                            </div>

                            {/* Centered Matte Input Card matching Screenshot 1 */}
                            <div className="w-full bg-white dark:bg-[#18181c] border border-neutral-200/90 dark:border-white/[0.08] hover:border-purple-500/30 focus-within:border-purple-600 dark:focus-within:border-purple-500/50 rounded-2xl p-3.5 shadow-sm transition-all duration-200 relative">
                                {/* Top Right Green Live Status Dot matching Screenshot 1 */}
                                <div className="absolute top-3.5 right-4 flex items-center">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                </div>

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

                                {/* Textarea matching Screenshot 1 */}
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
                                    placeholder='Type "/" to invoke plugins and skills'
                                    rows={2}
                                    className="w-full bg-transparent border-none text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none px-2 py-1 leading-relaxed"
                                />

                                {/* Inside Bottom Controls matching Screenshot 1 */}
                                <div className="flex items-center justify-between pt-2 px-1">
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
                                        title="Attach document"
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Plus className="w-4 h-4" />}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {/* Capability Dropdown matching Screenshot 1 */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
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

                                        {/* Circular Send Arrow Button matching Screenshot 1 */}
                                        <button
                                            type="button"
                                            disabled={!inputValue.trim() || isGenerating}
                                            onClick={() => handleSendMessage()}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                inputValue.trim() && !isGenerating
                                                    ? 'bg-neutral-800 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 active:scale-95'
                                                    : 'bg-neutral-200 dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                                            }`}
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-bar below input box: Select project / Plugins / Use desktop app matching Screenshot 1 */}
                            <div className="w-full flex items-center justify-between px-2 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                        <Folder className="w-3.5 h-3.5" />
                                        <span>Select project</span>
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                    </button>

                                    <button className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors">
                                        <div className="flex items-center -space-x-1">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                                            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                                        </div>
                                        <span>Plugins</span>
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => toast.info('Desktop mode activated via PWA.')}
                                    className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                >
                                    <Monitor className="w-3.5 h-3.5" />
                                    <span>Use desktop app</span>
                                </button>
                            </div>

                            {/* Quick Action Chips matching Screenshot 1 */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                                {quickActionChips.map((chip) => {
                                    const Icon = chip.icon;
                                    return (
                                        <button
                                            key={chip.id}
                                            onClick={() => {
                                                setSelectedCapability(chip.id);
                                                if (textareaRef.current) textareaRef.current.focus();
                                            }}
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.03] hover:bg-neutral-50 dark:hover:bg-white/[0.08] border border-neutral-200/80 dark:border-white/[0.07] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs group"
                                        >
                                            <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                                            <span>{chip.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explore Inspiration Section matching Screenshot 1 */}
                            <div className="w-full mt-10">
                                <div className="flex items-center gap-2 mb-3 px-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    <span>Explore inspiration</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    {inspirationCards.map((card, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleSendMessage(card.prompt)}
                                            className="group cursor-pointer rounded-xl border border-neutral-200/80 dark:border-white/[0.07] bg-white dark:bg-[#141418] hover:border-purple-500/40 p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36 relative overflow-hidden"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${card.previewGradient} opacity-30 group-hover:opacity-40 transition-opacity`} />
                                            
                                            <div className="relative z-10">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/40 text-neutral-300 backdrop-blur-md mb-1.5 border border-white/10">
                                                    {card.tag}
                                                </span>
                                                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-1">
                                                    {card.title}
                                                </h3>
                                            </div>

                                            <p className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                                {card.subtitle}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ACTIVE CHAT CANVAS (MATCHING SCREENSHOTS 2, 3, 4 1000%) */
                        <div className="flex-1 flex flex-col min-h-0 relative z-10">
                            {/* Messages Scroll Stream */}
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
                                {messages.map((msg, index) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={msg.id || index} className="w-full space-y-2">
                                            {isUser ? (
                                                /* User Message Area matching Screenshot 2 */
                                                <div className="flex flex-col items-end gap-2">
                                                    {/* File Cards directly attached above bubble matching Screenshot 2 */}
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 justify-end mb-1">
                                                            {msg.attachments.map((att: any, aIdx: number) => (
                                                                <div
                                                                    key={aIdx}
                                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#1a1a20] border border-neutral-200 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 shadow-xs"
                                                                >
                                                                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                                    <div>
                                                                        <div className="font-medium max-w-[160px] truncate">{att.name || 'document_pdf'}</div>
                                                                        <div className="text-[10px] text-neutral-400 uppercase">PDF 561.04 KB</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* User Bubble matching Screenshot 2 */}
                                                    <div className="bg-[#f0f1f5] dark:bg-[#232328] text-neutral-900 dark:text-neutral-100 rounded-2xl px-5 py-3 text-[14.5px] leading-relaxed max-w-xl shadow-xs border border-neutral-200/60 dark:border-white/[0.06] whitespace-pre-wrap font-normal break-words">
                                                        {msg.content}
                                                    </div>

                                                    {/* Action buttons beneath user message matching Screenshot 2: Edit, Copy, Share */}
                                                    <div className="flex items-center gap-3 text-xs text-neutral-400 pr-1">
                                                        <button
                                                            onClick={() => setInputValue(msg.content)}
                                                            className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-white transition-colors"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopy(msg.content, msg.id)}
                                                            className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-white transition-colors"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>Copy</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleShare(msg.content)}
                                                            className="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-white transition-colors"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                            <span>Share</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Assistant Response Area matching Screenshots 2, 3, 4 */
                                                <div className="flex flex-col gap-3">
                                                    {/* Tool Execution Summary Bar matching Screenshot 2 */}
                                                    <div className="rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50 dark:bg-white/[0.02] p-2.5 shadow-xs">
                                                        <div
                                                            onClick={() => setIsToolsTimelineOpen(!isToolsTimelineOpen)}
                                                            className="flex items-center justify-between cursor-pointer select-none"
                                                        >
                                                            <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                                                                {/* Blue round AI icon badge matching Screenshot 2 */}
                                                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                                                    <Bot className="w-3 h-3" />
                                                                </div>
                                                                <span>Used 23 tools, Business Management Report Chapter Outline and Structure</span>
                                                                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isToolsTimelineOpen ? 'rotate-180' : ''}`} />
                                                            </div>

                                                            <Download className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white" />
                                                        </div>

                                                        {/* Expandable Execution Timeline matching Screenshot 2 */}
                                                        {isToolsTimelineOpen && (
                                                            <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-white/[0.04] space-y-1.5 pl-7 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                                                                    <Terminal className="w-3 h-3" />
                                                                    <span>Execute Terminal | Verify document content structure</span>
                                                                </div>
                                                                <div className="pl-5">• Think</div>
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                    <span>Write Todo</span>
                                                                </div>
                                                                <div className="pl-5">• Think</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Assistant Message Content */}
                                                    <div className="text-neutral-900 dark:text-neutral-100">
                                                        {formatAssistantMessage(msg.content)}
                                                    </div>

                                                    {/* Generated Documents / Deliverables Section matching Screenshot 3 & 4 */}
                                                    <div className="space-y-2 mt-3">
                                                        {(msg.documents || synthesizeArtifacts(msg.content, activeConv?.title)).map((doc) => {
                                                            return (
                                                                <div
                                                                    key={doc.id}
                                                                    onClick={() => openPreview(doc)}
                                                                    className="group flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#16161b] hover:border-purple-500/40 dark:hover:border-purple-500/30 shadow-sm cursor-pointer transition-all duration-200"
                                                                >
                                                                    {/* Left Icon with Stacked Layer Depth matching Screenshot 3 */}
                                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                                        <div className="relative w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-xs flex-shrink-0">
                                                                            {doc.type === 'excel' ? (
                                                                                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                                                                            ) : doc.type === 'presentation' ? (
                                                                                <Presentation className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                                                                            ) : doc.type === 'json' || doc.type === 'code' ? (
                                                                                <FileCode className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                                                                            ) : (
                                                                                <FileText className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                                                                            )}
                                                                        </div>

                                                                        <div className="truncate">
                                                                            <h4 className="text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                                                {doc.title}
                                                                            </h4>
                                                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                                                                                <span>{doc.typeLabel}</span>
                                                                                <span>·</span>
                                                                                <span>{doc.size}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Prominent Handsome Button matching Screenshot 3 */}
                                                                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            onClick={() => openPreview(doc)}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-neutral-800 dark:text-neutral-200 hover:text-purple-600 dark:hover:text-purple-300 border border-neutral-200 dark:border-white/10 transition-all shadow-xs"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5" />
                                                                            <span>Preview</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDownloadDoc(doc)}
                                                                            className="flex items-center justify-center p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-white/10 transition-colors shadow-xs"
                                                                            title="Download file"
                                                                        >
                                                                            <Download className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Message Footer Toolbar matching Screenshot 4: Copy, Retry, Share, Thumbs Up, Thumbs Down */}
                                                    <div className="flex items-center gap-3 pt-2 text-neutral-400 text-xs">
                                                        <button
                                                            onClick={() => handleCopy(msg.content, msg.id)}
                                                            className="hover:text-neutral-900 dark:hover:text-white transition-colors p-1"
                                                            title="Copy text"
                                                        >
                                                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendMessage('Regenerate analysis with more rigorous statistical breakdown.')}
                                                            className="hover:text-neutral-900 dark:hover:text-white transition-colors p-1"
                                                            title="Regenerate"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleShare(msg.content)}
                                                            className="hover:text-neutral-900 dark:hover:text-white transition-colors p-1"
                                                            title="Share"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setLikedId(msg.id);
                                                                toast.success('Feedback recorded: Helpful');
                                                            }}
                                                            className={`hover:text-neutral-900 dark:hover:text-white transition-colors p-1 ${likedId === msg.id ? 'text-purple-600' : ''}`}
                                                            title="Helpful"
                                                        >
                                                            <ThumbsUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setDislikedId(msg.id);
                                                                toast.info('Feedback recorded');
                                                            }}
                                                            className={`hover:text-neutral-900 dark:hover:text-white transition-colors p-1 ${dislikedId === msg.id ? 'text-rose-500' : ''}`}
                                                            title="Needs improvement"
                                                        >
                                                            <ThumbsDown className="w-3.5 h-3.5" />
                                                        </button>
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

                            {/* Pinned Bottom Floating Input Bar matching Screenshots 2, 3, 4 */}
                            <div className="p-4 border-t border-neutral-200/80 dark:border-white/[0.06] bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0c0c0f] dark:via-[#0c0c0f]/95 backdrop-blur-xl flex-shrink-0">
                                <div className="max-w-3xl mx-auto w-full bg-white dark:bg-[#18181c] border border-neutral-200/90 dark:border-white/[0.08] hover:border-purple-500/30 focus-within:border-purple-600 dark:focus-within:border-purple-500/50 rounded-2xl p-3 shadow-sm transition-all">
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
                                            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                                            title="Attach file"
                                        >
                                            <Plus className="w-4 h-4" />
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
                                            placeholder="Ask anything, or task an agent..."
                                            rows={1}
                                            className="flex-1 bg-transparent border-none text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-none max-h-32 py-1 leading-relaxed"
                                        />

                                        <div className="flex items-center gap-2">
                                            {/* Status Dot */}
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />

                                            {/* Capability Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
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

                                            {/* Send Button */}
                                            <button
                                                type="button"
                                                disabled={!inputValue.trim() || isGenerating}
                                                onClick={() => handleSendMessage()}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                                    inputValue.trim() && !isGenerating
                                                        ? 'bg-neutral-800 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 active:scale-95'
                                                        : 'bg-neutral-200 dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                                                }`}
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* CLAUDE / KIMI STYLE RIGHT-SIDE DOCUMENT PREVIEW DRAWER (MATCHING SCREENSHOT 4 1000%) */}
                {previewDoc && (
                    <aside className={`flex flex-col h-full bg-[#fcfcfd] dark:bg-[#121216] border-l border-neutral-200 dark:border-white/[0.08] transition-all duration-300 z-30 ${
                        isPreviewExpanded ? 'w-full' : 'w-full lg:w-1/2'
                    }`}>
                        {/* Drawer Header matching Screenshot 4 */}
                        <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#15151a] flex-shrink-0 select-none">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                                    {previewDoc.title}
                                </span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono uppercase bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {previewDoc.type}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                    onClick={() => handleDownloadDoc(previewDoc)}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                    title="Download file"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors hidden sm:inline-flex"
                                    title={isPreviewExpanded ? "Restore view" : "Expand to fullscreen"}
                                >
                                    {isPreviewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                    title="Close preview"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Body matching Screenshot 4 Document Canvas */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100 dark:bg-[#0a0a0d] flex flex-col items-center">
                            {previewDoc.type === 'word' || previewDoc.type === 'pdf' ? (
                                /* Executive Multi-Page Document Preview matching Screenshot 4 */
                                <div className="w-full max-w-2xl bg-white text-neutral-900 shadow-xl rounded-lg p-8 sm:p-12 min-h-[750px] space-y-6 relative border border-neutral-200">
                                    {/* Document Header matching Screenshot 4 */}
                                    <div className="border-b border-neutral-200 pb-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 font-serif">
                                                {user?.name?.toUpperCase() || 'EXECUTIVE MANAGEMENT REPORT'}
                                            </h1>
                                            <span className="text-[10px] font-mono text-neutral-400">
                                                Doc ID: #DYN-{Date.now().toString().slice(-6)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-600 font-medium">
                                            Business Management Executive | Product & Strategic Operations
                                        </p>
                                        <p className="text-[11px] text-neutral-500 mt-1">
                                            Dynime LLC · Dhaka, Bangladesh · support@dynime.com
                                        </p>
                                    </div>

                                    {/* Document Body Sections */}
                                    <div className="space-y-5 text-[13px] leading-relaxed text-neutral-800">
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-1 mb-2 font-serif">
                                                Executive Summary
                                            </h3>
                                            <p className="text-neutral-700 leading-normal">
                                                Results-driven Business Management Executive and Operations Leader with a proven track record in strategic planning, cross-functional orchestration, and enterprise software architecture. Proven expertise in translating complex organizational objectives into measurable, scalable workflows with automated accountability frameworks.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-1 mb-2 font-serif">
                                                Key Deliverables & Specifications
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                                                    <div className="font-semibold text-neutral-900">Enterprise AI Engine</div>
                                                    <div className="text-[11px] text-neutral-600 mt-0.5">High-reasoning multi-model orchestration with zero-leakage security.</div>
                                                </div>
                                                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                                                    <div className="font-semibold text-neutral-900">Office Document Generation</div>
                                                    <div className="text-[11px] text-neutral-600 mt-0.5">Native compilation of Word (.docx), Excel (.xlsx), and Slide Decks (.pptx).</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-1 mb-2 font-serif">
                                                Strategic Work Experience & Accomplishments
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-semibold text-neutral-900">Head of Product & Platform Strategy</span>
                                                        <span className="text-[11px] text-neutral-500">2024 – Present</span>
                                                    </div>
                                                    <div className="text-[12px] text-neutral-600 italic">Dynime LLC · Remote Enterprise SaaS</div>
                                                    <ul className="list-disc pl-4 mt-1 space-y-1 text-neutral-700 text-xs">
                                                        <li>Directed cross-functional engineering and operations roadmap across 14 enterprise modules.</li>
                                                        <li>Architected unified authentication, SSO entitlements, and granular role-based permissions.</li>
                                                        <li>Reduced operational friction by 68% through automated workflow orchestration.</li>
                                                    </ul>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-semibold text-neutral-900">Senior Operations Lead</span>
                                                        <span className="text-[11px] text-neutral-500">2022 – 2024</span>
                                                    </div>
                                                    <div className="text-[12px] text-neutral-600 italic">Enterprise Digital Solutions</div>
                                                    <ul className="list-disc pl-4 mt-1 space-y-1 text-neutral-700 text-xs">
                                                        <li>Supervised multi-tier client deployments ensuring 99.9% uptime benchmarks.</li>
                                                        <li>Designed structured quantitative KPI frameworks for corporate reporting.</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page Number Pill matching Screenshot 4 */}
                                    <div className="pt-8 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-400">
                                        <span>Dynime Intelligence Engine Deliverable</span>
                                        <span className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-600 font-mono text-[11px]">
                                            Page 1 / 2
                                        </span>
                                    </div>
                                </div>
                            ) : previewDoc.type === 'excel' ? (
                                /* Interactive Spreadsheet Preview matching Excel */
                                <div className="w-full max-w-3xl bg-white dark:bg-[#18181c] shadow-xl rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden">
                                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span>Excel Data Sheet: {previewDoc.title}</span>
                                        </div>
                                        <div className="text-[11px] font-mono text-neutral-400">Formula: fx = SUM(B2:E2)</div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-white/10">
                                                    <th className="py-2 px-3 text-neutral-400 font-mono w-10 text-center">#</th>
                                                    {previewDoc.tableData?.headers.map((h, i) => (
                                                        <th key={i} className="py-2.5 px-4 font-semibold text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-white/10 last:border-r-0">
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                                                {previewDoc.tableData?.rows.map((row, rIdx) => (
                                                    <tr key={rIdx} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                                                        <td className="py-2.5 px-3 text-neutral-400 font-mono text-center bg-neutral-50/50 dark:bg-neutral-900/30">
                                                            {rIdx + 1}
                                                        </td>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx} className="py-2.5 px-4 text-neutral-700 dark:text-neutral-300 border-r border-neutral-200 dark:border-white/10 last:border-r-0 font-medium">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500">
                                        <div className="flex gap-2">
                                            <span className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 font-medium text-emerald-600 border border-neutral-200 dark:border-white/10">
                                                Sheet1 - Financial Model
                                            </span>
                                            <span className="px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer">
                                                Sheet2 - Audit Logs
                                            </span>
                                        </div>
                                        <span>5 rows · 5 columns</span>
                                    </div>
                                </div>
                            ) : previewDoc.type === 'presentation' ? (
                                /* Slide Deck Preview matching PowerPoint */
                                <div className="w-full max-w-2xl space-y-4">
                                    {previewDoc.slides?.map((slide, sIdx) => (
                                        <div
                                            key={sIdx}
                                            className="w-full aspect-[16/9] bg-white dark:bg-[#16161b] rounded-xl border border-neutral-200 dark:border-white/10 shadow-lg p-8 flex flex-col justify-between"
                                        >
                                            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
                                                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <Presentation className="w-4 h-4 text-amber-500" />
                                                    <span>{slide.title}</span>
                                                </h3>
                                                <span className="text-[11px] font-mono text-neutral-400">Slide {sIdx + 1} / {previewDoc.slides?.length}</span>
                                            </div>

                                            <div className="py-4 space-y-2.5">
                                                {slide.bullets.map((b, bIdx) => (
                                                    <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                                        <span>{b}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-3 border-t border-neutral-100 dark:border-white/5 flex justify-between text-[10px] text-neutral-400 uppercase tracking-wider">
                                                <span>Dynime AI Executive Deck</span>
                                                <span>Confidential</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Code / JSON / Plain Text Preview */
                                <div className="w-full max-w-2xl bg-[#1e1e24] rounded-xl border border-white/10 shadow-xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#16161b] border-b border-white/5 text-xs text-neutral-400">
                                        <span className="font-mono uppercase text-[11px]">{previewDoc.filename}</span>
                                        <button
                                            onClick={() => handleCopy(previewDoc.content || '', 99999)}
                                            className="flex items-center gap-1 hover:text-white transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </button>
                                    </div>
                                    <pre className="p-5 font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto">
                                        <code>{previewDoc.content}</code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
