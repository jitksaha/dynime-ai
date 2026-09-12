<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\AiConversation;
use App\Models\AiProject;
use App\Models\AiMessage;
use App\Models\AiAttachment;
use App\Models\AiSetting;
use App\Models\AiPlan;
use App\Services\DComposer\DComposer;

class ChatController extends Controller
{
    public function index(Request $request, $uuid = null)
    {
        $user = Auth::user();

        $conversations = AiConversation::where('user_id', $user->id)
            ->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get(['id', 'uuid', 'project_id', 'title', 'capability_profile', 'is_pinned', 'updated_at']);

        $activeConv = null;
        $targetUuid = $uuid ?: $request->query('c');
        if ($targetUuid) {
            $activeConv = AiConversation::with('messages')
                ->where('user_id', $user->id)
                ->where('uuid', $targetUuid)
                ->first();
        }

        if (!$activeConv && !$uuid && $conversations->isNotEmpty()) {
            $activeConv = AiConversation::with('messages')
                ->where('user_id', $user->id)
                ->where('id', $conversations->first()->id)
                ->first();
        }

        $activeProviders = AiSetting::where('is_active', true)->get(['id', 'provider', 'display_name', 'default_model']);

        $availableModels = [
            [
                'id' => 'dcomposer',
                'name' => 'DComposer',
                'provider' => 'dcomposer',
                'badge' => 'Flagship',
                'description' => 'Unified multi-model enterprise orchestrator (Auto-routing)',
            ],
            [
                'id' => 'claude-3-7-sonnet-20250219',
                'name' => 'Claude 3.7 Sonnet',
                'provider' => 'claude',
                'badge' => 'Hybrid Reasoning',
                'description' => 'Anthropic hybrid reasoning & architecture design',
            ],
            [
                'id' => 'claude-3-5-sonnet-20241022',
                'name' => 'Claude 3.5 Sonnet',
                'provider' => 'claude',
                'badge' => 'Coding Leader',
                'description' => 'Anthropic high-speed coding & analysis',
            ],
            [
                'id' => 'deepseek-chat',
                'name' => 'DeepSeek V3',
                'provider' => 'deepseek',
                'badge' => 'Fast Flagship',
                'description' => 'State-of-the-art open conversational intelligence',
            ],
            [
                'id' => 'deepseek-reasoner',
                'name' => 'DeepSeek R1',
                'provider' => 'deepseek',
                'badge' => 'Deep Reasoning',
                'description' => 'Mathematical, algorithmic & causal reasoning',
            ],
            [
                'id' => 'gemini-3.6-flash',
                'name' => 'Gemini 3.6 Flash',
                'provider' => 'gemini',
                'badge' => 'Next-Gen Fast',
                'description' => 'Google multimodal 1M+ token context',
            ],
            [
                'id' => 'gpt-4o',
                'name' => 'OpenAI GPT-4o',
                'provider' => 'openai',
                'badge' => 'Omni',
                'description' => 'OpenAI omni multimodal flagship',
            ],
            [
                'id' => 'llama-3.3-70b-versatile',
                'name' => 'Groq Llama 3.3',
                'provider' => 'groq',
                'badge' => '⚡ Instant LPU',
                'description' => 'Sub-second real-time token generation',
            ],
            [
                'id' => 'glm-5.2',
                'name' => 'Zai GLM-5.2',
                'provider' => 'zai',
                'badge' => 'Cognitive',
                'description' => 'Bilingual cognitive reasoning engine',
            ],
        ];

        $capabilities = [
            ['id' => 'auto', 'name' => 'Auto-Orchestrate', 'description' => 'Dynamic multi-model routing', 'badge' => 'Smart'],
            ['id' => 'fast', 'name' => 'Fast & Light', 'description' => 'Low-latency instantaneous replies', 'badge' => '⚡ Fast'],
            ['id' => 'deep_thinking', 'name' => 'Deep Thinking', 'description' => 'High-reasoning multi-step analysis', 'badge' => '🧠 Reasoning'],
            ['id' => 'coding', 'name' => 'Code Specialist', 'description' => 'Full-stack engineering & architecture', 'badge' => '💻 Code'],
            ['id' => 'vision', 'name' => 'Vision & Multimodal', 'description' => 'Deep document and image understanding', 'badge' => '👁️ Vision'],
            ['id' => 'research', 'name' => 'Deep Research', 'description' => 'Exhaustive data and multi-step investigation', 'badge' => '🔍 Research'],
            ['id' => 'creative', 'name' => 'Creative & Copy', 'description' => 'High-engagement copy & messaging', 'badge' => '✨ Creative'],
        ];

        $essentialSkills = [
            [
                'id' => 'financial_analyst',
                'name' => 'Financial Analyst',
                'icon' => 'TrendingUp',
                'description' => 'Institutional DCF, P&L, balance-sheet hygiene & valuation models',
                'badge' => 'Finance',
            ],
            [
                'id' => 'code_specialist',
                'name' => 'Code Reviewer & Architect',
                'icon' => 'Code2',
                'description' => 'Production clean code, TypeScript, PHP, microservices & refactoring',
                'badge' => 'Dev',
            ],
            [
                'id' => 'legal_auditor',
                'name' => 'Legal & Contract Auditor',
                'icon' => 'ShieldCheck',
                'description' => 'Compliance, MSA agreements, SLAs, liability & NDA risk analysis',
                'badge' => 'Legal',
            ],
            [
                'id' => 'sql_analyst',
                'name' => 'SQL & Data Architect',
                'icon' => 'Database',
                'description' => 'Schema design, index tuning, star queries & execution plans',
                'badge' => 'Data',
            ],
            [
                'id' => 'executive_memo',
                'name' => 'Executive Memo Drafter',
                'icon' => 'FileSpreadsheet',
                'description' => 'Board-level memos, strategic theses, operational milestones',
                'badge' => 'C-Suite',
            ],
            [
                'id' => 'deep_research',
                'name' => 'Deep Research Agent',
                'icon' => 'Compass',
                'description' => 'Multi-source empirical research, market trends & synthesized briefs',
                'badge' => 'Research',
            ],
        ];

        $connectors = [
            [
                'id' => 'erp_db',
                'name' => 'ERP Go Database',
                'icon' => 'Building2',
                'status' => 'connected',
                'badge' => 'Live Connected',
                'description' => 'Real-time synchronization with ERP entities and CRM accounts',
            ],
            [
                'id' => 'hostinger_server',
                'name' => 'Hostinger Cloud Infrastructure',
                'icon' => 'Server',
                'status' => 'connected',
                'badge' => 'Live Connected',
                'description' => 'Direct SSH/SFTP deployment and log monitoring pipeline',
            ],
            [
                'id' => 'smtp_mail',
                'name' => 'Corporate Email / SMTP',
                'icon' => 'Mail',
                'status' => 'connected',
                'badge' => 'Active',
                'description' => 'Outbound notification and report dissemination pipeline',
            ],
            [
                'id' => 'google_workspace',
                'name' => 'Google Workspace',
                'icon' => 'FolderGit2',
                'status' => 'needs_config',
                'badge' => 'Ready to Connect',
                'description' => 'Direct Drive, Docs, and Sheets integration',
            ],
            [
                'id' => 'github_enterprise',
                'name' => 'GitHub Enterprise',
                'icon' => 'GitBranch',
                'status' => 'needs_config',
                'badge' => 'Ready to Connect',
                'description' => 'Repository sync, pull request analysis, and CI/CD triggers',
            ],
        ];

        $plugins = [
            [
                'id' => 'excel_engine',
                'name' => 'Excel Spreadsheet Engine',
                'icon' => 'FileSpreadsheet',
                'active' => true,
                'description' => 'Generates native .xlsx workbooks with multi-tab financial models',
            ],
            [
                'id' => 'pdf_builder',
                'name' => 'PDF Document Builder',
                'icon' => 'FileText',
                'active' => true,
                'description' => 'Compiles executive documents and publication-ready memos',
            ],
            [
                'id' => 'python_sandbox',
                'name' => 'Python Analytics Sandbox',
                'icon' => 'Terminal',
                'active' => true,
                'description' => 'Executes quantitative data modeling and regression scripts',
            ],
            [
                'id' => 'diagram_architect',
                'name' => 'SVG Diagram Architect',
                'icon' => 'Layers',
                'active' => true,
                'description' => 'Renders interactive architecture, flowcharts, and sequence maps',
            ],
        ];

        $plans = class_exists(AiPlan::class) ? AiPlan::active()->get() : [];
        $dynamicSuggestions = $this->generateInspirationsForUser($user, $conversations);

        // Ensure default 2 projects exist if none created yet
        if (class_exists(AiProject::class)) {
            $projectCount = AiProject::where('user_id', $user->id)->count();
            if ($projectCount === 0) {
                AiProject::create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'name' => 'General Workspace',
                    'color' => '#635bff',
                    'icon' => 'Folder',
                    'is_collapsed' => false,
                ]);
                AiProject::create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'name' => 'Strategic Operations',
                    'color' => '#5465ff',
                    'icon' => 'Briefcase',
                    'is_collapsed' => false,
                ]);
            }
            $projects = AiProject::with(['conversations:id,uuid,project_id,title,updated_at'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'asc')
                ->get();
        } else {
            $projects = [];
        }

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'projects' => $projects,
            'initial_conversation' => $activeConv,
            'active_providers' => $activeProviders,
            'available_models' => $availableModels,
            'capabilities' => $capabilities,
            'essential_skills' => $essentialSkills,
            'connectors' => $connectors,
            'plugins' => $plugins,
            'current_plan_slug' => $user->current_plan_slug ?? 'free',
            'plans' => $plans,
            'dynamic_suggestions' => $dynamicSuggestions,
        ]);
    }

    public function getConversations()
    {
        $user = Auth::user();
        $conversations = AiConversation::where('user_id', $user->id)
            ->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get(['id', 'uuid', 'project_id', 'title', 'capability_profile', 'is_pinned', 'updated_at']);

        return response()->json($conversations);
    }

    public function storeConversation(Request $request)
    {
        $user = Auth::user();

        $projectId = null;
        if ($request->has('project_uuid')) {
            $proj = AiProject::where('user_id', $user->id)->where('uuid', $request->input('project_uuid'))->first();
            if ($proj) {
                $projectId = $proj->id;
            }
        }

        $conv = AiConversation::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'project_id' => $projectId,
            'title' => $request->input('title', 'New Discussion'),
            'capability_profile' => $request->input('capability', 'auto'),
        ]);

        $conv->load('messages');
        return response()->json($conv, 201);
    }

    public function showConversation($uuid)
    {
        $user = Auth::user();

        $conv = AiConversation::with('messages')
            ->where('user_id', $user->id)
            ->where('uuid', $uuid)
            ->firstOrFail();

        return response()->json($conv);
    }

    public function updateConversation(Request $request, $uuid)
    {
        $user = Auth::user();

        $conv = AiConversation::where('user_id', $user->id)
            ->where('uuid', $uuid)
            ->firstOrFail();

        if ($request->has('title')) {
            $conv->title = substr(trim($request->input('title')), 0, 255);
        }

        if ($request->has('is_pinned')) {
            $conv->is_pinned = (bool) $request->input('is_pinned');
        }

        if ($request->has('capability_profile')) {
            $conv->capability_profile = $request->input('capability_profile');
        }

        $conv->save();
        return response()->json($conv);
    }

    public function destroyConversation($uuid)
    {
        $user = Auth::user();

        $conv = AiConversation::where('user_id', $user->id)
            ->where('uuid', $uuid)
            ->firstOrFail();

        $conv->delete();
        return response()->json(['success' => true]);
    }

    public function sendMessage(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'conversation_uuid' => 'required|string',
            'message' => 'required|string',
            'capability' => 'nullable|string',
            'model' => 'nullable|string',
            'skills' => 'nullable|array',
            'web_search' => 'nullable|boolean',
            'attachments' => 'nullable|array',
        ]);

        $conv = AiConversation::where('user_id', $user->id)
            ->where('uuid', $request->input('conversation_uuid'))
            ->firstOrFail();

        $capability = $request->input('capability', $conv->capability_profile ?? 'auto');
        $model = $request->input('model', 'dcomposer');
        $skills = $request->input('skills', []);
        $webSearch = (bool) $request->input('web_search', false);
        $userInput = $request->input('message');
        $attachments = $request->input('attachments', []);

        // Save user message
        $userMsg = AiMessage::create([
            'conversation_id' => $conv->id,
            'role' => 'user',
            'content' => $userInput,
            'capability_profile' => $capability,
            'attachments' => count($attachments) > 0 ? $attachments : null,
        ]);

        // Auto-title conversation on first message
        if ($conv->title === 'New Discussion' || $conv->title === 'New Chat') {
            $conv->title = Str::limit(trim($userInput), 36, '...');
            $conv->save();
        }

        // Orchestrate via DComposer with model, skills and web search
        $result = DComposer::process(
            $user,
            $conv,
            $userInput,
            $capability,
            $attachments,
            $model,
            $skills,
            $webSearch
        );

        $conv->touch();

        return response()->json([
            'success' => true,
            'user_message' => $userMsg,
            'response' => [
                'id' => $result['message_id'],
                'role' => 'assistant',
                'content' => $result['content'],
                'capability_profile' => $capability,
                'provider' => $result['provider'] ?? null,
                'model' => $result['model'] ?? $model,
                'latency_ms' => $result['latency_ms'] ?? null,
                'created_at' => now()->toIso8601String(),
            ],
            'conversation' => [
                'uuid' => $conv->uuid,
                'title' => $conv->title,
            ],
        ]);
    }

    public function uploadAttachment(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'file' => 'required|file|max:15360', // 15MB
        ]);

        $file = $request->file('file');
        $origName = $file->getClientOriginalName();
        $mime = $file->getClientMimeType();
        $size = $file->getSize();

        $path = $file->store('ai_attachments', 'public');

        $extractedText = '';
        $ext = strtolower($file->getClientOriginalExtension());
        if (in_array($ext, ['txt', 'csv', 'md', 'json', 'log', 'html', 'js', 'ts', 'php', 'py'])) {
            $extractedText = Str::limit(file_get_contents($file->getRealPath()), 20000);
        }

        $attachment = AiAttachment::create([
            'user_id' => $user->id,
            'file_name' => $origName,
            'file_path' => $path,
            'mime_type' => $mime,
            'file_size' => $size,
            'extracted_text' => $extractedText,
        ]);

        return response()->json([
            'id' => $attachment->id,
            'name' => $attachment->file_name,
            'size' => $attachment->file_size,
            'url' => asset('storage/' . $path),
            'text' => $extractedText,
        ]);
    }

    public function getInspirations(Request $request)
    {
        $user = Auth::user();
        $conversations = AiConversation::where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get(['id', 'uuid', 'title', 'capability_profile', 'updated_at']);

        $suggestions = $this->generateInspirationsForUser($user, $conversations);

        return response()->json([
            'success' => true,
            'inspirations' => $suggestions,
        ]);
    }

    protected function generateInspirationsForUser($user, $conversations)
    {
        $demoPool = [
            [
                'id' => 'demo-1',
                'title' => 'Gargantua Deep Physics Model',
                'subtitle' => 'Relativistic raymarching & event horizon fluid mechanics simulation',
                'tag' => 'Physics / Numerical',
                'category' => 'science',
                'previewGradient' => 'from-[#635bff]/15 via-blue-950/20 to-purple-950/20',
                'prompt' => 'Generate a comprehensive technical report for relativistic raymarching around a rotating Kerr black hole with accretion disk dynamics. Include academic specification tables and generate full documentation.',
                'isDynamic' => false,
                'sourceLabel' => 'Core Physics',
            ],
            [
                'id' => 'demo-2',
                'title' => 'Open SEA Fluid Dynamics',
                'subtitle' => 'Navier-Stokes fluid solver & marine velocity vector flow analysis',
                'tag' => 'Hydrology / CFD',
                'category' => 'engineering',
                'previewGradient' => 'from-cyan-900/15 via-blue-900/15 to-[#635bff]/15',
                'prompt' => 'Formulate an end-to-end technical proposal for real-time 3D ocean wave height prediction using 2D shallow water equations and Navier-Stokes approximations. Generate full project documentation.',
                'isDynamic' => false,
                'sourceLabel' => 'Simulation',
            ],
            [
                'id' => 'demo-3',
                'title' => 'Global Market Equity Flow',
                'subtitle' => 'Cross-asset liquidity clustering & factor risk portfolio breakdown',
                'tag' => 'Quantitative Finance',
                'category' => 'finance',
                'previewGradient' => 'from-emerald-900/15 via-teal-900/15 to-slate-900/20',
                'prompt' => 'Prepare an institutional investment memorandum analyzing global macroeconomic liquidity flow across equities, sovereign debt, and commodities. Generate executive documentation and financial tables.',
                'isDynamic' => false,
                'sourceLabel' => 'Markets',
            ],
            [
                'id' => 'demo-4',
                'title' => 'Autonomous Multi-Agent Swarm',
                'subtitle' => 'Hierarchical ReAct protocols & distributed tool consensus orchestration',
                'tag' => 'Agentic AI',
                'category' => 'ai',
                'previewGradient' => 'from-violet-900/15 via-[#635bff]/20 to-indigo-900/15',
                'prompt' => 'Architect an autonomous multi-agent swarm system for complex data retrieval and verification using ReAct planning, tool-calling validation, and consensus synthesis. Outline step-by-step design.',
                'isDynamic' => false,
                'sourceLabel' => 'AI Swarm',
            ],
            [
                'id' => 'demo-5',
                'title' => 'Distributed Event Sourcing & CQRS',
                'subtitle' => 'High-throughput Kafka event streaming & eventual consistency mesh',
                'tag' => 'Cloud Systems',
                'category' => 'cloud',
                'previewGradient' => 'from-blue-900/15 via-indigo-900/15 to-neutral-900/20',
                'prompt' => 'Draft a high-level system design document for an event-sourced distributed ordering system utilizing Apache Kafka, PostgreSQL write models, and Redis read-replica projections.',
                'isDynamic' => false,
                'sourceLabel' => 'Architecture',
            ],
            [
                'id' => 'demo-6',
                'title' => 'Private Equity LBO & Waterfall Model',
                'subtitle' => 'Three-statement consolidation with debt amortization & hurdle rates',
                'tag' => 'Investment Banking',
                'category' => 'finance',
                'previewGradient' => 'from-amber-900/15 via-emerald-900/15 to-neutral-900/20',
                'prompt' => 'Build an institutional leveraged buyout (LBO) financial model with senior and mezzanine debt tranches, revolving credit facilities, and return sensitivity tables (MoIC and IRR).',
                'isDynamic' => false,
                'sourceLabel' => 'Financial Model',
            ],
            [
                'id' => 'demo-7',
                'title' => 'Multi-Tenant SaaS RBAC Engine',
                'subtitle' => 'Tenant database isolation, JWT SSO & dynamic permission trees',
                'tag' => 'Fullstack Engineering',
                'category' => 'code',
                'previewGradient' => 'from-[#5465ff]/15 via-indigo-900/15 to-slate-900/20',
                'prompt' => 'Design an enterprise-grade multi-tenant authorization framework with hierarchical RBAC, dynamic organization switching, and cryptographic token verification.',
                'isDynamic' => false,
                'sourceLabel' => 'Fullstack',
            ],
            [
                'id' => 'demo-8',
                'title' => 'Zero-Trust Cloud Security Audit',
                'subtitle' => 'Automated CVE dependency scans, IAM least-privilege & TLS policies',
                'tag' => 'Cybersecurity',
                'category' => 'security',
                'previewGradient' => 'from-rose-900/15 via-purple-900/15 to-neutral-900/20',
                'prompt' => 'Generate an enterprise zero-trust security architecture posture review covering AWS IAM policies, mTLS between microservices, secrets rotation, and automated audit logging.',
                'isDynamic' => false,
                'sourceLabel' => 'Infra Security',
            ],
            [
                'id' => 'demo-9',
                'title' => 'SaaS Unit Economics & Cohort Retention',
                'subtitle' => 'LTV/CAC sensitivity matrix, payback velocity & Net Revenue Retention',
                'tag' => 'Product Analytics',
                'category' => 'product',
                'previewGradient' => 'from-teal-900/15 via-cyan-900/15 to-neutral-900/20',
                'prompt' => 'Formulate a venture-grade financial model analyzing SaaS cohort churn, Net Revenue Retention (NRR), and customer acquisition cost (CAC) payback periods with charts and projections.',
                'isDynamic' => false,
                'sourceLabel' => 'Growth',
            ],
            [
                'id' => 'demo-10',
                'title' => 'CRISPR Target Sequence Scoring',
                'subtitle' => 'Off-target cleavage prediction & guide RNA kinetic binding efficiency',
                'tag' => 'Bioinformatics',
                'category' => 'science',
                'previewGradient' => 'from-green-900/15 via-emerald-900/15 to-neutral-900/20',
                'prompt' => 'Provide a detailed computational biology methodology for scoring CRISPR-Cas9 single guide RNA (sgRNA) on-target efficiency and off-target cleavage probability using machine learning.',
                'isDynamic' => false,
                'sourceLabel' => 'Bio Research',
            ],
            [
                'id' => 'demo-11',
                'title' => 'EU AI Act Regulatory Governance',
                'subtitle' => 'High-risk AI classification, technical documentation & audit trail readiness',
                'tag' => 'Legal & Compliance',
                'category' => 'legal',
                'previewGradient' => 'from-yellow-900/15 via-amber-900/15 to-neutral-900/20',
                'prompt' => 'Draft an executive compliance readiness checklist for deploying generative AI models under the European Union AI Act, focusing on risk categorization and explainability logs.',
                'isDynamic' => false,
                'sourceLabel' => 'Governance',
            ],
            [
                'id' => 'demo-12',
                'title' => 'Transformer FlashAttention-3 Profiler',
                'subtitle' => 'GPU SRAM memory hierarchy optimization & FP8 inference latency analysis',
                'tag' => 'Deep Learning',
                'category' => 'ai',
                'previewGradient' => 'from-fuchsia-900/15 via-purple-900/15 to-neutral-900/20',
                'prompt' => 'Conduct an in-depth hardware latency analysis of FlashAttention-3 kernels on modern GPU architectures, detailing asynchronous memory transfers, warp specialization, and FP8 precision.',
                'isDynamic' => false,
                'sourceLabel' => 'Optimization',
            ],
        ];

        $dynamicSuggestions = [];
        if ($conversations && $conversations->isNotEmpty()) {
            $seenTitles = [];
            foreach ($conversations->take(5) as $conv) {
                $title = trim($conv->title ?? '');
                if (!$title || in_array(strtolower($title), ['new discussion', 'new chat', 'hi', 'hello', 'test'])) {
                    continue;
                }
                if (in_array(strtolower($title), $seenTitles)) {
                    continue;
                }
                $seenTitles[] = strtolower($title);

                $tLower = strtolower($title);
                if (str_contains($tLower, 'physics') || str_contains($tLower, 'raymarch') || str_contains($tLower, 'relativist') || str_contains($tLower, 'black hole')) {
                    $dynamicSuggestions[] = [
                        'id' => 'dyn-' . $conv->id,
                        'title' => 'Kerr Accretion Disk Simulation',
                        'subtitle' => 'General relativistic magnetohydrodynamics & Doppler frame transformation',
                        'tag' => 'Astrophysics & GR',
                        'category' => 'science',
                        'previewGradient' => 'from-[#635bff]/25 via-indigo-950/30 to-purple-950/30',
                        'prompt' => 'Expand our relativistic raymarching exploration with General Relativistic Magnetohydrodynamics (GRMHD) equations and synchrotron emission tables for spinning black holes.',
                        'isDynamic' => true,
                        'sourceLabel' => '✨ Based on: ' . Str::limit($title, 22),
                    ];
                } elseif (str_contains($tLower, 'invest') || str_contains($tLower, 'finance') || str_contains($tLower, 'equity') || str_contains($tLower, 'macro') || str_contains($tLower, 'memorandum')) {
                    $dynamicSuggestions[] = [
                        'id' => 'dyn-' . $conv->id,
                        'title' => 'Macro Cross-Asset Risk Matrix',
                        'subtitle' => 'Yield curve inversion indicators, sovereign credit spreads & dollar liquidity',
                        'tag' => 'Macro Strategies',
                        'category' => 'finance',
                        'previewGradient' => 'from-emerald-900/20 via-teal-900/20 to-slate-900/25',
                        'prompt' => 'Conduct an institutional risk analysis connecting sovereign bond yield curve inversions with cross-asset equity equity risk premiums (ERP). Output tabular breakdowns.',
                        'isDynamic' => true,
                        'sourceLabel' => '✨ Based on: ' . Str::limit($title, 22),
                    ];
                } elseif (str_contains($tLower, 'architect') || str_contains($tLower, 'system') || str_contains($tLower, 'cloud') || str_contains($tLower, 'database') || str_contains($tLower, 'review')) {
                    $dynamicSuggestions[] = [
                        'id' => 'dyn-' . $conv->id,
                        'title' => 'Resilient Event-Driven Microservices',
                        'subtitle' => 'Outbox pattern, idempotent consumer consensus & zero-downtime canary deployment',
                        'tag' => 'Distributed Systems',
                        'category' => 'cloud',
                        'previewGradient' => 'from-blue-900/20 via-indigo-900/20 to-purple-900/25',
                        'prompt' => 'Design an enterprise transactional outbox pipeline with CDC (Change Data Capture) via Debezium and Kafka to guarantee atomic dual-writes across distributed microservices.',
                        'isDynamic' => true,
                        'sourceLabel' => '✨ Based on: ' . Str::limit($title, 22),
                    ];
                } elseif (str_contains($tLower, 'code') || str_contains($tLower, 'laravel') || str_contains($tLower, 'react') || str_contains($tLower, 'api')) {
                    $dynamicSuggestions[] = [
                        'id' => 'dyn-' . $conv->id,
                        'title' => 'High-Concurrency API Gateway',
                        'subtitle' => 'Token bucket rate-limiting, JWT cache replication & circuit breaker policies',
                        'tag' => 'Backend Engineering',
                        'category' => 'code',
                        'previewGradient' => 'from-[#5465ff]/20 via-violet-900/20 to-neutral-900/25',
                        'prompt' => 'Architect a high-concurrency API gateway layer featuring token bucket rate-limiting with Redis, automated circuit-breaking, and end-to-end distributed tracing headers.',
                        'isDynamic' => true,
                        'sourceLabel' => '✨ Based on: ' . Str::limit($title, 22),
                    ];
                } else {
                    $dynamicSuggestions[] = [
                        'id' => 'dyn-' . $conv->id,
                        'title' => 'Deep Dive: ' . Str::limit($title, 26),
                        'subtitle' => 'Advanced theoretical expansion, comparative tradeoffs & executive roadmap',
                        'tag' => 'Follow-up Synthesis',
                        'category' => 'ai',
                        'previewGradient' => 'from-[#635bff]/20 via-purple-900/15 to-neutral-900/20',
                        'prompt' => 'Provide an advanced, deep-dive expansion on "' . $title . '", detailing technical architecture, edge cases, comparative benchmarks, and an implementation checklist.',
                        'isDynamic' => true,
                        'sourceLabel' => '✨ Based on recent chat',
                    ];
                }
            }
        }

        return array_merge($dynamicSuggestions, $demoPool);
    }

    public function getProjects()
    {
        $user = Auth::user();
        $projects = AiProject::with(['conversations:id,uuid,project_id,title,updated_at'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json($projects);
    }

    public function storeProject(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'name' => 'required|string|max:128',
        ]);

        $project = AiProject::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'name' => trim($request->input('name')),
            'color' => $request->input('color', '#635bff'),
            'icon' => $request->input('icon', 'Folder'),
            'is_collapsed' => false,
        ]);

        $project->load(['conversations:id,uuid,project_id,title,updated_at']);
        return response()->json($project, 201);
    }

    public function toggleProjectCollapse(Request $request, $uuid)
    {
        $user = Auth::user();
        $project = AiProject::where('user_id', $user->id)->where('uuid', $uuid)->firstOrFail();
        $project->is_collapsed = !$project->is_collapsed;
        $project->save();

        return response()->json(['success' => true, 'is_collapsed' => $project->is_collapsed]);
    }

    public function destroyProject($uuid)
    {
        $user = Auth::user();
        $project = AiProject::where('user_id', $user->id)->where('uuid', $uuid)->firstOrFail();
        AiConversation::where('project_id', $project->id)->update(['project_id' => null]);
        $project->delete();

        return response()->json(['success' => true]);
    }

    public function moveConversationToProject(Request $request, $uuid)
    {
        $user = Auth::user();
        $conv = AiConversation::where('user_id', $user->id)->where('uuid', $uuid)->firstOrFail();

        $projectUuid = $request->input('project_uuid');
        if ($projectUuid) {
            $project = AiProject::where('user_id', $user->id)->where('uuid', $projectUuid)->firstOrFail();
            $conv->project_id = $project->id;
        } else {
            $conv->project_id = null;
        }

        $conv->save();
        return response()->json(['success' => true, 'project_id' => $conv->project_id]);
    }

}
