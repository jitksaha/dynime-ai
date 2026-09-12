import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import PricingModal from '@/components/PricingModal';
import axios from 'axios';
import {
    Camera,
    Radio,
    Mic,
    Volume2,
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
    ArrowUpRight,
    Settings,
    HelpCircle,
    ArrowUpCircle,
    Info,
    MessageSquare,
    FolderArchive,
    Search,
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
    conversations?: Conversation[];
    initial_conversation?: Conversation | null;
    active_providers?: any[];
    available_models?: ModelItem[];
    capabilities?: CapabilityItem[];
    essential_skills?: SkillItem[];
    connectors?: ConnectorItem[];
    plugins?: any[];
    current_plan_slug?: string;
    plans?: any[];
    dynamic_suggestions?: any[];
}

const DEFAULT_MODELS: AvailableModel[] = [
    { id: 'dcomposer', name: 'DComposer', provider: 'dcomposer', badge: 'Default', description: 'Enterprise Multi-Model Orchestrator' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'claude', badge: 'Reasoning', description: 'Anthropic hybrid reasoning' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'claude', badge: 'Coding', description: 'Anthropic coding specialist' },
    { id: 'deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', badge: 'Fast', description: 'Flagship conversational intelligence' },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', provider: 'deepseek', badge: 'Think', description: 'Deep multi-step reasoning' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'gemini', badge: 'Next-Gen', description: 'Google multimodal 1M+ context' },
    { id: 'gpt-4o', name: 'OpenAI GPT-4o', provider: 'openai', badge: 'Omni', description: 'OpenAI flagship model' },
    { id: 'llama-3.3-70b-versatile', name: 'Groq Llama 3.3', provider: 'groq', badge: '⚡ Instant', description: 'Sub-second real-time token LPU' },
    { id: 'glm-5.2', name: 'Zai GLM-5.2', provider: 'zai', badge: 'Cognitive', description: 'Bilingual cognitive engine' },
];

const DEFAULT_SKILLS: EssentialSkill[] = [
    { id: 'financial_analyst', name: 'Financial Analyst', icon: 'TrendingUp', description: 'DCF, P&L, balance sheets & valuation modeling', badge: 'Finance' },
    { id: 'code_specialist', name: 'Code Reviewer & Architect', icon: 'Code2', description: 'Full-stack clean code, microservices & refactoring', badge: 'Dev' },
    { id: 'legal_auditor', name: 'Legal & Contract Auditor', icon: 'Shield', description: 'Compliance, NDAs, SLAs, liabilities & MSA audit', badge: 'Legal' },
    { id: 'sql_analyst', name: 'SQL & Data Architect', icon: 'Database', description: 'Schema design, star queries & execution plans', badge: 'Data' },
    { id: 'executive_memo', name: 'Executive Memo Drafter', icon: 'FileSpreadsheet', description: 'C-level briefs & strategic decision decks', badge: 'C-Suite' },
    { id: 'deep_research', name: 'Deep Research Agent', icon: 'Compass', description: 'Multi-source empirical market research', badge: 'Research' },
];

const DEFAULT_CONNECTORS: ConnectorItem[] = [
    { id: 'erp_db', name: 'ERP Go Database', icon: 'Building2', status: 'connected', badge: 'Live Connected', description: 'Real-time synchronization with ERP entities' },
    { id: 'hostinger_server', name: 'Hostinger Cloud', icon: 'Server', status: 'connected', badge: 'Live Connected', description: 'Direct deployment pipeline' },
    { id: 'smtp_mail', name: 'Corporate Email / SMTP', icon: 'Mail', status: 'connected', badge: 'Active', description: 'Outbound report notifications' },
    { id: 'google_workspace', name: 'Google Workspace', icon: 'Folder', status: 'needs_config', badge: 'Ready to Connect', description: 'Drive, Docs, and Sheets integration' },
    { id: 'github_enterprise', name: 'GitHub Enterprise', icon: 'Code2', status: 'needs_config', badge: 'Ready to Connect', description: 'Repository sync and pull requests' },
];


interface LanguageItem {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

const LANGUAGES: LanguageItem[] = [
    { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
        newChat: 'New Chat',
        myDynime: 'My Dynime',
        scheduledTasks: 'Scheduled Tasks',
        swarm: 'Swarm',
        slides: 'Slides',
        deepResearch: 'Deep Research',
        websites: 'Websites',
        docs: 'Docs',
        sheets: 'Sheets',
        design: 'Design',
        dynimeWork: 'Dynime Work',
        dynimeCode: 'Dynime Code',
        exploreInspiration: 'Explore inspiration',
        settings: 'Settings',
        language: 'Language',
        appearance: 'Appearance',
        getHelp: 'Get help',
        upgradePlan: 'Upgrade plan',
        getApps: 'Get apps and extensions',
        learnMore: 'Learn more',
        logOut: 'Log out',
        privacyPolicy: 'Privacy Policy',
        terms: 'Terms of Service',
        careers: 'Careers',
        about: 'About Dynime',
    },
    bn: {
        newChat: 'নতুন চ্যাট',
        myDynime: 'আমার ডাইনিম',
        scheduledTasks: 'শিডিউলড টাস্ক',
        swarm: 'সোয়ার্ম',
        slides: 'স্লাইড',
        deepResearch: 'ডিপ রিসার্চ',
        websites: 'ওয়েবসাইট',
        docs: 'ডকুমেন্টস',
        sheets: 'শীটস',
        design: 'ডিজাইন',
        dynimeWork: 'ডাইনিম ওয়ার্ক',
        dynimeCode: 'ডাইনিম কোড',
        exploreInspiration: 'অনুপ্রেরণা এক্সপ্লোর করুন',
        settings: 'সেটিংস',
        language: 'ভাষা',
        appearance: 'অ্যাপিয়ারেন্স',
        getHelp: 'সাহায্য নিন',
        upgradePlan: 'প্ল্যান আপগ্রেড করুন',
        getApps: 'অ্যাপ ও এক্সটেনশন',
        learnMore: 'আরও জানুন',
        logOut: 'লগ আউট',
        privacyPolicy: 'গোপনীয়তা নীতি',
        terms: 'সেবার শর্তাবলী',
        careers: 'ক্যারিয়ার',
        about: 'ডাইনিম সম্পর্কে',
    },
    hi: {
        newChat: 'नई बातचीत',
        myDynime: 'माई डाइनीम',
        scheduledTasks: 'शेड्यूल किए गए कार्य',
        swarm: 'स्वॉर्म',
        slides: 'स्लाइड्स',
        deepResearch: 'डीप रिसर्च',
        websites: 'वेबसाइट्स',
        docs: 'दस्तावेज़',
        sheets: 'शीट्स',
        design: 'डिज़ाइन',
        dynimeWork: 'डाइनीम वर्क',
        dynimeCode: 'डाइनीम कोड',
        exploreInspiration: 'प्रेरणा देखें',
        settings: 'सेटिंग्स',
        language: 'भाषा',
        appearance: 'दिखावट',
        getHelp: 'सहायता प्राप्त करें',
        upgradePlan: 'प्लान अपग्रेड करें',
        getApps: 'ऐप्स और एक्सटेंशन',
        learnMore: 'अधिक जानें',
        logOut: 'लॉग आउट',
        privacyPolicy: 'गोपनीयता नीति',
        terms: 'सेवा की शर्तें',
        careers: 'करियर',
        about: 'डाइनीम के बारे में',
    },
};

export default function ChatIndex({
    conversations: initialConversations = [],
    initial_conversation = null,
    active_providers = [],
    available_models = DEFAULT_MODELS,
    capabilities = [],
    essential_skills = DEFAULT_SKILLS,
    connectors = DEFAULT_CONNECTORS,
    current_plan_slug = 'free',
    plans = [],
    dynamic_suggestions: initialDynamicSuggestions = [],
}: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // Theme state: default light mode
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
    // Language & Translation State
    const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dynime_lang') || 'en';
        }
        return 'en';
    });
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState<boolean>(false);
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState<boolean>(false);
    const [isAppsModalOpen, setIsAppsModalOpen] = useState<boolean>(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
    const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState<boolean>(false);
    const [learnMoreActiveTab, setLearnMoreActiveTab] = useState<'policy' | 'terms' | 'careers' | 'about'>('policy');

    const handleSelectLanguage = (lang: LanguageItem) => {
        setCurrentLanguage(lang.code);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dynime_lang', lang.code);
        }
        setIsLanguageMenuOpen(false);
        toast.success(`Language changed to ${lang.nativeName} (${lang.name})`);
    };

    const t = (key: string): string => {
        return UI_TRANSLATIONS[currentLanguage]?.[key] || UI_TRANSLATIONS['en']?.[key] || key;
    };

    const handleSetTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme as any);
        if (typeof window !== 'undefined') {
            localStorage.setItem('dynime_theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else if (newTheme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        }
        toast.success(`Theme switched to ${newTheme}`);
    };

    const handleOpenLearnTopic = (topic: 'policy' | 'terms' | 'careers' | 'about') => {
        setLearnMoreActiveTab(topic);
        setIsLearnMoreModalOpen(true);
    };

    const userInitials = (user?.name || 'Dynime User')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Pricing Modal State
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [userPlan, setUserPlan] = useState<string>(current_plan_slug);
    const isProUser = (userPlan && userPlan.toLowerCase() !== 'free') || (current_plan_slug && current_plan_slug !== 'free');

    // Header notices & modals
    const [showLimitNotice, setShowLimitNotice] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Scroll to specific message or artifact
    const scrollToItem = (elementId: string) => {
        setIsLibraryOpen(false);
        setTimeout(() => {
            const el = document.getElementById(elementId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-[#635bff]', 'ring-offset-4', 'transition-all', 'duration-500');
                setTimeout(() => {
                    el.classList.remove('ring-2', 'ring-[#635bff]', 'ring-offset-4');
                }, 2500);
            }
        }, 120);
    };

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

    // Model Selector State (Default: DComposer)
    const [selectedModel, setSelectedModel] = useState<string>('dcomposer');
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

    // Claude '+' Popover Menu State
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [plusSubmenu, setPlusSubmenu] = useState<'project' | 'skills' | 'connectors' | null>(null);
    const [activeSkills, setActiveSkills] = useState<string[]>([]);
    const [isWebSearchActive, setIsWebSearchActive] = useState(false);

    // Skills & Connectors Settings Modal
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [skillsModalTab, setSkillsModalTab] = useState<'skills' | 'connectors'>('skills');

    const plusMenuRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    const toggleSkill = (skillId: string) => {
        if (activeSkills.includes(skillId)) {
            setActiveSkills(activeSkills.filter(id => id !== skillId));
            toast.info(`Skill removed`);
        } else {
            setActiveSkills([...activeSkills, skillId]);
            toast.success(`Skill attached`);
        }
    };

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

    // Real-time Chat Search by Title and in-depth Message Content
    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        const results: Array<{
            conv: Conversation;
            matchType: 'title' | 'content';
            snippet?: string;
            messageId?: number;
        }> = [];

        // Check active conversation messages for content matches
        if (activeConv && messages.length > 0) {
            messages.forEach((msg) => {
                if (msg.content && msg.content.toLowerCase().includes(q)) {
                    const idx = msg.content.toLowerCase().indexOf(q);
                    const start = Math.max(0, idx - 45);
                    const end = Math.min(msg.content.length, idx + q.length + 65);
                    const snippet = (start > 0 ? '...' : '') + msg.content.slice(start, end) + (end < msg.content.length ? '...' : '');
                    results.push({
                        conv: activeConv,
                        matchType: 'content',
                        snippet,
                        messageId: msg.id,
                    });
                }
            });
        }

        // Search conversation titles across all conversations
        conversations.forEach((conv) => {
            if (conv.title.toLowerCase().includes(q)) {
                if (!results.some(r => r.conv.uuid === conv.uuid && r.matchType === 'title')) {
                    results.push({
                        conv,
                        matchType: 'title',
                    });
                }
            }
        });

        return results;
    }, [searchQuery, conversations, activeConv, messages]);

    const handleSelectSearchResult = async (result: typeof searchResults[0]) => {
        setIsSearchModalOpen(false);
        setSearchQuery('');
        if (activeConv?.uuid !== result.conv.uuid) {
            await handleSelectConversation(result.conv);
        }
        if (result.messageId) {
            setTimeout(() => {
                scrollToItem('msg-' + result.messageId);
            }, 250);
        }
    };

    // Global keyboard shortcut: Cmd+F or Ctrl+F to open chat search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                setIsSearchModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Collect all attachments & generated deliverables dynamically for the Library drawer
    const chatLibraryItems = React.useMemo(() => {
        const items: Array<{
            id: string;
            elementId: string;
            title: string;
            type: string;
            size?: string;
            source: 'upload' | 'generated';
            messageId: number;
        }> = [];

        messages.forEach((msg) => {
            if (msg.attachments && Array.isArray(msg.attachments)) {
                msg.attachments.forEach((att: any, idx: number) => {
                    items.push({
                        id: "upload-" + msg.id + "-" + idx,
                        elementId: "msg-" + msg.id,
                        title: att.name || 'Uploaded Document',
                        type: att.type || 'file',
                        size: att.size ? (att.size / 1024).toFixed(0) + " KB" : 'Attachment',
                        source: 'upload',
                        messageId: msg.id,
                    });
                });
            }
            const docs = msg.documents || (msg.role === 'assistant' ? synthesizeArtifacts(msg.content, activeConv?.title) : []);
            docs.forEach((doc) => {
                items.push({
                    id: "art-" + doc.id,
                    elementId: "artifact-" + doc.id,
                    title: doc.title,
                    type: doc.type,
                    size: doc.size,
                    source: 'generated',
                    messageId: msg.id,
                });
            });
        });

        return items;
    }, [messages, activeConv?.title]);

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
                model: selectedModel,
                skills: activeSkills,
                web_search: isWebSearchActive,
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

    // 12 Curated Demo Inspiration Items
    const DEFAULT_INSPIRATION_POOL = [
        {
            id: 'demo-1',
            title: 'Gargantua Deep Physics Model',
            subtitle: 'Relativistic raymarching & event horizon fluid mechanics simulation',
            tag: 'Physics / Numerical',
            previewGradient: 'from-[#635bff]/15 via-blue-950/20 to-purple-950/20',
            prompt: 'Generate a comprehensive technical report for relativistic raymarching around a rotating Kerr black hole with accretion disk dynamics. Include academic specification tables and generate full documentation.',
            isDynamic: false,
            sourceLabel: 'Core Physics',
        },
        {
            id: 'demo-2',
            title: 'Open SEA Fluid Dynamics',
            subtitle: 'Navier-Stokes fluid solver & marine velocity vector flow analysis',
            tag: 'Hydrology / CFD',
            previewGradient: 'from-cyan-900/15 via-blue-900/15 to-[#635bff]/15',
            prompt: 'Formulate an end-to-end technical proposal for real-time 3D ocean wave height prediction using 2D shallow water equations and Navier-Stokes approximations. Generate full project documentation.',
            isDynamic: false,
            sourceLabel: 'Simulation',
        },
        {
            id: 'demo-3',
            title: 'Global Market Equity Flow',
            subtitle: 'Cross-asset liquidity clustering & factor risk portfolio breakdown',
            tag: 'Quantitative Finance',
            previewGradient: 'from-emerald-900/15 via-teal-900/15 to-slate-900/20',
            prompt: 'Prepare an institutional investment memorandum analyzing global macroeconomic liquidity flow across equities, sovereign debt, and commodities. Generate executive documentation and financial tables.',
            isDynamic: false,
            sourceLabel: 'Markets',
        },
        {
            id: 'demo-4',
            title: 'Autonomous Multi-Agent Swarm',
            subtitle: 'Hierarchical ReAct protocols & distributed tool consensus orchestration',
            tag: 'Agentic AI',
            previewGradient: 'from-violet-900/15 via-[#635bff]/20 to-indigo-900/15',
            prompt: 'Architect an autonomous multi-agent swarm system for complex data retrieval and verification using ReAct planning, tool-calling validation, and consensus synthesis. Outline step-by-step design.',
            isDynamic: false,
            sourceLabel: 'AI Swarm',
        },
        {
            id: 'demo-5',
            title: 'Distributed Event Sourcing & CQRS',
            subtitle: 'High-throughput Kafka event streaming & eventual consistency mesh',
            tag: 'Cloud Systems',
            previewGradient: 'from-blue-900/15 via-indigo-900/15 to-neutral-900/20',
            prompt: 'Draft a high-level system design document for an event-sourced distributed ordering system utilizing Apache Kafka, PostgreSQL write models, and Redis read-replica projections.',
            isDynamic: false,
            sourceLabel: 'Architecture',
        },
        {
            id: 'demo-6',
            title: 'Private Equity LBO & Waterfall Model',
            subtitle: 'Three-statement consolidation with debt amortization & hurdle rates',
            tag: 'Investment Banking',
            previewGradient: 'from-amber-900/15 via-emerald-900/15 to-neutral-900/20',
            prompt: 'Build an institutional leveraged buyout (LBO) financial model with senior and mezzanine debt tranches, revolving credit facilities, and return sensitivity tables (MoIC and IRR).',
            isDynamic: false,
            sourceLabel: 'Financial Model',
        },
        {
            id: 'demo-7',
            title: 'Multi-Tenant SaaS RBAC Engine',
            subtitle: 'Tenant database isolation, JWT SSO & dynamic permission trees',
            tag: 'Fullstack Engineering',
            previewGradient: 'from-[#5465ff]/15 via-indigo-900/15 to-slate-900/20',
            prompt: 'Design an enterprise-grade multi-tenant authorization framework with hierarchical RBAC, dynamic organization switching, and cryptographic token verification.',
            isDynamic: false,
            sourceLabel: 'Fullstack',
        },
        {
            id: 'demo-8',
            title: 'Zero-Trust Cloud Security Audit',
            subtitle: 'Automated CVE dependency scans, IAM least-privilege & TLS policies',
            tag: 'Cybersecurity',
            previewGradient: 'from-rose-900/15 via-purple-900/15 to-neutral-900/20',
            prompt: 'Generate an enterprise zero-trust security architecture posture review covering AWS IAM policies, mTLS between microservices, secrets rotation, and automated audit logging.',
            isDynamic: false,
            sourceLabel: 'Infra Security',
        },
        {
            id: 'demo-9',
            title: 'SaaS Unit Economics & Cohort Retention',
            subtitle: 'LTV/CAC sensitivity matrix, payback velocity & Net Revenue Retention',
            tag: 'Product Analytics',
            previewGradient: 'from-teal-900/15 via-cyan-900/15 to-neutral-900/20',
            prompt: 'Formulate a venture-grade financial model analyzing SaaS cohort churn, Net Revenue Retention (NRR), and customer acquisition cost (CAC) payback periods with charts and projections.',
            isDynamic: false,
            sourceLabel: 'Growth',
        },
        {
            id: 'demo-10',
            title: 'CRISPR Target Sequence Scoring',
            subtitle: 'Off-target cleavage prediction & guide RNA kinetic binding efficiency',
            tag: 'Bioinformatics',
            previewGradient: 'from-green-900/15 via-emerald-900/15 to-neutral-900/20',
            prompt: 'Provide a detailed computational biology methodology for scoring CRISPR-Cas9 single guide RNA (sgRNA) on-target efficiency and off-target cleavage probability using machine learning.',
            isDynamic: false,
            sourceLabel: 'Bio Research',
        },
        {
            id: 'demo-11',
            title: 'EU AI Act Regulatory Governance',
            subtitle: 'High-risk AI classification, technical documentation & audit trail readiness',
            tag: 'Legal & Compliance',
            previewGradient: 'from-yellow-900/15 via-amber-900/15 to-neutral-900/20',
            prompt: 'Draft an executive compliance readiness checklist for deploying generative AI models under the European Union AI Act, focusing on risk categorization and explainability logs.',
            isDynamic: false,
            sourceLabel: 'Governance',
        },
        {
            id: 'demo-12',
            title: 'Transformer FlashAttention-3 Profiler',
            subtitle: 'GPU SRAM memory hierarchy optimization & FP8 inference latency analysis',
            tag: 'Deep Learning',
            previewGradient: 'from-fuchsia-900/15 via-purple-900/15 to-neutral-900/20',
            prompt: 'Conduct an in-depth hardware latency analysis of FlashAttention-3 kernels on modern GPU architectures, detailing asynchronous memory transfers, warp specialization, and FP8 precision.',
            isDynamic: false,
            sourceLabel: 'Optimization',
        },
    ];

    // Inspiration State: Collapsible, See more/less & Auto load more
    const [isInspirationsCollapsed, setIsInspirationsCollapsed] = useState<boolean>(false);
    const [visibleInspirationsCount, setVisibleInspirationsCount] = useState<number>(3);
    const [autoLoadMoreInspirations, setAutoLoadMoreInspirations] = useState<boolean>(false);
    const [inspirationCardsList, setInspirationCardsList] = useState<any[]>(() => {
        if (initialDynamicSuggestions && initialDynamicSuggestions.length > 0) {
            return initialDynamicSuggestions;
        }
        // Synthesize dynamic cards from initial conversations if available
        if (initialConversations && initialConversations.length > 0) {
            const dynamicCards: any[] = [];
            const seen = new Set<string>();
            initialConversations.slice(0, 5).forEach((c) => {
                const title = (c.title || '').trim();
                const tLower = title.toLowerCase();
                if (!title || ['new discussion', 'new chat', 'hi', 'hello', 'test'].includes(tLower) || seen.has(tLower)) {
                    return;
                }
                seen.add(tLower);
                if (tLower.includes('physics') || tLower.includes('raymarch') || tLower.includes('relativist') || tLower.includes('black hole')) {
                    dynamicCards.push({
                        id: `dyn-${c.id}`,
                        title: 'Kerr Accretion Disk Simulation',
                        subtitle: 'General relativistic magnetohydrodynamics & Doppler frame transformation',
                        tag: 'Astrophysics & GR',
                        previewGradient: 'from-[#635bff]/25 via-indigo-950/30 to-purple-950/30',
                        prompt: 'Expand our relativistic raymarching exploration with General Relativistic Magnetohydrodynamics (GRMHD) equations and synchrotron emission tables for spinning black holes.',
                        isDynamic: true,
                        sourceLabel: `✨ Based on: ${title.slice(0, 20)}...`,
                    });
                } else if (tLower.includes('invest') || tLower.includes('finance') || tLower.includes('equity') || tLower.includes('macro') || tLower.includes('memorandum')) {
                    dynamicCards.push({
                        id: `dyn-${c.id}`,
                        title: 'Macro Cross-Asset Risk Matrix',
                        subtitle: 'Yield curve inversion indicators, sovereign credit spreads & dollar liquidity',
                        tag: 'Macro Strategies',
                        previewGradient: 'from-emerald-900/20 via-teal-900/20 to-slate-900/25',
                        prompt: 'Conduct an institutional risk analysis connecting sovereign bond yield curve inversions with cross-asset equity equity risk premiums (ERP). Output tabular breakdowns.',
                        isDynamic: true,
                        sourceLabel: `✨ Based on: ${title.slice(0, 20)}...`,
                    });
                } else if (tLower.includes('architect') || tLower.includes('system') || tLower.includes('cloud') || tLower.includes('database') || tLower.includes('review')) {
                    dynamicCards.push({
                        id: `dyn-${c.id}`,
                        title: 'Resilient Event-Driven Microservices',
                        subtitle: 'Outbox pattern, idempotent consumer consensus & zero-downtime canary deployment',
                        tag: 'Distributed Systems',
                        previewGradient: 'from-blue-900/20 via-indigo-900/20 to-purple-900/25',
                        prompt: 'Design an enterprise transactional outbox pipeline with CDC (Change Data Capture) via Debezium and Kafka to guarantee atomic dual-writes across distributed microservices.',
                        isDynamic: true,
                        sourceLabel: `✨ Based on: ${title.slice(0, 20)}...`,
                    });
                } else {
                    dynamicCards.push({
                        id: `dyn-${c.id}`,
                        title: `Deep Dive: ${title.slice(0, 26)}`,
                        subtitle: 'Advanced theoretical expansion, comparative tradeoffs & executive roadmap',
                        tag: 'Follow-up Synthesis',
                        previewGradient: 'from-[#635bff]/20 via-purple-900/15 to-neutral-900/20',
                        prompt: `Provide an advanced, deep-dive expansion on "${title}", detailing technical architecture, edge cases, comparative benchmarks, and an implementation checklist.`,
                        isDynamic: true,
                        sourceLabel: '✨ Based on recent chat',
                    });
                }
            });
            return [...dynamicCards, ...DEFAULT_INSPIRATION_POOL];
        }
        return DEFAULT_INSPIRATION_POOL;
    });

    const [isRefreshingInspirations, setIsRefreshingInspirations] = useState<boolean>(false);
    const inspirationSentinelRef = useRef<HTMLDivElement | null>(null);

    // Auto-load more on scroll when enabled
    useEffect(() => {
        if (!autoLoadMoreInspirations || isInspirationsCollapsed) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleInspirationsCount((prev) => {
                        if (prev < inspirationCardsList.length) {
                            return Math.min(prev + 3, inspirationCardsList.length);
                        }
                        return prev;
                    });
                }
            },
            { threshold: 0.1 }
        );

        if (inspirationSentinelRef.current) {
            observer.observe(inspirationSentinelRef.current);
        }

        return () => observer.disconnect();
    }, [autoLoadMoreInspirations, isInspirationsCollapsed, inspirationCardsList.length]);

    const handleRefreshInspirations = async () => {
        setIsRefreshingInspirations(true);
        try {
            const res = await axios.get('/api/chat/inspirations');
            if (res.data?.inspirations && res.data.inspirations.length > 0) {
                setInspirationCardsList(res.data.inspirations);
                toast.success('Inspirations refreshed from your recent chats!');
            } else {
                toast.info('Loaded latest inspirations.');
            }
        } catch (err) {
            toast.info('Updated inspirations from chat history.');
        } finally {
            setIsRefreshingInspirations(false);
        }
    };

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
        <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0c0c0f] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-[#635bff] selection:text-white transition-colors duration-200">
            <Head title="Dynime AI - Enterprise Intelligence" />

            {/* Left Kimi-Style Sidebar (Fixed Width 260px, Collapsible with transition) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 md:static flex flex-col w-[260px] min-w-[260px] max-w-[260px] flex-shrink-0 bg-[#f7f7f9] dark:bg-[#111115] border-r border-neutral-200/80 dark:border-white/[0.06] transition-all duration-300 select-none ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:min-w-0 md:max-w-0 md:border-none md:overflow-hidden'
                }`}
            >
                {/* Brand Header: Dynime Brand Icon + DYNIME AI + Search Bar + Collapse Toggle */}
                <div className="h-14 px-3 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <img
                            src="/images/dynime-ai-logo.png"
                            alt="Dynime AI"
                            className="w-5 h-5 object-contain flex-shrink-0"
                        />
                        <span className="font-bold tracking-wider text-[12.5px] text-neutral-900 dark:text-white uppercase font-sans select-none">
                            DYNIME AI
                        </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Search Chats Button (⌘F) */}
                        <button
                            type="button"
                            onClick={() => setIsSearchModalOpen(true)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Search chats (⌘F)"
                        >
                            <Search className="w-4 h-4" />
                        </button>

                        {/* Sidebar Collapse Toggle Button [|] */}
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Collapse sidebar"
                        >
                            <PanelLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* + New Chat Button with ⌘K matching Screenshot 1 */}
                <div className="p-3 flex-shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] hover:bg-neutral-100 dark:hover:bg-white/[0.08] border border-neutral-200/80 dark:border-white/[0.07] text-neutral-800 dark:text-white text-xs font-medium transition-all shadow-xs group"
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-[#635bff] dark:text-[#788bff] group-hover:rotate-90 transition-transform duration-200" />
                            <span>New Chat</span>
                        </div>
                        <kbd className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-white/10 group-hover:text-[#635bff] dark:group-hover:text-[#9bb1ff]">
                            ⌘ K
                        </kbd>
                    </button>
                </div>                {/* Kimi Menu Navigation List with Lottie-Style Animated Icons & Multi-Language Support */}
                <div className="px-2 py-0.5 space-y-0.5 text-xs text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#635bff] dark:text-[#788bff] lottie-icon group-hover:rotate-12 group-hover:scale-125" />
                        <span className="font-medium">{t('myDynime')}</span>
                    </button>

                    <button
                        onClick={() => toast.info('Scheduled automated agent tasks active.')}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Clock className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:rotate-180 group-hover:text-amber-500" />
                        <span>{t('scheduledTasks')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('auto');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Network className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:scale-125 group-hover:text-indigo-500" />
                        <span>{t('swarm')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('creative');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Presentation className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:-rotate-12 group-hover:scale-125 group-hover:text-cyan-500" />
                        <span>{t('slides')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('research');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Compass className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:rotate-45 group-hover:scale-125 group-hover:text-violet-500" />
                        <span>{t('deepResearch')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('fast');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Globe className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:rotate-180 group-hover:text-emerald-500" />
                        <span>{t('websites')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('vision');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:text-blue-500" />
                        <span>{t('docs')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('coding');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:scale-125 group-hover:text-emerald-500" />
                        <span>{t('sheets')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('deep_thinking');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Palette className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:rotate-180 group-hover:text-fuchsia-500" />
                        <span>{t('design')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('auto');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Briefcase className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:-translate-y-1 group-hover:text-amber-500" />
                        <span>{t('dynimeWork')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('coding');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Code2 className="w-3.5 h-3.5 text-[#635bff] dark:text-[#788bff] lottie-icon group-hover:scale-125" />
                        <span>{t('dynimeCode')}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCapability('deep_thinking');
                            handleNewChat();
                        }}
                        className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Bot className="w-3.5 h-3.5 text-neutral-400 lottie-icon group-hover:rotate-12 group-hover:scale-125 group-hover:text-rose-500" />
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
                                                className="w-full bg-white dark:bg-neutral-800 border border-[#635bff] rounded px-1.5 py-0.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
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

                {/* Sidebar Bottom Profile Bar matching Screenshot 1, 2, 3 with Full Interactive Dropdown */}
                <div className="p-2.5 border-t border-neutral-200/80 dark:border-white/[0.06] bg-[#f0f0f3] dark:bg-[#0f0f13] flex-shrink-0">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div
                                    className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] transition-all cursor-pointer group select-none"
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#635bff] to-[#5465ff] text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:scale-105 transition-transform">
                                                {userInitials}
                                            </div>
                                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f0f13]" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 text-left">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[105px]">
                                                    {user.name}
                                                </span>
                                                {isProUser && (
                                                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-[#635bff] to-[#5465ff] text-white shadow-xs flex items-center gap-0.5 flex-shrink-0">
                                                        <Sparkles className="w-2 h-2 fill-white" /> PRO
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-neutral-400 capitalize">
                                                <span>{userPlan}</span>
                                                <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-transform group-hover:translate-y-0.5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {!isProUser ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsPricingModalOpen(true)}
                                                className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-[#635bff]/15 hover:bg-[#635bff]/25 text-[#635bff] dark:text-[#9bb1ff] border border-[#635bff]/25 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                                            >
                                                Upgrade
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setIsPricingModalOpen(true)}
                                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                            >
                                                Manage
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setIsAppsModalOpen(true)}
                                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-300/60 dark:hover:bg-white/[0.08] transition-colors group/dl cursor-pointer"
                                            title="Get apps and extensions"
                                        >
                                            <Download className="w-3.5 h-3.5 group-hover/dl:translate-y-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </DropdownMenuTrigger>

                            {/* DROPDOWN MENU MATCHING SCREENSHOT 3 PERFECTLY */}
                            <DropdownMenuContent
                                align="start"
                                side="top"
                                sideOffset={8}
                                className="w-72 bg-[#16161a] text-neutral-200 border border-neutral-800 shadow-2xl rounded-2xl p-2 font-sans animate-in fade-in-50 zoom-in-95 duration-150 z-[120]"
                            >
                                {/* User email header */}
                                <div className="px-3 py-2.5 border-b border-neutral-800/80 mb-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-neutral-300 truncate max-w-[190px]" title={user.email}>
                                            {user.email}
                                        </p>
                                        {isProUser ? (
                                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-[#635bff] text-white">
                                                PRO
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-neutral-500 uppercase font-mono">
                                                Free
                                            </span>
                                        )}
                                    </div>
                                    <a
                                        href="https://account.dynime.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[#9bb1ff] hover:text-white transition-colors group/acc"
                                    >
                                        <UserIcon className="w-3 h-3 text-[#635bff]" />
                                        <span>Dynime Account Center</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover/acc:translate-x-0.5 transition-transform" />
                                    </a>
                                </div>

                                {/* Settings (⇧ ⌘ ,) */}
                                <DropdownMenuItem
                                    onClick={() => setIsSkillsModalOpen(true)}
                                    className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Settings className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:rotate-90 transition-transform duration-500 ease-out" />
                                        <span>{t('settings')}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-neutral-500">⇧ ⌘ ,</span>
                                </DropdownMenuItem>

                                {/* Language Switcher with Submenu */}
                                <div className="px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer group/lang">
                                    <div
                                        className="flex items-center justify-between"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsLanguageMenuOpen(!isLanguageMenuOpen);
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Globe className="w-4 h-4 text-neutral-400 group-hover/lang:text-white group-hover/lang:rotate-180 transition-transform duration-700" />
                                            <span>{t('language')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                                            <span>{LANGUAGES.find(l => l.code === currentLanguage)?.nativeName || 'English'}</span>
                                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isLanguageMenuOpen ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>

                                    {isLanguageMenuOpen && (
                                        <div className="mt-2 p-1 rounded-xl bg-black/60 border border-white/10 space-y-0.5 max-h-48 overflow-y-auto animate-in fade-in duration-150">
                                            {LANGUAGES.map((lang) => (
                                                <div
                                                    key={lang.code}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectLanguage(lang);
                                                    }}
                                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                                        currentLanguage === lang.code
                                                            ? 'bg-[#635bff] text-white font-medium'
                                                            : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{lang.flag}</span>
                                                        <span>{lang.nativeName}</span>
                                                        <span className="text-[10px] text-neutral-400">({lang.name})</span>
                                                    </div>
                                                    {currentLanguage === lang.code && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Appearance Switcher (Light, Dark, System) */}
                                <div className="px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors group/theme">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <Palette className="w-4 h-4 text-neutral-400 group-hover/theme:text-white group-hover/theme:rotate-180 transition-transform duration-500" />
                                            <span>{t('appearance')}</span>
                                        </div>
                                        <span className="text-[10px] text-neutral-400 capitalize">{theme}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-black/50 border border-white/10 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetTheme('light');
                                            }}
                                            className={`flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
                                                theme === 'light'
                                                    ? 'bg-white text-black font-semibold shadow-xs'
                                                    : 'text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            <Sun className="w-3 h-3 text-amber-500" />
                                            <span>Light</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetTheme('dark');
                                            }}
                                            className={`flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
                                                theme === 'dark'
                                                    ? 'bg-[#635bff] text-white font-semibold shadow-xs'
                                                    : 'text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            <Moon className="w-3 h-3 text-indigo-200" />
                                            <span>Dark</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetTheme('system');
                                            }}
                                            className={`flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
                                                theme === 'system'
                                                    ? 'bg-neutral-700 text-white font-semibold shadow-xs'
                                                    : 'text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            <Laptop className="w-3 h-3" />
                                            <span>System</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Get Help */}
                                <DropdownMenuItem
                                    onClick={() => setIsHelpModalOpen(true)}
                                    className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                                >
                                    <HelpCircle className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:scale-110 group-hover:-translate-y-0.5 transition-all" />
                                    <span>{t('getHelp')}</span>
                                </DropdownMenuItem>

                                <div className="my-1 border-t border-neutral-800" />

                                {/* Upgrade Plan */}
                                <DropdownMenuItem
                                    onClick={() => setIsPricingModalOpen(true)}
                                    className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ArrowUpCircle className="w-4 h-4 text-neutral-400 group-hover:text-[#635bff] group-hover:-translate-y-0.5 group-hover:scale-110 transition-all" />
                                        <span>{t('upgradePlan')}</span>
                                    </div>
                                    <span className="text-[10px] text-[#9bb1ff] font-medium bg-[#635bff]/20 px-1.5 py-0.2 rounded border border-[#635bff]/30">
                                        Plans
                                    </span>
                                </DropdownMenuItem>

                                {/* Get Apps & Extensions */}
                                <DropdownMenuItem
                                    onClick={() => setIsAppsModalOpen(true)}
                                    className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors"
                                >
                                    <Download className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-y-0.5 transition-transform" />
                                    <span>{t('getApps')}</span>
                                </DropdownMenuItem>

                                {/* Learn More (with Hover Submenu: Policy, Careers, Terms, About) */}
                                <div className="px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer group/learn">
                                    <div
                                        className="flex items-center justify-between"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsLearnMoreOpen(!isLearnMoreOpen);
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Info className="w-4 h-4 text-neutral-400 group-hover/learn:text-white group-hover/learn:scale-110 transition-transform" />
                                            <span>{t('learnMore')}</span>
                                        </div>
                                        <ChevronRight className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isLearnMoreOpen ? 'rotate-90' : ''}`} />
                                    </div>

                                    {isLearnMoreOpen && (
                                        <div className="mt-2 p-1 rounded-xl bg-black/60 border border-white/10 space-y-0.5 animate-in fade-in duration-150">
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenLearnTopic('policy');
                                                }}
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                <span>{t('privacyPolicy')}</span>
                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                            </div>
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenLearnTopic('terms');
                                                }}
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                <span>{t('terms')}</span>
                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                            </div>
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenLearnTopic('careers');
                                                }}
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span>{t('careers')}</span>
                                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Hiring</span>
                                                </div>
                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                            </div>
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenLearnTopic('about');
                                                }}
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                <span>{t('about')}</span>
                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="my-1 border-t border-neutral-800" />

                                {/* Log Out */}
                                <DropdownMenuItem
                                    onClick={() => router.post('/logout')}
                                    className="group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer transition-colors"
                                >
                                    <LogOut className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
                                    <span>{t('logOut')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <a
                            href={ssoLoginUrl}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#635bff] hover:bg-[#5465ff] text-white text-xs font-medium transition-all shadow-sm"
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
                    <header className="h-14 px-4 flex items-center justify-between bg-white dark:bg-[#0c0c0f] z-20 flex-shrink-0 select-none">
                        {/* Left: Sidebar toggle + Active Chat Title Dropdown matching Screenshot 2 */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            {!isSidebarOpen && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors group cursor-pointer"
                                        title="Expand sidebar"
                                    >
                                        <img
                                            src="/images/dynime-ai-logo.png"
                                            alt="Dynime AI"
                                            className="w-5 h-5 object-contain flex-shrink-0"
                                        />
                                        <span className="font-bold tracking-wider text-[12.5px] text-neutral-900 dark:text-white uppercase font-sans">
                                            DYNIME AI
                                        </span>
                                        <PanelLeft className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white ml-0.5" />
                                    </button>

                                    {/* Search Chats Button when sidebar collapsed */}
                                    <button
                                        type="button"
                                        onClick={() => setIsSearchModalOpen(true)}
                                        className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        title="Search chats (⌘F)"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Active Chat Title Dropdown matching Screenshot 2 */}
                            {activeConv ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/70 dark:bg-white/[0.05] hover:bg-neutral-200/60 dark:hover:bg-white/[0.08] border border-neutral-200/60 dark:border-white/[0.08] text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all max-w-[200px] sm:max-w-xs group cursor-pointer">
                                            <MessageSquare className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white flex-shrink-0" />
                                            <span className="truncate">{activeConv.title}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white flex-shrink-0 ml-0.5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        className="w-56 bg-[#16161a] text-neutral-200 border border-neutral-800 shadow-2xl rounded-xl p-1 text-xs font-sans z-[120]"
                                    >
                                        <DropdownMenuItem
                                            onClick={(e) => handleTogglePin(e, activeConv)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Pin className={`w-4 h-4 ${activeConv.is_pinned ? 'text-amber-400 fill-amber-400' : 'text-neutral-400'}`} />
                                                <span>{activeConv.is_pinned ? 'Unpin' : 'Pin'}</span>
                                            </div>
                                            <kbd className="text-[10px] font-mono text-neutral-500">P</kbd>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => handleStartRename(e, activeConv)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Edit3 className="w-4 h-4 text-neutral-400" />
                                                <span>Rename</span>
                                            </div>
                                            <kbd className="text-[10px] font-mono text-neutral-500">R</kbd>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => toast.info('Discussion added to project workspace.')}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FolderPlus className="w-4 h-4 text-neutral-400" />
                                                <span>Add to project</span>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setIsShareModalOpen(true)}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                                        >
                                            <Share2 className="w-4 h-4 text-neutral-400" />
                                            <span>Share chat</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="my-1 border-neutral-800" />
                                        <DropdownMenuItem
                                            onClick={(e) => handleDeleteConversation(e, activeConv)}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Trash2 className="w-4 h-4 text-rose-400" />
                                                <span>Delete</span>
                                            </div>
                                            <kbd className="text-[10px] font-mono text-rose-400/60">D</kbd>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <button onClick={handleNewChat} className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 px-2 py-1 rounded-lg">
                                    <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>New Discussion</span>
                                </button>
                            )}
                        </div>

                        {/* Middle: Small plan limit notice card matching requirement 3 */}
                        {showLimitNotice && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200/80 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-300 shadow-2xs animate-in fade-in">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[11.5px]">Daily token status: <strong className="text-neutral-900 dark:text-white font-medium">85% used</strong></span>
                                <button
                                    onClick={() => setIsPricingModalOpen(true)}
                                    className="px-2 py-0.5 rounded-md bg-[#635bff] hover:bg-[#5465ff] text-white text-[10.5px] font-medium transition-colors cursor-pointer"
                                >
                                    Upgrade Plan
                                </button>
                                <button
                                    onClick={() => setShowLimitNotice(false)}
                                    className="p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                                    title="Dismiss notice"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {/* Right: Share Chat and Dynamic Library only (Theme switcher and profile avatar removed per user request) */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            {/* Share chat button with social preview modal */}
                            <button
                                type="button"
                                onClick={() => setIsShareModalOpen(true)}
                                className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                title="Share chat"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>

                            {/* Dynamic Library button with counter badge */}
                            <button
                                type="button"
                                onClick={() => setIsLibraryOpen(true)}
                                className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/[0.08] border border-neutral-200/60 dark:border-white/[0.05] transition-colors cursor-pointer"
                                title="Chat Library: Files & Deliverables"
                            >
                                <FolderArchive className="w-3.5 h-3.5 text-[#635bff] dark:text-[#788bff]" />
                                <span className="font-semibold">{chatLibraryItems.length}</span>
                            </button>
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
                            <div className="w-full bg-white dark:bg-[#18181c] border border-neutral-200/90 dark:border-white/[0.08] hover:border-[#635bff]/40 focus-within:border-[#635bff] dark:focus-within:border-[#635bff]/60 rounded-xl px-3 py-2 sm:py-2.5 shadow-xs transition-all duration-200 relative">
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
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#635bff]/10 dark:bg-[#635bff]/15 border border-[#635bff]/25 dark:border-[#635bff]/30 text-[11px] text-[#635bff] dark:text-[#9bb1ff] shadow-xs"
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
                                    className="w-full bg-transparent border-none text-[14px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-0 resize-none px-1 py-0.5 leading-normal"
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
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#635bff]" /> : <Plus className="w-4 h-4" />}
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
                                                        className="text-xs cursor-pointer hover:bg-[#635bff]/10 hover:text-[#635bff] flex items-center justify-between py-2"
                                                    >
                                                        <span>{cap.name}</span>
                                                        <span className="text-[10px] text-[#635bff] dark:text-[#788bff] bg-[#635bff]/10 dark:bg-[#635bff]/20 px-1.5 py-0.5 rounded border border-[#635bff]/25 dark:border-[#635bff]/30">
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
                                                inputValue.trim() && !isGenerating ? 'bg-[#635bff] text-white hover:bg-[#5465ff] active:scale-95 shadow-xs'
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
                                            <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#635bff] dark:group-hover:text-[#788bff] transition-colors" />
                                            <span>{chip.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explore Inspiration Section with Dynamic Suggestions & Collapsible Auto-Load */}
                            <div className="w-full mt-10">
                                {/* Section Header Bar */}
                                <div className="flex items-center justify-between gap-3 mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                                            <Lightbulb className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
                                            Explore inspiration
                                        </span>
                                        <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
                                            {inspirationCardsList.length} ideas
                                        </span>
                                        {inspirationCardsList.some(c => c.isDynamic) && (
                                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-[#635bff] dark:text-[#9bb1ff] bg-[#635bff]/10 dark:bg-[#635bff]/20 px-2 py-0.5 rounded-full border border-[#635bff]/20">
                                                <Sparkles className="w-2.5 h-2.5" /> Personalized
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Refresh Button */}
                                        <button
                                            type="button"
                                            onClick={handleRefreshInspirations}
                                            disabled={isRefreshingInspirations}
                                            title="Analyze recent chats & refresh suggestions"
                                            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingInspirations ? 'animate-spin text-[#635bff]' : ''}`} />
                                        </button>

                                        {/* Auto Load More Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setAutoLoadMoreInspirations(!autoLoadMoreInspirations)}
                                            className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                                                autoLoadMoreInspirations
                                                    ? 'bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff] border-[#635bff]/30'
                                                    : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-neutral-200/80 dark:border-white/5 hover:border-neutral-300'
                                            }`}
                                            title="Auto-load more suggestions as you scroll"
                                        >
                                            <Zap className={`w-3 h-3 ${autoLoadMoreInspirations ? 'fill-[#635bff]' : ''}`} />
                                            <span>Auto-load</span>
                                        </button>

                                        {/* Collapse / Expand Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={() => setIsInspirationsCollapsed(!isInspirationsCollapsed)}
                                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                            aria-label={isInspirationsCollapsed ? 'Expand inspiration section' : 'Collapse inspiration section'}
                                        >
                                            <span>{isInspirationsCollapsed ? 'Expand' : 'Collapse'}</span>
                                            {isInspirationsCollapsed ? (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            ) : (
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Collapsible Content */}
                                {!isInspirationsCollapsed && (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                        {/* Inspiration Cards Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                            {inspirationCardsList.slice(0, visibleInspirationsCount).map((card, i) => (
                                                <div
                                                    key={card.id || i}
                                                    onClick={() => handleSendMessage(card.prompt)}
                                                    className="group cursor-pointer rounded-xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#141419] hover:border-[#635bff]/50 dark:hover:border-[#635bff]/60 p-3.5 shadow-xs hover:shadow-xl hover:shadow-[#635bff]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[148px] relative overflow-hidden"
                                                >
                                                    {/* Whisper-Light Subtle Brand Gradient on Hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-[#635bff]/[0.035] via-[#5465ff]/[0.015] to-transparent dark:from-[#635bff]/[0.08] dark:via-[#5465ff]/[0.03] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

                                                    {/* Card Top Row: Tag & Arrow Icon */}
                                                    <div className="relative z-10 flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10 group-hover:border-[#635bff]/30 transition-colors">
                                                                {card.tag}
                                                            </span>
                                                            {card.isDynamic && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-medium bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff] border border-[#635bff]/20">
                                                                    <Sparkles className="w-2.5 h-2.5" /> Recent chat
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-[#635bff] dark:group-hover:text-[#9bb1ff] group-hover:bg-[#635bff]/10 transition-all flex-shrink-0">
                                                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                        </div>
                                                    </div>

                                                    {/* Card Middle: Title & Subtitle */}
                                                    <div className="relative z-10 my-2">
                                                        <h3 className="text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-white group-hover:text-[#635bff] dark:group-hover:text-[#9bb1ff] transition-colors line-clamp-1">
                                                            {card.title}
                                                        </h3>
                                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mt-1">
                                                            {card.subtitle}
                                                        </p>
                                                    </div>

                                                    {/* Card Bottom Row: Source & Prompt Action */}
                                                    <div className="relative z-10 flex items-center justify-between text-[10px] pt-2 border-t border-neutral-100 dark:border-white/[0.05]">
                                                        <span className="text-neutral-400 dark:text-neutral-500 truncate max-w-[170px]">
                                                            {card.sourceLabel || (card.isDynamic ? '✨ Recent chat' : 'Exploration')}
                                                        </span>
                                                        <span className="font-medium text-[#635bff] dark:text-[#9bb1ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                                            <span>Explore</span>
                                                            <ArrowUpRight className="w-3 h-3" />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Auto-load sentinel element */}
                                        {autoLoadMoreInspirations && (
                                            <div ref={inspirationSentinelRef} className="h-2 w-full pointer-events-none" />
                                        )}

                                        {/* Bottom Action Controls: See More / See Less */}
                                        <div className="flex items-center justify-between pt-1 px-1">
                                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                                Showing {Math.min(visibleInspirationsCount, inspirationCardsList.length)} of {inspirationCardsList.length} suggestions
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {visibleInspirationsCount < inspirationCardsList.length && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVisibleInspirationsCount((prev) => Math.min(prev + 3, inspirationCardsList.length))}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white text-xs font-medium transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
                                                    >
                                                        <span>See more</span>
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                {visibleInspirationsCount > 3 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVisibleInspirationsCount(3)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-transparent hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 text-xs font-medium transition-all"
                                                    >
                                                        <span>See less</span>
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                                                    <FileText className="w-4 h-4 text-[#635bff] dark:text-[#788bff]" />
                                                                    <div>
                                                                        <div className="font-medium max-w-[160px] truncate">{att.name || 'document_pdf'}</div>
                                                                        <div className="text-[10px] text-neutral-400 uppercase">PDF 561.04 KB</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* User Bubble matching Screenshot 2 */}
                                                    <div id={"msg-" + msg.id} className="scroll-mt-20" />
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
                                                                <Bot className="w-4 h-4 text-[#635bff] dark:text-[#788bff] flex-shrink-0" />
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
                                                                    id={"artifact-" + doc.id}
                                                                    onClick={() => openPreview(doc)}
                                                                    className="group flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/90 dark:border-white/[0.08] bg-white dark:bg-[#16161b] hover:border-[#635bff]/40 dark:hover:border-[#635bff]/30 shadow-sm cursor-pointer transition-all duration-200"
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
                                                                                <FileText className="w-4.5 h-4.5 text-[#635bff] dark:text-[#788bff]" />
                                                                            )}
                                                                        </div>

                                                                        <div className="truncate">
                                                                            <h4 className="text-xs sm:text-[13px] font-semibold text-neutral-900 dark:text-white truncate group-hover:text-[#635bff] dark:group-hover:text-[#788bff] transition-colors">
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
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-[#635bff]/10 text-neutral-800 dark:text-neutral-200 hover:text-[#635bff] dark:hover:text-[#9bb1ff] border border-neutral-200 dark:border-white/10 transition-all shadow-xs"
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
                                                            className={`hover:text-neutral-900 dark:hover:text-white transition-colors p-1 ${likedId === msg.id ? 'text-[#635bff]' : ''}`}
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
                                    <div className="flex items-center gap-2.5 pl-1 py-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        <Sparkles className="w-4 h-4 text-[#635bff] dark:text-[#788bff] animate-spin flex-shrink-0" />
                                        <span className="font-medium">Dynime AI is synthesizing response...</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Pinned Bottom Floating Input Bar matching Screenshots 2, 3, 4 */}
                            <div className="px-4 pb-3 pt-1 bg-white dark:bg-[#0c0c0f] flex-shrink-0">
                                <div className="max-w-3xl mx-auto w-full space-y-1.5">
                                    <div className="w-full bg-white dark:bg-[#18181c] border border-neutral-200/90 dark:border-white/[0.08] hover:border-[#635bff]/40 focus-within:border-[#635bff] dark:focus-within:border-[#635bff]/60 rounded-xl px-3 py-1.5 sm:py-2 shadow-xs transition-all">
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2 px-1">
                                            {attachments.map((att, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#635bff]/10 dark:bg-[#635bff]/15 border border-[#635bff]/25 dark:border-[#635bff]/30 text-[11px] text-[#635bff] dark:text-[#9bb1ff]"
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

                                    {/* Active Skills & Web Search Chips */}
                                    {(activeSkills.length > 0 || isWebSearchActive) && (
                                        <div className="flex flex-wrap items-center gap-1.5 pb-2 mb-2 border-b border-neutral-100 dark:border-white/5">
                                            {isWebSearchActive && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 px-2 py-0.5 rounded-md">
                                                    <Globe className="w-3 h-3 text-sky-500" />
                                                    Web Search
                                                    <button onClick={() => setIsWebSearchActive(false)} className="hover:text-sky-900 dark:hover:text-white ml-0.5">
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </span>
                                            )}
                                            {activeSkills.map((sId) => {
                                                const s = (essential_skills || DEFAULT_SKILLS).find(item => item.id === sId);
                                                return (
                                                    <span key={sId} className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#635bff]/10 dark:bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] border border-[#635bff]/25 dark:border-[#635bff]/30 px-2 py-0.5 rounded-md">
                                                        <Zap className="w-3 h-3 text-[#635bff]" />
                                                        {s?.name || sId}
                                                        <button onClick={() => toggleSkill(sId)} className="hover:text-rose-500 ml-0.5">
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />

                                        {/* '+' Button with Popover Menu */}
                                        <div className="relative" ref={plusMenuRef}>
                                            <button
                                                type="button"
                                                disabled={isUploading || isGenerating}
                                                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                                                className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                                                title="Attach, skills, and tools"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>

                                            {/* '+' Floating Menu */}
                                            {isPlusMenuOpen && (
                                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#1a1917] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#383734] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsPlusMenuOpen(false);
                                                            fileInputRef.current?.click();
                                                        }}
                                                        className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Paperclip className="w-4 h-4 text-neutral-400" />
                                                            <span>Add files or photos</span>
                                                        </div>
                                                        <span className="text-[10px] text-neutral-400 font-mono">⌘ U</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsPlusMenuOpen(false);
                                                            toast.info('Press ⌘ + Shift + 4 (Mac) or Win + Shift + S to screenshot and paste directly into chat!');
                                                        }}
                                                        className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center gap-2.5 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left"
                                                    >
                                                        <Camera className="w-4 h-4 text-neutral-400" />
                                                        <span>Take a screenshot</span>
                                                    </button>

                                                    {/* Skills Submenu */}
                                                    <div
                                                        className="relative"
                                                        onMouseEnter={() => setPlusSubmenu('skills')}
                                                        onMouseLeave={() => setPlusSubmenu(null)}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <Zap className="w-4 h-4 text-[#635bff] dark:text-[#788bff]" />
                                                                <span>Skills</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {activeSkills.length > 0 && (
                                                                    <span className="text-[10px] bg-[#635bff]/20 text-[#635bff] dark:text-[#9bb1ff] px-1.5 py-0.2 rounded font-semibold">
                                                                        {activeSkills.length}
                                                                    </span>
                                                                )}
                                                                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                                            </div>
                                                        </button>

                                                        {plusSubmenu === 'skills' && (
                                                            <div className="absolute left-full top-0 ml-1.5 w-64 bg-white dark:bg-[#1a1917] border border-neutral-200 dark:border-[#383734] rounded-xl shadow-2xl p-1.5 z-50">
                                                                <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                                                                    Essential Skills
                                                                </div>
                                                                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                                                    {(essential_skills || DEFAULT_SKILLS).map((skill) => {
                                                                        const isChecked = activeSkills.includes(skill.id);
                                                                        return (
                                                                            <button
                                                                                key={skill.id}
                                                                                type="button"
                                                                                onClick={() => toggleSkill(skill.id)}
                                                                                className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-between text-left transition-colors ${
                                                                                    isChecked ? 'bg-[#635bff]/10 dark:bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] font-medium' : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                                                                                }`}
                                                                            >
                                                                                <div>
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span>{skill.name}</span>
                                                                                        <span className="text-[9px] bg-neutral-100 dark:bg-white/10 text-neutral-500 px-1 rounded">
                                                                                            {skill.badge}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {isChecked && <Check className="w-3.5 h-3.5 text-[#635bff] dark:text-[#788bff]" />}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <div className="border-t border-neutral-100 dark:border-[#383734] my-1" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsPlusMenuOpen(false);
                                                                        setIsSkillsModalOpen(true);
                                                                        setSkillsModalTab('skills');
                                                                    }}
                                                                    className="w-full px-2 py-1.5 rounded-md text-[11px] text-left hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400"
                                                                >
                                                                    <Sliders className="w-3 h-3" />
                                                                    <span>Manage skills in Settings</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Connectors Submenu */}
                                                    <div
                                                        className="relative"
                                                        onMouseEnter={() => setPlusSubmenu('connectors')}
                                                        onMouseLeave={() => setPlusSubmenu(null)}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <Network className="w-4 h-4 text-neutral-400" />
                                                                <span>Connectors</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] bg-amber-500/20 text-amber-500 dark:text-amber-300 px-1 rounded font-mono">
                                                                    1
                                                                </span>
                                                                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                                                            </div>
                                                        </button>

                                                        {plusSubmenu === 'connectors' && (
                                                            <div className="absolute left-full top-0 ml-1.5 w-64 bg-white dark:bg-[#1a1917] border border-neutral-200 dark:border-[#383734] rounded-xl shadow-2xl p-1.5 z-50">
                                                                <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                                                                    Connectors
                                                                </div>
                                                                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                                                                    {(connectors || DEFAULT_CONNECTORS).map((c) => (
                                                                        <div
                                                                            key={c.id}
                                                                            className="px-2 py-1.5 rounded-lg text-xs flex items-center justify-between text-neutral-700 dark:text-neutral-300"
                                                                        >
                                                                            <span className="truncate pr-1">{c.name}</span>
                                                                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono flex-shrink-0 ${
                                                                                c.status === 'connected' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                                                            }`}>
                                                                                {c.badge}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="border-t border-neutral-100 dark:border-[#383734] my-1" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsPlusMenuOpen(false);
                                                                        setIsSkillsModalOpen(true);
                                                                        setSkillsModalTab('connectors');
                                                                    }}
                                                                    className="w-full px-2 py-1.5 rounded-md text-[11px] text-left hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400"
                                                                >
                                                                    <Sliders className="w-3 h-3" />
                                                                    <span>Configure connectors in Settings</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Web search toggle */}
                                                    <div className="border-t border-neutral-100 dark:border-[#383734] my-1" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsWebSearchActive(!isWebSearchActive);
                                                            toast.info(isWebSearchActive ? 'Web search disabled' : 'Web search enabled');
                                                        }}
                                                        className="w-full px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Globe className="w-4 h-4 text-neutral-400" />
                                                            <span>Web search</span>
                                                        </div>
                                                        {isWebSearchActive && (
                                                            <Check className="w-4 h-4 text-sky-500 font-bold" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

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
                                            className="flex-1 bg-transparent border-none text-[14px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none resize-none max-h-32 py-0.5 leading-normal"
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
                                                            className="text-xs cursor-pointer hover:bg-[#635bff]/10 hover:text-[#635bff]"
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
                                                    inputValue.trim() && !isGenerating ? 'bg-[#635bff] text-white hover:bg-[#5465ff] active:scale-95 shadow-xs'
                                                        : 'bg-neutral-200 dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                                                }`}
                                            >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Claude-style Notice (Left) & Model Selector (Right) */}
                                <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400 dark:text-neutral-500 select-none">
                                    <p className="truncate pr-2">
                                        Dynime is AI and can make mistakes. Please double-check responses.
                                    </p>

                                    <div className="relative" ref={modelMenuRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium text-xs transition-colors"
                                        >
                                            <span>{(available_models || DEFAULT_MODELS).find(m => m.id === selectedModel)?.name || 'DComposer'}</span>
                                            <span className="text-[10px] opacity-60 font-mono">
                                                {(available_models || DEFAULT_MODELS).find(m => m.id === selectedModel)?.badge || 'Default'}
                                            </span>
                                            <ChevronDown className="w-3 h-3 opacity-60" />
                                        </button>

                                        {isModelSelectorOpen && (
                                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-[#191920] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl p-1 z-50 text-neutral-900 dark:text-white animate-in fade-in zoom-in-95">
                                                <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                                    Select Intelligence Model
                                                </div>
                                                <div className="max-h-72 overflow-y-auto space-y-0.5">
                                                    {(available_models || DEFAULT_MODELS).map((m) => {
                                                        const isSelected = selectedModel === m.id;
                                                        return (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedModel(m.id);
                                                                    setIsModelSelectorOpen(false);
                                                                    toast.success(`Active model: ${m.name}`);
                                                                }}
                                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-[#635bff]/10 dark:bg-[#635bff]/15 font-semibold text-[#635bff] dark:text-[#9bb1ff]'
                                                                        : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                                                                }`}
                                                            >
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span>{m.name}</span>
                                                                        <span className="text-[9px] font-mono px-1 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500">
                                                                            {m.badge}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check className="w-3.5 h-3.5 text-[#635bff] dark:text-[#788bff] flex-shrink-0" />
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
                        </div>
                    )}
                </main>

                {/* PERPLEXITY-STYLE DYNAMIC PRICING MODAL */}
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
                currentPlanSlug={userPlan}
                plans={plans}
                onPlanUpdated={(newSlug) => {
                    setUserPlan(newSlug);
                }}
            />

            {/* SKILLS & CONNECTORS SETTINGS MODAL */}
                {isSkillsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-[#191920] border border-neutral-200 dark:border-white/10 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-white">
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#635bff]/10 dark:bg-[#635bff]/15 text-[#635bff] dark:text-[#788bff] flex items-center justify-center">
                                        <Sliders className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Skills & Connectors Settings</h3>
                                        <p className="text-xs text-neutral-500">Attach enterprise skills and data pipes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSkillsModalOpen(false)}
                                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex border-b border-neutral-200 dark:border-white/10 px-6 gap-4 text-xs font-medium">
                                <button
                                    onClick={() => setSkillsModalTab('skills')}
                                    className={`py-3 border-b-2 transition-colors ${
                                        skillsModalTab === 'skills'
                                            ? 'border-[#635bff] text-[#635bff] dark:text-[#788bff]'
                                            : 'border-transparent text-neutral-500'
                                    }`}
                                >
                                    Essential Skills
                                </button>
                                <button
                                    onClick={() => setSkillsModalTab('connectors')}
                                    className={`py-3 border-b-2 transition-colors ${
                                        skillsModalTab === 'connectors'
                                            ? 'border-[#635bff] text-[#635bff] dark:text-[#788bff]'
                                            : 'border-transparent text-neutral-500'
                                    }`}
                                >
                                    Connectors
                                </button>
                            </div>

                            <div className="p-6 max-h-80 overflow-y-auto space-y-2.5">
                                {skillsModalTab === 'skills' && (
                                    (essential_skills || DEFAULT_SKILLS).map((skill) => {
                                        const isAttached = activeSkills.includes(skill.id);
                                        return (
                                            <div
                                                key={skill.id}
                                                className="p-3 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold">{skill.name}</span>
                                                        <span className="text-[10px] bg-neutral-100 dark:bg-white/10 px-1.5 py-0.2 rounded text-neutral-400 font-mono">
                                                            {skill.badge}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-neutral-400 mt-0.5">{skill.description}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSkill(skill.id)}
                                                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                        isAttached
                                                            ? 'bg-[#635bff] text-white'
                                                            : 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300'
                                                    }`}
                                                >
                                                    {isAttached ? 'Active' : 'Attach'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}

                                {skillsModalTab === 'connectors' && (
                                    (connectors || DEFAULT_CONNECTORS).map((c) => (
                                        <div
                                            key={c.id}
                                            className="p-3 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold">{c.name}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                                        c.status === 'connected' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                                    }`}>
                                                        {c.badge}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-400 mt-0.5">{c.description}</p>
                                            </div>
                                            <button
                                                onClick={() => toast.success(`Connector verified: ${c.name}`)}
                                                className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                                            >
                                                {c.status === 'connected' ? 'Verified' : 'Connect'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="px-6 py-3 border-t border-neutral-200 dark:border-white/10 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsSkillsModalOpen(false)}
                                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLAUDE / KIMI STYLE RIGHT-SIDE DOCUMENT PREVIEW DRAWER (MATCHING SCREENSHOT 4 1000%) */}
                {previewDoc && (
                    <aside className={`flex flex-col h-full bg-[#fcfcfd] dark:bg-[#121216] border-l border-neutral-200 dark:border-white/[0.08] transition-all duration-300 z-30 ${
                        isPreviewExpanded ? 'w-full' : 'w-full lg:w-1/2'
                    }`}>
                        {/* Drawer Header matching Screenshot 4 */}
                        <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#15151a] flex-shrink-0 select-none">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-[#635bff] dark:text-[#788bff]" />
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

            {/* LEARN MORE MODAL (POLICY, TERMS, CAREERS, ABOUT) */}
            {isLearnMoreModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#15151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff]">
                                    <Info className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-sm">Dynime AI Resource Center</h3>
                            </div>
                            <button
                                onClick={() => setIsLearnMoreModalOpen(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 pt-2 gap-4 text-xs font-medium">
                            <button
                                onClick={() => setLearnMoreActiveTab('policy')}
                                className={`pb-2.5 border-b-2 transition-colors ${
                                    learnMoreActiveTab === 'policy'
                                        ? 'border-[#635bff] text-[#635bff] dark:text-[#9bb1ff]'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                Privacy Policy
                            </button>
                            <button
                                onClick={() => setLearnMoreActiveTab('terms')}
                                className={`pb-2.5 border-b-2 transition-colors ${
                                    learnMoreActiveTab === 'terms'
                                        ? 'border-[#635bff] text-[#635bff] dark:text-[#9bb1ff]'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                Terms of Service
                            </button>
                            <button
                                onClick={() => setLearnMoreActiveTab('careers')}
                                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                                    learnMoreActiveTab === 'careers'
                                        ? 'border-[#635bff] text-[#635bff] dark:text-[#9bb1ff]'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <span>Careers</span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">We're hiring</span>
                            </button>
                            <button
                                onClick={() => setLearnMoreActiveTab('about')}
                                className={`pb-2.5 border-b-2 transition-colors ${
                                    learnMoreActiveTab === 'about'
                                        ? 'border-[#635bff] text-[#635bff] dark:text-[#9bb1ff]'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                About
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 space-y-3">
                            {learnMoreActiveTab === 'policy' && (
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">Privacy & Data Governance</h4>
                                    <p>At Dynime AI, protecting corporate and user data is our highest institutional priority. We enforce zero training on customer proprietary data, encrypted storage at rest (AES-256), and end-to-end TLS 1.3 transit encryption.</p>
                                    <p className="mt-2">All conversational interactions are tenant-isolated and compliant with global GDPR, CCPA, and European AI Act regulatory standards.</p>
                                </div>
                            )}

                            {learnMoreActiveTab === 'terms' && (
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">Terms of Service & Usage SLA</h4>
                                    <p>Dynime AI provides enterprise-grade multi-model orchestration, deep research, and document generation capabilities. Users retain complete copyright and commercial ownership of all generated documents, tables, and code artifacts.</p>
                                    <p className="mt-2">Standard uptime commitment is 99.9% across our distributed inference clusters and API gateway endpoints.</p>
                                </div>
                            )}

                            {learnMoreActiveTab === 'careers' && (
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">Build the Future of Enterprise AI at Dynime</h4>
                                    <p>We are expanding our core intelligence, model routing, and systems engineering teams globally. If you are passionate about high-throughput inference, agentic swarms, and elegant product craft, we would love to meet you.</p>
                                    <div className="mt-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-neutral-900 dark:text-white">Senior Full-Stack AI Engineer</p>
                                            <p className="text-[11px] text-neutral-400">Remote / Hybrid · Full-time</p>
                                        </div>
                                        <a href="https://dynime.com/careers" target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-lg bg-[#635bff] text-white text-xs font-medium hover:bg-[#5465ff] transition-colors">Apply</a>
                                    </div>
                                </div>
                            )}

                            {learnMoreActiveTab === 'about' && (
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">About Dynime Inc.</h4>
                                    <p>Dynime AI is an enterprise-grade artificial intelligence operating system engineered for founders, researchers, and global enterprises. Our mission is to seamlessly unite frontier reasoning models, native spreadsheet compilation, and agentic workflows into a singular unified studio.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center text-xs">
                            <span className="text-neutral-400">Dynime AI Enterprise v2.4</span>
                            <a href="https://dynime.com" target="_blank" rel="noopener noreferrer" className="text-[#635bff] dark:text-[#9bb1ff] hover:underline flex items-center gap-1">
                                <span>dynime.com</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* GET APPS & EXTENSIONS MODAL */}
            {isAppsModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#15151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff]">
                                    <Download className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-sm">Dynime AI Desktop & Extensions</h3>
                            </div>
                            <button
                                onClick={() => setIsAppsModalOpen(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#635bff]/40 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#635bff]/10 text-[#635bff] flex items-center justify-center font-bold text-xs">
                                        mac
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">Dynime AI for macOS</p>
                                        <p className="text-[11px] text-neutral-400">Apple Silicon (M1/M2/M3/M4) & Intel</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toast.success('Starting Dynime Desktop for macOS download...')}
                                    className="px-3 py-1.5 rounded-lg bg-[#635bff] hover:bg-[#5465ff] text-white text-xs font-medium transition-colors"
                                >
                                    Download
                                </button>
                            </div>

                            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#635bff]/40 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                                        win
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">Dynime AI for Windows</p>
                                        <p className="text-[11px] text-neutral-400">Windows 11 & 10 (64-bit)</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toast.success('Starting Dynime Desktop for Windows download...')}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium hover:bg-[#635bff] dark:hover:bg-[#635bff] dark:hover:text-white transition-colors"
                                >
                                    Download
                                </button>
                            </div>

                            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-[#635bff]/40 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                                        ext
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">Chrome & Edge Extension</p>
                                        <p className="text-[11px] text-neutral-400">Contextual web copilot & instant sidebar</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toast.info('Chrome Web Store listing opening soon.')}
                                    className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Add to Chrome
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GET HELP MODAL */}
            {isHelpModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#15151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff]">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-sm">Help & Support</h3>
                            </div>
                            <button
                                onClick={() => setIsHelpModalOpen(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-3 text-xs leading-relaxed">
                            <p className="text-neutral-500 dark:text-neutral-400">Need assistance with your Dynime AI account, prompt capabilities, or enterprise gateway?</p>

                            <div className="space-y-2 mt-2">
                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                                    <p className="font-semibold text-neutral-900 dark:text-white">Keyboard Shortcuts</p>
                                    <div className="mt-1 space-y-1 text-neutral-500 dark:text-neutral-400">
                                        <div className="flex justify-between"><span>New discussion</span><kbd className="font-mono">⌘ K</kbd></div>
                                        <div className="flex justify-between"><span>Settings</span><kbd className="font-mono">⇧ ⌘ ,</kbd></div>
                                        <div className="flex justify-between"><span>Invoke plugins</span><kbd className="font-mono">/</kbd></div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-neutral-900 dark:text-white">Documentation</p>
                                        <p className="text-[11px] text-neutral-400">Guides, API reference & model benchmarks</p>
                                    </div>
                                    <a href="https://account.dynime.com/docs" target="_blank" rel="noopener noreferrer" className="text-[#635bff] hover:underline flex items-center gap-1 font-medium">
                                        <span>View</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* SHARE CHAT MODAL WITH SOCIAL PREVIEW */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#15151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff]">
                                    <Share2 className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-sm">Share Public Discussion</h3>
                            </div>
                            <button
                                onClick={() => setIsShareModalOpen(false)}
                                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <p className="text-neutral-500 dark:text-neutral-400">
                                Anyone with this link will be able to view this conversation and its synthesized artifacts.
                            </p>

                            {/* Social Preview Card matching requirements */}
                            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-4 space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                    <div className="flex items-center gap-1.5">
                                        <img src="https://cdn.dynime.com/Dynime%20Logo/LOGO%20PNG/dynime-logo.png" className="w-3.5 h-3.5 object-contain" alt="Dynime" />
                                        <span className="font-medium text-neutral-700 dark:text-neutral-300">ai.dynime.com</span>
                                    </div>
                                    <span className="text-[10px] bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] px-2 py-0.5 rounded-full font-mono">
                                        {selectedModel || 'DComposer'}
                                    </span>
                                </div>

                                <h4 className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-2">
                                    {activeConv?.title || 'Dynime AI Discussion'}
                                </h4>

                                <p className="text-neutral-500 dark:text-neutral-400 text-[11.5px] line-clamp-3 leading-relaxed">
                                    {messages[0]?.content
                                        ? messages[0].content.slice(0, 140) + '...'
                                        : 'Shared discussion analyzing strategic synthesis, executive models, and structured intelligence.'}
                                </p>

                                <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-[10.5px] text-neutral-400">
                                    <span>{messages.length} messages shared</span>
                                    <span>Dynime Cloud Gateway</span>
                                </div>
                            </div>

                            {/* Copy Link Input */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/chat?c=${activeConv?.uuid || ''}` : ''}
                                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 select-all"
                                />
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/chat?c=${activeConv?.uuid || ''}`;
                                        navigator.clipboard?.writeText(url);
                                        toast.success('Public link copied to clipboard!');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-[#635bff] hover:bg-[#5465ff] text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                </button>
                            </div>

                            {/* Quick Social Share Buttons */}
                            <div className="pt-2 flex items-center justify-between">
                                <span className="text-neutral-500 text-[11px]">Share directly to:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const url = encodeURIComponent(`${window.location.origin}/chat?c=${activeConv?.uuid || ''}`);
                                            const text = encodeURIComponent(`Check out this AI discussion on Dynime: ${activeConv?.title || ''}`);
                                            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-[11px] font-medium cursor-pointer"
                                    >
                                        X (Twitter)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const url = encodeURIComponent(`${window.location.origin}/chat?c=${activeConv?.uuid || ''}`);
                                            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-[11px] font-medium cursor-pointer"
                                    >
                                        LinkedIn
                                    </button>
                                    <button
                                        onClick={() => {
                                            const url = encodeURIComponent(`${window.location.origin}/chat?c=${activeConv?.uuid || ''}`);
                                            const text = encodeURIComponent(`Check out this Dynime AI discussion: ${activeConv?.title || ''} - ${url}`);
                                            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-[11px] font-medium cursor-pointer"
                                    >
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DYNAMIC CHAT LIBRARY DRAWER */}
            {isLibraryOpen && (
                <div className="fixed inset-y-0 right-0 z-[140] w-80 sm:w-96 bg-white dark:bg-[#141418] border-l border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-neutral-900 dark:text-white font-sans">
                    <div className="h-14 px-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <FolderArchive className="w-4 h-4 text-[#635bff] dark:text-[#788bff]" />
                            <h3 className="font-semibold text-sm">Chat Library</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] font-medium">
                                {chatLibraryItems.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsLibraryOpen(false)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-3 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-black/20 text-[11px] text-neutral-500 dark:text-neutral-400">
                        Click any file or deliverable below to instantly jump to its exact location in the discussion.
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
                        {chatLibraryItems.length === 0 ? (
                            <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
                                <FolderArchive className="w-8 h-8 mx-auto opacity-40 text-neutral-400" />
                                <p>No uploaded files or generated artifacts in this discussion yet.</p>
                            </div>
                        ) : (
                            chatLibraryItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => scrollToItem(item.elementId)}
                                    className="group flex items-center justify-between p-3 rounded-xl border border-neutral-200/80 dark:border-white/5 bg-neutral-50/70 dark:bg-[#18181f] hover:border-[#635bff]/50 hover:bg-[#635bff]/5 transition-all cursor-pointer shadow-2xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                                            {item.type === 'excel' ? (
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                            ) : item.type === 'presentation' ? (
                                                <Presentation className="w-4 h-4 text-amber-500" />
                                            ) : item.type === 'json' || item.type === 'code' ? (
                                                <FileCode className="w-4 h-4 text-blue-500" />
                                            ) : item.source === 'upload' ? (
                                                <Paperclip className="w-4 h-4 text-indigo-400" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-[#635bff]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate group-hover:text-[#635bff] dark:group-hover:text-[#9bb1ff] transition-colors">
                                                {item.title}
                                            </p>
                                            <p className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                                                <span className="capitalize">{item.source === 'upload' ? 'User Upload' : 'AI Generated'}</span>
                                                <span>·</span>
                                                <span>{item.size || item.type}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-2">
                                        <span className="text-[10.5px] text-[#635bff] dark:text-[#9bb1ff] font-medium flex items-center gap-0.5">
                                            Jump <ArrowUpRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* REAL-TIME CHAT SEARCH MODAL (SPOTLIGHT) */}
            {isSearchModalOpen && (
                <div className="fixed inset-0 z-[160] flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-[#15151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in zoom-in-95 duration-150">
                        {/* Search Input Bar */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-white/[0.06]">
                            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                            <input
                                type="text"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by chat title or message content in real-time..."
                                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <kbd className="hidden sm:inline-block text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                                ESC
                            </kbd>
                        </div>

                        {/* Search Results List */}
                        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 select-none">
                            {!searchQuery.trim() ? (
                                <div className="py-10 text-center text-xs text-neutral-400 space-y-1">
                                    <Search className="w-6 h-6 mx-auto opacity-30 text-neutral-400 mb-2" />
                                    <p className="font-medium">Type any keyword to search chats</p>
                                    <p className="text-[11px] text-neutral-500">Searches titles across all discussions & content within messages</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="py-10 text-center text-xs text-neutral-400 space-y-1">
                                    <p className="font-medium">No results found for "{searchQuery}"</p>
                                    <p className="text-[11px] text-neutral-500">Try a different title keyword or message phrasing</p>
                                </div>
                            ) : (
                                searchResults.map((res, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectSearchResult(res)}
                                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors group"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-[#635bff]/10 dark:bg-[#635bff]/20 flex items-center justify-center text-[#635bff] dark:text-[#9bb1ff] flex-shrink-0 mt-0.5">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate group-hover:text-[#635bff] dark:group-hover:text-[#9bb1ff] transition-colors">
                                                    {res.conv.title}
                                                </h4>
                                                <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono uppercase ${
                                                    res.matchType === 'content'
                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff]'
                                                }`}>
                                                    {res.matchType === 'content' ? 'In Content' : 'Title Match'}
                                                </span>
                                            </div>
                                            {res.snippet && (
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed font-sans">
                                                    {res.snippet}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="px-4 py-2 bg-neutral-50 dark:bg-black/20 border-t border-neutral-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-neutral-400">
                            <span>{searchResults.length} matching result{searchResults.length === 1 ? '' : 's'}</span>
                            <button
                                onClick={() => setIsSearchModalOpen(false)}
                                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
