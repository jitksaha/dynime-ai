<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\AiAttachment;
use App\Models\AiSetting;
use App\Services\DComposer\DComposer;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $conversations = AiConversation::where('user_id', $user->id)
            ->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get(['id', 'uuid', 'title', 'capability_profile', 'is_pinned', 'updated_at']);

        $activeConv = null;
        $uuid = $request->query('c');
        if ($uuid) {
            $activeConv = AiConversation::with('messages')
                ->where('user_id', $user->id)
                ->where('uuid', $uuid)
                ->first();
        }

        if (!$activeConv && $conversations->isNotEmpty()) {
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

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'initial_conversation' => $activeConv,
            'active_providers' => $activeProviders,
            'available_models' => $availableModels,
            'capabilities' => $capabilities,
            'essential_skills' => $essentialSkills,
            'connectors' => $connectors,
            'plugins' => $plugins,
        ]);
    }

    public function getConversations()
    {
        $user = Auth::user();
        $conversations = AiConversation::where('user_id', $user->id)
            ->orderBy('is_pinned', 'desc')
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get(['id', 'uuid', 'title', 'capability_profile', 'is_pinned', 'updated_at']);

        return response()->json($conversations);
    }

    public function storeConversation(Request $request)
    {
        $user = Auth::user();

        $conv = AiConversation::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
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
}
