<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AiSetting;
use App\Models\AiAuditLog;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Services\AIService;

class AdminAiController extends Controller
{
    public function index()
    {
        $settings = AiSetting::orderBy('is_active', 'desc')->get();
        $totalConvs = AiConversation::count();
        $totalMessages = AiMessage::count();
        $recentLogs = AiAuditLog::with('user')->orderBy('id', 'desc')->take(25)->get();

        $activeCount = $settings->where('is_active', true)->count();
        $avgLatency = round(AiAuditLog::where('status', 'success')->avg('latency_ms') ?: 0);
        $totalTokens = AiAuditLog::sum('tokens_used') ?: 0;

        $stats = [
            'total_conversations' => $totalConvs,
            'total_messages' => $totalMessages,
            'active_providers' => $activeCount,
            'avg_latency_ms' => $avgLatency,
            'total_tokens' => $totalTokens,
        ];

        return Inertia::render('Admin/Index', [
            'settings' => $settings->map(fn($s) => [
                'id' => $s->id,
                'provider' => $s->provider,
                'display_name' => $s->display_name,
                'default_model' => $s->default_model,
                'available_models' => $s->available_models,
                'capabilities' => $s->capabilities,
                'is_active' => $s->is_active,
                'is_default' => $s->is_default,
                'masked_api_key' => $s->getMaskedApiKey(),
                'base_url' => $s->base_url,
                'temperature' => $s->temperature,
                'max_tokens' => $s->max_tokens,
                'has_key' => !empty($s->getDecryptedApiKey()),
            ]),
            'stats' => $stats,
            'recent_logs' => $recentLogs,
        ]);
    }

    public function settings()
    {
        $settings = AiSetting::all();

        return Inertia::render('Admin/Settings', [
            'settings' => $settings->map(fn($s) => [
                'id' => $s->id,
                'provider' => $s->provider,
                'display_name' => $s->display_name,
                'default_model' => $s->default_model,
                'available_models' => $s->available_models,
                'capabilities' => $s->capabilities,
                'is_active' => $s->is_active,
                'is_default' => $s->is_default,
                'masked_api_key' => $s->getMaskedApiKey(),
                'base_url' => $s->base_url,
                'temperature' => $s->temperature,
                'max_tokens' => $s->max_tokens,
                'system_prompt' => $s->system_prompt,
                'has_key' => !empty($s->getDecryptedApiKey()),
            ]),
        ]);
    }

    public function updateProvider(Request $request, $id)
    {
        $setting = AiSetting::findOrFail($id);

        $data = $request->validate([
            'default_model' => 'nullable|string|max:128',
            'api_key' => 'nullable|string',
            'base_url' => 'nullable|string|max:500',
            'temperature' => 'nullable|numeric|between:0,2',
            'max_tokens' => 'nullable|integer|min:1|max:64000',
            'system_prompt' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
            'capabilities' => 'nullable|array',
        ]);

        if (!empty($data['api_key'])) {
            $setting->api_key = $data['api_key'];
        }

        if (isset($data['default_model'])) $setting->default_model = $data['default_model'];
        if (isset($data['base_url'])) $setting->base_url = $data['base_url'];
        if (isset($data['temperature'])) $setting->temperature = $data['temperature'];
        if (isset($data['max_tokens'])) $setting->max_tokens = $data['max_tokens'];
        if (isset($data['system_prompt'])) $setting->system_prompt = $data['system_prompt'];
        if (isset($data['is_active'])) $setting->is_active = (bool)$data['is_active'];
        if (isset($data['capabilities'])) $setting->capabilities = $data['capabilities'];

        if (!empty($data['is_default'])) {
            AiSetting::where('id', '!=', $setting->id)->update(['is_default' => false]);
            $setting->is_default = true;
        }

        $setting->save();

        return redirect()->back()->with('success', "Updated {$setting->display_name} configuration.");
    }

    public function toggleProvider(Request $request, $id)
    {
        $setting = AiSetting::findOrFail($id);
        $setting->is_active = !$setting->is_active;
        $setting->save();

        return response()->json([
            'success' => true,
            'is_active' => $setting->is_active,
            'message' => "{$setting->display_name} is now " . ($setting->is_active ? 'active' : 'disabled') . '.',
        ]);
    }

    public function testConnection(Request $request, $id)
    {
        $setting = AiSetting::findOrFail($id);

        // Allow testing with newly submitted key
        if ($request->filled('api_key')) {
            $setting->api_key = $request->input('api_key');
        }
        if ($request->filled('default_model')) {
            $setting->default_model = $request->input('default_model');
        }
        if ($request->filled('base_url')) {
            $setting->base_url = $request->input('base_url');
        }

        $res = AIService::testConnection($setting);

        return response()->json($res);
    }

    public function auditLogs(Request $request)
    {
        $logs = AiAuditLog::with('user')
            ->orderBy('id', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
