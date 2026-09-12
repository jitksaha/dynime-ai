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

        $capabilities = [
            ['id' => 'auto', 'name' => 'Auto-Orchestrate', 'description' => 'Dynamic multi-model routing', 'badge' => 'Smart'],
            ['id' => 'fast', 'name' => 'Fast & Light', 'description' => 'Low-latency instantaneous replies', 'badge' => '⚡ Fast'],
            ['id' => 'deep_thinking', 'name' => 'Deep Thinking', 'description' => 'High-reasoning multi-step analysis', 'badge' => '🧠 Reasoning'],
            ['id' => 'coding', 'name' => 'Code Specialist', 'description' => 'Full-stack engineering & architecture', 'badge' => '💻 Code'],
            ['id' => 'vision', 'name' => 'Vision & Multimodal', 'description' => 'Deep document and image understanding', 'badge' => '👁️ Vision'],
            ['id' => 'research', 'name' => 'Deep Research', 'description' => 'Exhaustive data and multi-step investigation', 'badge' => '🔍 Research'],
            ['id' => 'creative', 'name' => 'Creative & Copy', 'description' => 'High-engagement copy & messaging', 'badge' => '✨ Creative'],
        ];

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'initial_conversation' => $activeConv,
            'active_providers' => $activeProviders,
            'capabilities' => $capabilities,
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
            'attachments' => 'nullable|array',
        ]);

        $conv = AiConversation::where('user_id', $user->id)
            ->where('uuid', $request->input('conversation_uuid'))
            ->firstOrFail();

        $capability = $request->input('capability', $conv->capability_profile ?? 'auto');
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

        // Orchestrate via DComposer
        $result = DComposer::process($user, $conv, $userInput, $capability, $attachments);

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
                'model' => $result['model'] ?? null,
                'latency_ms' => $result['latency_ms'] ?? null,
                'created_at' => now()->toIso8601String(),
            ],
            'conversation' => [
                'uuid' => $conv->uuid,
                'title' => $conv->title,
            ],
        ]);
    }

    public function stream(Request $request)
    {
        $user = Auth::user();

        $uuid = $request->input('c');
        $userInput = $request->input('m');
        $capability = $request->input('cap', 'auto');

        $conv = AiConversation::where('user_id', $user->id)
            ->where('uuid', $uuid)
            ->firstOrFail();

        // Save user message if not already present
        $userMsg = AiMessage::create([
            'conversation_id' => $conv->id,
            'role' => 'user',
            'content' => $userInput,
            'capability_profile' => $capability,
        ]);

        if ($conv->title === 'New Discussion' || $conv->title === 'New Chat') {
            $conv->title = Str::limit(trim($userInput), 36, '...');
            $conv->save();
        }

        return new StreamedResponse(function () use ($user, $conv, $userInput, $capability) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no');

            echo "data: " . json_encode(['type' => 'status', 'content' => 'Routing through DComposer engine...']) . "\n\n";
            ob_flush();
            flush();

            $result = DComposer::process($user, $conv, $userInput, $capability);

            // Stream words or small tokens
            $content = $result['content'];
            $chunks = preg_split('/(\s+)/u', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
            foreach ($chunks as $chunk) {
                echo "data: " . json_encode(['type' => 'token', 'content' => $chunk]) . "\n\n";
                ob_flush();
                flush();
                usleep(8000); // 8ms typewriter effect
            }

            echo "data: " . json_encode([
                'type' => 'done',
                'message_id' => $result['message_id'],
                'latency_ms' => $result['latency_ms'] ?? 0,
                'provider' => $result['provider'] ?? null,
                'model' => $result['model'] ?? null,
            ]) . "\n\n";
            ob_flush();
            flush();
        });
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
