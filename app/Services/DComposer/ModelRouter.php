<?php

namespace App\Services\DComposer;

use App\Models\AiSetting;

class ModelRouter
{
    public static function resolveInternalProfile(string $capability): string
    {
        return match (strtolower($capability)) {
            'fast' => 'D-Fast',
            'thinking', 'deep-thinking', 'deep_thinking' => 'D-Reason',
            'coding' => 'D-Code',
            'vision' => 'D-Vision',
            'research' => 'D-Research',
            'creative' => 'D-Creative',
            default => 'D-Core',
        };
    }

    public static function getRoutingPlan(string $capability = 'auto', ?string $requestedModel = null): array
    {
        $internalProfile = self::resolveInternalProfile($capability);
        $emulatedModel = null;
        $primary = null;

        // 1. If a specific model was requested by the user
        if (!empty($requestedModel) && $requestedModel !== 'dcomposer' && $requestedModel !== 'auto') {
            // Find setting by model name or provider name
            $matchedSetting = AiSetting::where('is_active', true)
                ->where(function ($query) use ($requestedModel) {
                    $query->where('default_model', $requestedModel)
                        ->orWhere('provider', $requestedModel)
                        ->orWhere('display_name', 'like', "%{$requestedModel}%");
                })
                ->first();

            if ($matchedSetting && !empty($matchedSetting->getDecryptedApiKey())) {
                $primary = $matchedSetting;
            } else {
                // The requested model doesn't have a direct API key yet.
                // We will route through the flagship active engine (DeepSeek / Gemini),
                // but pass an emulatedModel persona so DComposer styles output accordingly!
                $emulatedModel = $requestedModel;
            }
        }

        // 2. Default routing if no specific model or if fallback needed
        if (!$primary) {
            // Priority to deepseek or gemini which have verified active keys
            $primary = AiSetting::where('is_active', true)
                ->whereIn('provider', ['deepseek', 'gemini'])
                ->whereNotNull('api_key')
                ->first();
        }

        // 3. Fallback to any active setting with a key
        if (!$primary) {
            $allActive = AiSetting::where('is_active', true)->get();
            $primary = $allActive->first(fn($s) => !empty($s->getDecryptedApiKey()) || $s->provider === 'ollama');
        }

        // 4. Absolute fallback
        if (!$primary) {
            $primary = AiSetting::where('is_active', true)->first();
        }

        // 5. Fallback pool
        $fallbackPool = AiSetting::where('is_active', true)
            ->when($primary, fn($q) => $q->where('id', '!=', $primary->id))
            ->get()
            ->filter(fn($s) => !empty($s->getDecryptedApiKey()) || $s->provider === 'ollama');

        return [
            'internal_profile' => $internalProfile,
            'primary' => $primary,
            'fallback_pool' => $fallbackPool,
            'emulated_model' => $emulatedModel,
            'requested_model' => $requestedModel ?: 'dcomposer',
        ];
    }
}
