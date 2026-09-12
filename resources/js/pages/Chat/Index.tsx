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
    ChevronRight,
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
    Table,
    Mic,
    Volume2,
    Radio,
    Camera,
    TrendingUp,
    Scale,
    Database,
    Building2,
    Server,
    Mail,
    FolderGit2,
    GitBranch,
    AlertTriangle,
    Search,
    SlidersHorizontal,
    Settings,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Claude's signature warm terracotta sunburst/asterisk spinning animation (matching Screenshot 2)
function ClaudeAsterisk({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} animate-spin text-[#d97757] dark:text-[#cc785c]`}
            style={{ animationDuration: '3.5s' }}
        >
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <path
                d="M12 2.5v3.5M12 18v3.5M2.5 12h3.5M18 12h3.5M5.28 5.28l2.47 2.47M16.25 16.25l2.47 2.47M5.28 18.72l2.47-2.47M16.25 7.75l2.47-2.47"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

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

interface AvailableModel {
    id: string;
    name: string;
    provider: string;
    badge: string;
    description: string;
}

interface EssentialSkill {
    id: string;
    name: string;
    icon: string;
    description: string;
    badge: string;
}

interface ConnectorItem {
    id: string;
    name: string;
    icon: string;
    status: 'connected' | 'needs_config';
    badge: string;
    description: string;
}

interface PluginItem {
    id: string;
    name: string;
    icon: string;
    active: boolean;
    description: string;
}

interface Props {
    conversations: Conversation[];
    initial_conversation: Conversation | null;
    active_providers: Provider[];
    available_models?: AvailableModel[];
    capabilities: Capability[];
    essential_skills?: EssentialSkill[];
    connectors?: ConnectorItem[];
    plugins?: PluginItem[];
}

const DEFAULT_MODELS: AvailableModel[] = [
    {
        id: 'dcomposer',
        name: 'DComposer',
        provider: 'dcomposer',
        badge: 'Default',
        description: 'Unified multi-model enterprise orchestrator (Auto-routing)',
    },
    {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        provider: 'claude',
        badge: 'Hybrid Reasoning',
        description: 'Anthropic hybrid reasoning & architecture design',
    },
    {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'claude',
        badge: 'Coding Leader',
        description: 'Anthropic high-speed coding & analysis',
    },
    {
        id: 'deepseek-chat',
        name: 'DeepSeek V3',
        provider: 'deepseek',
        badge: 'Fast Flagship',
        description: 'State-of-the-art open conversational intelligence',
    },
    {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1',
        provider: 'deepseek',
        badge: 'Deep Reasoning',
        description: 'Mathematical, algorithmic & causal reasoning',
    },
    {
        id: 'gemini-3.6-flash',
        name: 'Gemini 3.6 Flash',
        provider: 'gemini',
        badge: 'Next-Gen Fast',
        description: 'Google multimodal 1M+ token context',
    },
    {
        id: 'gpt-4o',
        name: 'OpenAI GPT-4o',
        provider: 'openai',
        badge: 'Omni',
        description: 'OpenAI omni multimodal flagship',
    },
    {
        id: 'llama-3.3-70b-versatile',
        name: 'Groq Llama 3.3',
        provider: 'groq',
        badge: '⚡ Instant LPU',
        description: 'Sub-second real-time token generation',
    },
    {
        id: 'glm-5.2',
        name: 'Zai GLM-5.2',
        provider: 'zai',
        badge: 'Cognitive',
        description: 'Bilingual cognitive reasoning engine',
    },
];

const DEFAULT_SKILLS: EssentialSkill[] = [
    {
        id: 'financial_analyst',
        name: 'Financial Analyst',
        icon: 'TrendingUp',
        description: 'Institutional DCF, P&L, balance-sheet hygiene & valuation models',
        badge: 'Finance',
    },
    {
        id: 'code_specialist',
        name: 'Code Reviewer & Architect',
        icon: 'Code2',
        description: 'Production clean code, TypeScript, PHP, microservices & refactoring',
        badge: 'Dev',
    },
    {
        id: 'legal_auditor',
        name: 'Legal & Contract Auditor',
        icon: 'ShieldCheck',
        description: 'Compliance, MSA agreements, SLAs, liability & NDA risk analysis',
        badge: 'Legal',
    },
    {
        id: 'sql_analyst',
        name: 'SQL & Data Architect',
        icon: 'Database',
        description: 'Schema design, index tuning, star queries & execution plans',
        badge: 'Data',
    },
    {
        id: 'executive_memo',
        name: 'Executive Memo Drafter',
        icon: 'FileSpreadsheet',
        description: 'Board-level memos, strategic theses, operational milestones',
        badge: 'C-Suite',
    },
    {
        id: 'deep_research',
        name: 'Deep Research Agent',
        icon: 'Compass',
        description: 'Multi-source empirical research, market trends & synthesized briefs',
        badge: 'Research',
    },
];

const DEFAULT_CONNECTORS: ConnectorItem[] = [
    {
        id: 'erp_db',
        name: 'ERP Go Database',
        icon: 'Building2',
        status: 'connected',
        badge: 'Live Connected',
        description: 'Real-time synchronization with ERP entities and CRM accounts',
    },
    {
        id: 'hostinger_server',
        name: 'Hostinger Cloud Infrastructure',
        icon: 'Server',
        status: 'connected',
        badge: 'Live Connected',
        description: 'Direct SSH/SFTP deployment and log monitoring pipeline',
    },
    {
        id: 'smtp_mail',
        name: 'Corporate Email / SMTP',
        icon: 'Mail',
        status: 'connected',
        badge: 'Active',
        description: 'Outbound notification and report dissemination pipeline',
    },
    {
        id: 'google_workspace',
        name: 'Google Workspace',
        icon: 'FolderGit2',
        status: 'needs_config',
        badge: 'Ready to Connect',
        description: 'Direct Drive, Docs, and Sheets integration',
    },
    {
        id: 'github_enterprise',
        name: 'GitHub Enterprise',
        icon: 'GitBranch',
        status: 'needs_config',
        badge: 'Ready to Connect',
        description: 'Repository sync, pull request analysis, and CI/CD triggers',
    },
];

const DEFAULT_PLUGINS: PluginItem[] = [
    {
        id: 'excel_engine',
        name: 'Excel Spreadsheet Engine',
        icon: 'FileSpreadsheet',
        active: true,
        description: 'Generates native .xlsx workbooks with multi-tab financial models',
    },
    {
        id: 'pdf_builder',
        name: 'PDF Document Builder',
        icon: 'FileText',
        active: true,
        description: 'Compiles executive documents and publication-ready memos',
    },
    {
        id: 'python_sandbox',
        name: 'Python Analytics Sandbox',
        icon: 'Terminal',
        active: true,
        description: 'Executes quantitative data modeling and regression scripts',
    },
    {
        id: 'diagram_architect',
        name: 'SVG Diagram Architect',
        icon: 'Layers',
        active: true,
        description: 'Renders interactive architecture, flowcharts, and sequence maps',
    },
];

export default function ChatIndex({
    conversations: initialConversations = [],
    initial_conversation = null,
    active_providers = [],
    available_models = DEFAULT_MODELS,
    capabilities = [],
    essential_skills = DEFAULT_SKILLS,
    connectors = DEFAULT_CONNECTORS,
    plugins = DEFAULT_PLUGINS,
}: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeConv, setActiveConv] = useState<Conversation | null>(initial_conversation);
    const [messages, setMessages] = useState<Message[]>(initial_conversation?.messages || []);
    const [inputValue, setInputValue] = useState('');
    const [selectedCapability, setSelectedCapability] = useState<string>(
        initial_conversation?.capability_profile || 'auto'
    );
    
    // Model Selector State (Default: DComposer)
    const [selectedModel, setSelectedModel] = useState<string>('dcomposer');
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

    // Claude '+' Popover Menu State
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [plusSubmenu, setPlusSubmenu] = useState<'project' | 'skills' | 'connectors' | 'plugins' | null>(null);
    const [activeSkills, setActiveSkills] = useState<string[]>([]);
    const [isWebSearchActive, setIsWebSearchActive] = useState(false);

    // Skills & Connectors Settings Modal
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [skillsModalTab, setSkillsModalTab] = useState<'skills' | 'connectors' | 'plugins'>('skills');

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

    // Document Preview Drawer State
    const [previewDoc, setPreviewDoc] = useState<DocumentArtifact | null>(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const plusMenuRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    // Initialize Theme
    useEffect(() => {
        const savedTheme = (localStorage.getItem('dynime_ai_theme') as 'light' | 'dark') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
        localStorage.setItem('dynime_ai_theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Close popovers on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setIsPlusMenuOpen(false);
                setPlusSubmenu(null);
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
                setIsModelSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    // Keyboard shortcut ⌘K for new chat, ⌘U for upload
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                handleNewChat();
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                fileInputRef.current?.click();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Load active conversation messages when URL or activeConv changes
    const handleSelectConversation = async (conv: Conversation) => {
        setActiveConv(conv);
        setSelectedCapability(conv.capability_profile || 'auto');
        try {
            const res = await axios.get(`/api/conversations/${conv.uuid}`);
            setMessages(res.data.messages || []);
            router.get('/chat', { c: conv.uuid }, { preserveState: true, replace: true });
        } catch (e) {
            toast.error('Could not load discussion history.');
        }
    };

    const handleNewChat = () => {
        setActiveConv(null);
        setMessages([]);
        setInputValue('');
        setAttachments([]);
        setPreviewDoc(null);
        setIsPlusMenuOpen(false);
        router.get('/chat', {}, { preserveState: true, replace: true });
    };

    const toggleSkill = (skillId: string) => {
        if (activeSkills.includes(skillId)) {
            setActiveSkills(activeSkills.filter(id => id !== skillId));
            toast.info(`Skill removed: ${essential_skills.find(s => s.id === skillId)?.name || skillId}`);
        } else {
            setActiveSkills([...activeSkills, skillId]);
            toast.success(`Skill attached: ${essential_skills.find(s => s.id === skillId)?.name || skillId}`);
        }
    };

    // Send Message with Model, Skills and Web Search
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
            model: selectedModel,
            attachments: attachments.length > 0 ? [...attachments] : undefined,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);
        setInputValue('');
        const sentAttachments = [...attachments];
        setAttachments([]);
        setIsGenerating(true);
        setIsPlusMenuOpen(false);

        try {
            const res = await axios.post('/api/chat/send', {
                conversation_uuid: conv!.uuid,
                message: text,
                capability: selectedCapability,
                model: selectedModel,
                skills: activeSkills,
                web_search: isWebSearchActive,
                attachments: sentAttachments,
            });

            if (res.data.success) {
                const resp = res.data.response;
                const assistantMessage: Message = {
                    id: resp.id,
                    role: 'assistant',
                    content: resp.content,
                    capability_profile: resp.capability_profile || selectedCapability,
                    provider: resp.provider,
                    model: resp.model,
                    latency_ms: resp.latency_ms,
                    created_at: resp.created_at || new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);

                // Update conversation title in list if updated
                if (res.data.conversation?.title && conv) {
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.uuid === conv!.uuid ? { ...c, title: res.data.conversation.title } : c
                        )
                    );
                }
            } else {
                toast.error(res.data.error || 'Server encountered an unexpected condition.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Server Error. Please try again.';
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const res = await axios.post('/api/chat/attachments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAttachments((prev) => [...prev, res.data]);
            toast.success(`Attached ${files[0].name}`);
        } catch (err) {
            toast.error('File attachment failed. Max size 15MB.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShare = (text: string) => {
        if (navigator.share) {
            navigator.share({ title: 'Dynime AI Output', text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Share link copied to clipboard');
        }
    };

    const handleSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
            toast.info('Reading message aloud...');
        } else {
            toast.error('Text-to-speech not supported on this browser.');
        }
    };

    const handleTakeScreenshot = () => {
        toast.info('Press ⌘ + Shift + 4 (Mac) or Win + Shift + S (Windows) to capture and paste directly into chat!');
        setIsPlusMenuOpen(false);
    };

    const formatTimestamp = (dateStr?: string) => {
        if (!dateStr) return 'Just now';
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
            if (diffMin < 1) return 'Just now';
            if (diffMin < 60) return `${diffMin}m ago`;
            const diffHours = Math.floor(diffMin / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${Math.floor(diffHours / 24)}d ago`;
        } catch (e) {
            return 'Recently';
        }
    };

    const currentModelObj = available_models.find(m => m.id === selectedModel) || available_models[0];

    return (
        <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'dark bg-[#141413] text-neutral-100' : 'bg-[#fafaf8] text-neutral-900'} font-sans`}>
            <Head title="Dynime AI - Enterprise Intelligence" />

            {/* LEFT SIDEBAR (Collapsible) */}
            <aside
                className={`flex flex-col h-full border-r transition-all duration-300 z-20 flex-shrink-0 ${
                    theme === 'dark'
                        ? 'bg-[#181817] border-[#2c2b28] text-neutral-200'
                        : 'bg-[#f4f4f0] border-[#e2e1dc] text-neutral-800'
                } ${isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full overflow-hidden'}`}
            >
                {/* Sidebar Header */}
                <div className="h-14 px-3 flex items-center justify-between border-b border-inherit select-none">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#d97757] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            D
                        </div>
                        <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">
                            Dynime AI
                        </span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150 bg-white dark:bg-[#232220] border-neutral-200 dark:border-[#383734] hover:border-neutral-300 dark:hover:border-neutral-600 shadow-sm text-neutral-800 dark:text-neutral-200 hover:shadow"
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-[#d97757]" />
                            <span>New discussion</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">⌘K</span>
                    </button>
                </div>

                {/* Discussions List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-0.5 select-none">
                    <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        Recent Discussions
                    </div>

                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-400">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map((c) => {
                            const isActive = activeConv?.uuid === c.uuid;
                            return (
                                <div
                                    key={c.uuid}
                                    onClick={() => handleSelectConversation(c)}
                                    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                        isActive
                                            ? 'bg-neutral-200/70 dark:bg-white/10 font-medium text-neutral-900 dark:text-white'
                                            : 'hover:bg-neutral-200/40 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                    <span className="truncate pr-2">{c.title || 'Untitled Discussion'}</span>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#d97757] flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Footer: Settings & Profile */}
                <div className="p-3 border-t border-inherit space-y-1">
                    <button
                        onClick={() => setIsSkillsModalOpen(true)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-neutral-300"
                    >
                        <div className="flex items-center gap-2">
                            <Sliders className="w-3.5 h-3.5 text-[#d97757]" />
                            <span>Skills & Connectors</span>
                        </div>
                        {activeSkills.length > 0 && (
                            <span className="text-[10px] bg-[#d97757]/20 text-[#d97757] font-semibold px-1.5 py-0.2 rounded">
                                {activeSkills.length}
                            </span>
                        )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="text-xs truncate max-w-[110px] font-medium">
                                {user?.name || 'Enterprise User'}
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 transition-colors"
                            title="Toggle Light / Dark theme"
                        >
                            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT WORKSPACE */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Minimal Header */}
                <header className="h-12 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-[#272624] select-none flex-shrink-0 bg-inherit">
                    <div className="flex items-center gap-2">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-colors mr-1"
                                title="Open sidebar"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        )}
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            {activeConv?.title || 'New Discussion'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/settings"
                            className="p-1.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors text-xs flex items-center gap-1.5"
                            title="Admin AI Settings"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Settings</span>
                        </Link>
                    </div>
                </header>

                {/* Messages Body */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-3xl mx-auto w-full">
                    {messages.length === 0 ? (
                        /* Empty State: Claude Warm Centerpiece */
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
                            <div className="w-12 h-12 rounded-2xl bg-[#d97757]/15 text-[#d97757] flex items-center justify-center mb-4 shadow-sm">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-serif text-neutral-900 dark:text-white font-medium mb-2">
                                Good afternoon, {user?.name?.split(' ')[0] || 'Partner'}.
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-md">
                                Where should we direct our intelligence today? Select models, enterprise skills, or analyze deep operational data.
                            </p>

                            {/* Quick Starter Chips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                                {[
                                    { title: 'Draft Executive Strategy Memo', icon: '📝', prompt: 'Draft an institutional executive strategy memorandum outlining 2026 enterprise cloud scaling, capital allocation, and risk guardrails.' },
                                    { title: 'Analyze Corporate Financial Model', icon: '📊', prompt: 'Perform a rigorous three-statement financial breakdown with EBITDA bridge, working capital dynamics, and valuation sensitivity tables.' },
                                    { title: 'Full-Stack Architecture Review', icon: '💻', prompt: 'Review our enterprise Laravel & React micro-frontend architecture for multi-tenant isolation, caching, and database index tuning.' },
                                    { title: 'Contract Compliance & Risk Audit', icon: '⚖️', prompt: 'Audit enterprise Master Services Agreement (MSA) clauses regarding data sovereignty, indemnification caps, and SLA compliance.' },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(item.prompt)}
                                        className="p-3 rounded-xl border border-neutral-200 dark:border-[#2f2e2b] bg-white dark:bg-[#1b1a18] hover:border-[#d97757]/50 dark:hover:border-[#d97757]/50 transition-all text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5 text-left shadow-sm hover:shadow"
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <div>
                                            <div className="font-medium text-neutral-900 dark:text-white">{item.title}</div>
                                            <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{item.prompt}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={msg.id || index} className="w-full space-y-2">
                                    {isUser ? (
                                        /* User Message (Right-aligned / rounded bubble) */
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="max-w-2xl px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-[#252422] border border-neutral-200/80 dark:border-[#33322f] text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap">
                                                {msg.content}
                                            </div>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {msg.attachments.map((att: any, aIdx: number) => (
                                                        <span key={aIdx} className="inline-flex items-center gap-1 text-[10px] bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 px-2 py-0.5 rounded text-neutral-500">
                                                            <FileText className="w-3 h-3" />
                                                            {att.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Assistant Message (Left-aligned Claude clean styling) */
                                        <div className="flex flex-col items-start gap-1 w-full">
                                            {/* Assistant Identity Header */}
                                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 mb-1">
                                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                    Dynime AI
                                                </span>
                                                {msg.model && (
                                                    <span className="font-mono text-[10px] bg-neutral-100 dark:bg-white/5 px-1.5 py-0.2 rounded text-neutral-400">
                                                        {msg.model}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Message Content */}
                                            <div className="w-full text-neutral-900 dark:text-neutral-100 text-[14.5px] leading-relaxed prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap">
                                                {msg.content}
                                            </div>

                                            {/* Claude Document Card (Matching Screenshot 2) */}
                                            {msg.content.toLowerCase().includes('document') || msg.content.toLowerCase().includes('table') || msg.content.toLowerCase().includes('memo') ? (
                                                <div className="mt-3 w-full max-w-lg p-3 rounded-xl border border-neutral-200 dark:border-[#383734] bg-white dark:bg-[#1a1917] flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-[#252422] border border-neutral-200 dark:border-[#383734] flex items-center justify-center text-neutral-500 dark:text-neutral-300 flex-shrink-0">
                                                            <FileText className="w-4 h-4 text-[#d97757]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                                                                {activeConv?.title || 'Executive Analysis & Tables'}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-400">
                                                                Document • Executive Report • Markdown
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setPreviewDoc({
                                                                    id: 'doc-1',
                                                                    title: activeConv?.title || 'Executive Analysis',
                                                                    filename: 'executive_analysis.md',
                                                                    type: 'word',
                                                                    typeLabel: 'Document • Word',
                                                                    size: '24 KB',
                                                                    content: msg.content,
                                                                });
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-200 dark:border-[#383734] hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-700 dark:text-neutral-300"
                                                        >
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const blob = new Blob([msg.content], { type: 'text/markdown' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `${activeConv?.title || 'analysis'}.md`;
                                                                a.click();
                                                                toast.success('Document downloaded');
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-all flex items-center gap-1"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Action Toolbar matching Screenshot 2: Copy, Speak, Thumbs Up, Thumbs Down, Retry, Timestamp */}
                                            <div className="flex items-center gap-1 mt-3 pt-1 text-neutral-400 dark:text-neutral-500 text-xs select-none">
                                                <button
                                                    onClick={() => handleCopy(msg.content, msg.id)}
                                                    className="p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                    title="Copy response"
                                                >
                                                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleSpeak(msg.content)}
                                                    className="p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                    title="Read aloud"
                                                >
                                                    <Volume2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleSendMessage(messages[index - 1]?.content || 'Regenerate')}
                                                    className="p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                    title="Retry / Regenerate"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleShare(msg.content)}
                                                    className="p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                                    title="Share response"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setLikedId(likedId === msg.id ? null : msg.id)}
                                                    className={`p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors ${likedId === msg.id ? 'text-emerald-500' : 'hover:text-neutral-900 dark:hover:text-white'}`}
                                                    title="Good response"
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDislikedId(dislikedId === msg.id ? null : msg.id)}
                                                    className={`p-1.5 rounded hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors ${dislikedId === msg.id ? 'text-rose-500' : 'hover:text-neutral-900 dark:hover:text-white'}`}
                                                    title="Bad response"
                                                >
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Timestamp matching Screenshot 2 */}
                                                <span className="ml-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                                                    {formatTimestamp(msg.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Claude Rotating Sunburst/Asterisk while Thinking (Screenshot 2) */}
                    {isGenerating && (
                        <div className="flex items-center gap-3 py-2 pl-1">
                            <ClaudeAsterisk className="w-6 h-6" />
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </main>

                {/* BOTTOM PROMPT & MODEL SELECTOR AREA (Screenshots 2 & 3) */}
                <div className="p-4 flex-shrink-0 bg-inherit border-t border-transparent">
                    <div className="max-w-3xl mx-auto w-full space-y-2">
                        {/* Prompt Input Container */}
                        <div className="relative w-full rounded-2xl border border-neutral-300/80 dark:border-[#363532] bg-white dark:bg-[#1f1e1d] shadow-sm focus-within:border-neutral-400 dark:focus-within:border-[#4d4c48] transition-all">
                            {/* Active Skills & Web Search Badge Bar */}
                            {(activeSkills.length > 0 || isWebSearchActive || attachments.length > 0) && (
                                <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 pb-1 border-b border-neutral-100 dark:border-[#2b2a28]">
                                    {isWebSearchActive && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded-md">
                                            <Globe className="w-3 h-3 text-sky-500" />
                                            Web Search Active
                                            <button onClick={() => setIsWebSearchActive(false)} className="hover:text-sky-900 dark:hover:text-white ml-0.5">
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    )}

                                    {activeSkills.map((sId) => {
                                        const s = essential_skills.find((item) => item.id === sId);
                                        return (
                                            <span key={sId} className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#d97757]/10 dark:bg-[#d97757]/20 text-[#d97757] border border-[#d97757]/30 px-2 py-0.5 rounded-md">
                                                <Zap className="w-3 h-3" />
                                                {s?.name || sId}
                                                <button onClick={() => toggleSkill(sId)} className="hover:text-rose-500 ml-0.5">
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        );
                                    })}

                                    {attachments.map((att, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-[11px] text-neutral-600 dark:text-neutral-300"
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

                            {/* Main Input Row */}
                            <div className="flex items-center gap-2 p-2.5">
                                {/* '+' Button Anchoring the Claude Popover Menu */}
                                <div className="relative" ref={plusMenuRef}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                        title="Attach, skills, and tools"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>

                                    {/* CLAUDE '+' FLOATING MENU (Screenshot 3 Matching 100%) */}
                                    {isPlusMenuOpen && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#232220] text-neutral-200 border border-[#383734] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                                            {/* Add files or photos */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsPlusMenuOpen(false);
                                                    fileInputRef.current?.click();
                                                }}
                                                className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Paperclip className="w-4 h-4 text-neutral-400" />
                                                    <span>Add files or photos</span>
                                                </div>
                                                <span className="text-[10px] text-neutral-400 font-mono">⌘ U</span>
                                            </button>

                                            {/* Take a screenshot */}
                                            <button
                                                type="button"
                                                onClick={handleTakeScreenshot}
                                                className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-white/10 transition-colors text-left"
                                            >
                                                <Camera className="w-4 h-4 text-neutral-400" />
                                                <span>Take a screenshot</span>
                                            </button>

                                            {/* Add to project */}
                                            <div
                                                className="relative group"
                                                onMouseEnter={() => setPlusSubmenu('project')}
                                                onMouseLeave={() => setPlusSubmenu(null)}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <FolderPlus className="w-4 h-4 text-neutral-400" />
                                                        <span>Add to project</span>
                                                    </div>
                                                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                                </button>

                                                {/* Project Flyout Submenu (Screenshot 3) */}
                                                {plusSubmenu === 'project' && (
                                                    <div className="absolute left-full top-0 ml-1.5 w-60 bg-[#232220] border border-[#383734] rounded-xl shadow-2xl p-2 z-50">
                                                        <div className="text-[11px] text-neutral-400 px-2 py-1">
                                                            Search or create a project
                                                        </div>
                                                        <div className="text-xs text-neutral-500 px-2 py-2">
                                                            No projects yet
                                                        </div>
                                                        <div className="border-t border-[#383734] my-1" />
                                                        <button
                                                            onClick={() => {
                                                                toast.info('Projects feature active: created workspace root.');
                                                                setIsPlusMenuOpen(false);
                                                            }}
                                                            className="w-full px-2 py-1.5 rounded-md text-xs text-left hover:bg-white/10 flex items-center gap-2 text-neutral-200"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Start a new project</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Skills with flyout submenu */}
                                            <div
                                                className="relative group"
                                                onMouseEnter={() => setPlusSubmenu('skills')}
                                                onMouseLeave={() => setPlusSubmenu(null)}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Zap className="w-4 h-4 text-[#d97757]" />
                                                        <span>Skills</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {activeSkills.length > 0 && (
                                                            <span className="text-[10px] bg-[#d97757]/20 text-[#d97757] px-1.5 py-0.2 rounded font-semibold">
                                                                {activeSkills.length}
                                                            </span>
                                                        )}
                                                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                                    </div>
                                                </button>

                                                {/* Skills Submenu */}
                                                {plusSubmenu === 'skills' && (
                                                    <div className="absolute left-full top-0 ml-1.5 w-64 bg-[#232220] border border-[#383734] rounded-xl shadow-2xl p-1.5 z-50">
                                                        <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                                                            Essential Enterprise Skills
                                                        </div>
                                                        <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                                            {essential_skills.map((skill) => {
                                                                const isChecked = activeSkills.includes(skill.id);
                                                                return (
                                                                    <button
                                                                        key={skill.id}
                                                                        type="button"
                                                                        onClick={() => toggleSkill(skill.id)}
                                                                        className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between text-left transition-colors ${
                                                                            isChecked ? 'bg-white/10 text-white font-medium' : 'hover:bg-white/5 text-neutral-300'
                                                                        }`}
                                                                    >
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span>{skill.name}</span>
                                                                                <span className="text-[9px] bg-white/10 text-neutral-400 px-1 py-0.2 rounded">
                                                                                    {skill.badge}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[10px] text-neutral-400 font-normal line-clamp-1 mt-0.5">
                                                                                {skill.description}
                                                                            </p>
                                                                        </div>
                                                                        {isChecked && <Check className="w-3.5 h-3.5 text-[#d97757]" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="border-t border-[#383734] my-1" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsPlusMenuOpen(false);
                                                                setIsSkillsModalOpen(true);
                                                                setSkillsModalTab('skills');
                                                            }}
                                                            className="w-full px-2 py-1.5 rounded-md text-[11px] text-left hover:bg-white/10 flex items-center gap-1.5 text-neutral-300"
                                                        >
                                                            <Settings className="w-3 h-3 text-neutral-400" />
                                                            <span>Manage skills in Settings</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Connectors with badge ⚠️ 1 (Screenshot 3) */}
                                            <div
                                                className="relative group"
                                                onMouseEnter={() => setPlusSubmenu('connectors')}
                                                onMouseLeave={() => setPlusSubmenu(null)}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Network className="w-4 h-4 text-neutral-400" />
                                                        <span>Connectors</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                                            <AlertTriangle className="w-2.5 h-2.5" /> 1
                                                        </span>
                                                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                                    </div>
                                                </button>

                                                {/* Connectors Submenu */}
                                                {plusSubmenu === 'connectors' && (
                                                    <div className="absolute left-full top-0 ml-1.5 w-64 bg-[#232220] border border-[#383734] rounded-xl shadow-2xl p-1.5 z-50">
                                                        <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                                                            Enterprise Connectors
                                                        </div>
                                                        <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                                            {connectors.map((c) => (
                                                                <div
                                                                    key={c.id}
                                                                    className="px-2 py-1.5 rounded-lg text-xs flex items-center justify-between text-neutral-300"
                                                                >
                                                                    <div>
                                                                        <div className="font-medium text-white">{c.name}</div>
                                                                        <div className="text-[10px] text-neutral-400">{c.description}</div>
                                                                    </div>
                                                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                                                        c.status === 'connected'
                                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                                            : 'bg-amber-500/20 text-amber-300'
                                                                    }`}>
                                                                        {c.badge}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="border-t border-[#383734] my-1" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsPlusMenuOpen(false);
                                                                setIsSkillsModalOpen(true);
                                                                setSkillsModalTab('connectors');
                                                            }}
                                                            className="w-full px-2 py-1.5 rounded-md text-[11px] text-left hover:bg-white/10 flex items-center gap-1.5 text-neutral-300"
                                                        >
                                                            <Settings className="w-3 h-3 text-neutral-400" />
                                                            <span>Configure connectors in Settings</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add plugins */}
                                            <div
                                                className="relative group"
                                                onMouseEnter={() => setPlusSubmenu('plugins')}
                                                onMouseLeave={() => setPlusSubmenu(null)}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Layers className="w-4 h-4 text-neutral-400" />
                                                        <span>Add plugins</span>
                                                    </div>
                                                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                                </button>

                                                {/* Plugins Submenu */}
                                                {plusSubmenu === 'plugins' && (
                                                    <div className="absolute left-full top-0 ml-1.5 w-60 bg-[#232220] border border-[#383734] rounded-xl shadow-2xl p-1.5 z-50">
                                                        <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                                                            Active Document Plugins
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {plugins.map((p) => (
                                                                <div key={p.id} className="px-2 py-1.5 text-xs text-neutral-300 flex items-center justify-between">
                                                                    <span>{p.name}</span>
                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Web search (Screenshot 3 matching blue checkmark) */}
                                            <div className="border-t border-[#383734] my-1" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsWebSearchActive(!isWebSearchActive);
                                                    toast.info(isWebSearchActive ? 'Web search disabled' : 'Web search enabled for this prompt');
                                                }}
                                                className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Globe className="w-4 h-4 text-neutral-400" />
                                                    <span>Web search</span>
                                                </div>
                                                {isWebSearchActive && (
                                                    <Check className="w-4 h-4 text-sky-400 font-bold" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Textarea matching Claude placeholder */}
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
                                    placeholder="Write a message..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-none max-h-36 py-1 leading-relaxed"
                                />

                                {/* Right Side: Mic, Audio Lines, and Send Button (Screenshot 2) */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => toast.info('Voice input active. Speak into microphone...')}
                                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                        title="Voice dictation"
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toast.info('Audio mode enabled.')}
                                        className="flex items-center gap-0.5 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                        title="Audio wave options"
                                    >
                                        <Radio className="w-4 h-4" />
                                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                                    </button>

                                    {/* Send Arrow Button */}
                                    <button
                                        type="button"
                                        disabled={!inputValue.trim() || isGenerating}
                                        onClick={() => handleSendMessage()}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                            inputValue.trim() && !isGenerating
                                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 active:scale-95 shadow-sm'
                                                : 'bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                                        }`}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM BAR: Notice on Left & Model Selector on Right (Screenshot 2) */}
                        <div className="flex items-center justify-between px-1 text-[12px] text-neutral-400 dark:text-neutral-500 select-none">
                            {/* Claude-style Notice */}
                            <p className="truncate pr-2">
                                Dynime is AI and can make mistakes. Please double-check responses.
                            </p>

                            {/* Claude-style Model Selector (Screenshot 2 Bottom Right) */}
                            <div className="relative" ref={modelMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium text-xs transition-colors"
                                >
                                    <span>{currentModelObj.name}</span>
                                    <span className="text-[10px] opacity-60 font-mono">
                                        {currentModelObj.badge}
                                    </span>
                                    <ChevronDown className="w-3 h-3 opacity-60" />
                                </button>

                                {/* Model Selector Popover */}
                                {isModelSelectorOpen && (
                                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-[#201f1d] border border-neutral-200 dark:border-[#383734] rounded-xl shadow-2xl p-1.5 z-50 text-neutral-900 dark:text-neutral-100 animate-in fade-in zoom-in-95">
                                        <div className="px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                                            Select Intelligence Engine
                                        </div>
                                        <div className="max-h-80 overflow-y-auto space-y-0.5">
                                            {available_models.map((m) => {
                                                const isSelected = selectedModel === m.id;
                                                return (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedModel(m.id);
                                                            setIsModelSelectorOpen(false);
                                                            toast.success(`Active engine: ${m.name}`);
                                                        }}
                                                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-start justify-between transition-colors ${
                                                            isSelected
                                                                ? 'bg-[#d97757]/15 font-semibold text-[#d97757]'
                                                                : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span>{m.name}</span>
                                                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
                                                                    {m.badge}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal mt-0.5 line-clamp-1">
                                                                {m.description}
                                                            </p>
                                                        </div>
                                                        {isSelected && (
                                                            <Check className="w-3.5 h-3.5 text-[#d97757] flex-shrink-0 mt-0.5" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SKILLS & CONNECTORS SETTINGS MODAL */}
                {isSkillsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-[#1f1e1d] border border-neutral-200 dark:border-[#383734] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-white">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-[#383734] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#d97757]/15 text-[#d97757] flex items-center justify-center">
                                        <Sliders className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Enterprise Skills & Connectors</h3>
                                        <p className="text-xs text-neutral-500">Configure active extensions and data pipes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSkillsModalOpen(false)}
                                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="flex border-b border-neutral-200 dark:border-[#383734] px-6 gap-4 text-xs font-medium">
                                <button
                                    onClick={() => setSkillsModalTab('skills')}
                                    className={`py-3 border-b-2 transition-colors ${
                                        skillsModalTab === 'skills'
                                            ? 'border-[#d97757] text-[#d97757]'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    Essential Skills ({essential_skills.length})
                                </button>
                                <button
                                    onClick={() => setSkillsModalTab('connectors')}
                                    className={`py-3 border-b-2 transition-colors ${
                                        skillsModalTab === 'connectors'
                                            ? 'border-[#d97757] text-[#d97757]'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    Connectors ({connectors.length})
                                </button>
                                <button
                                    onClick={() => setSkillsModalTab('plugins')}
                                    className={`py-3 border-b-2 transition-colors ${
                                        skillsModalTab === 'plugins'
                                            ? 'border-[#d97757] text-[#d97757]'
                                            : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    Plugins ({plugins.length})
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 max-h-96 overflow-y-auto space-y-3">
                                {skillsModalTab === 'skills' && (
                                    <div className="space-y-2.5">
                                        {essential_skills.map((skill) => {
                                            const isAttached = activeSkills.includes(skill.id);
                                            return (
                                                <div
                                                    key={skill.id}
                                                    className="p-3 rounded-xl border border-neutral-200 dark:border-[#383734] flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#d97757]/15 text-[#d97757] flex items-center justify-center">
                                                            <Zap className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold">{skill.name}</span>
                                                                <span className="text-[10px] bg-neutral-100 dark:bg-white/10 px-1.5 py-0.2 rounded text-neutral-400">
                                                                    {skill.badge}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-neutral-400">{skill.description}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSkill(skill.id)}
                                                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                                                            isAttached
                                                                ? 'bg-[#d97757] text-white'
                                                                : 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                                                        }`}
                                                    >
                                                        {isAttached ? 'Active' : 'Attach'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {skillsModalTab === 'connectors' && (
                                    <div className="space-y-2.5">
                                        {connectors.map((c) => (
                                            <div
                                                key={c.id}
                                                className="p-3 rounded-xl border border-neutral-200 dark:border-[#383734] flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold">{c.name}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                                            c.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                                        }`}>
                                                            {c.badge}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-400">{c.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => toast.success(`Connector verified: ${c.name}`)}
                                                    className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-[#383734] hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    {c.status === 'connected' ? 'Verified' : 'Connect'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {skillsModalTab === 'plugins' && (
                                    <div className="space-y-2.5">
                                        {plugins.map((p) => (
                                            <div
                                                key={p.id}
                                                className="p-3 rounded-xl border border-neutral-200 dark:border-[#383734] flex items-center justify-between"
                                            >
                                                <div>
                                                    <span className="text-xs font-semibold">{p.name}</span>
                                                    <p className="text-[11px] text-neutral-400">{p.description}</p>
                                                </div>
                                                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                                                    <Check className="w-3.5 h-3.5" /> Ready
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-3 border-t border-neutral-200 dark:border-[#383734] flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSkillsModalOpen(false)}
                                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[#d97757] text-white hover:opacity-90 transition-opacity"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLAUDE / KIMI STYLE DOCUMENT PREVIEW DRAWER */}
                {previewDoc && (
                    <aside className={`flex flex-col h-full bg-[#fcfcfd] dark:bg-[#121216] border-l border-neutral-200 dark:border-white/[0.08] transition-all duration-300 z-30 ${
                        isPreviewExpanded ? 'w-full' : 'w-full lg:w-1/2'
                    }`}>
                        <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#15151a] flex-shrink-0 select-none">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#d97757] flex-shrink-0">
                                    <FileText className="w-3.5 h-3.5" />
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
                                    onClick={() => {
                                        const blob = new Blob([previewDoc.content || ''], { type: 'text/markdown' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = previewDoc.filename || 'document.md';
                                        a.click();
                                        toast.success('Document downloaded');
                                    }}
                                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    title="Download document"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    title={isPreviewExpanded ? 'Collapse' : 'Expand full width'}
                                >
                                    {isPreviewExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    title="Close preview"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Preview Document Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#121216]">
                            <div className="max-w-2xl mx-auto bg-white dark:bg-[#18181c] p-8 rounded-xl border border-neutral-200 dark:border-white/10 shadow-sm text-neutral-900 dark:text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {previewDoc.content}
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
