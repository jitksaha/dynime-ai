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

    public static function getRoutingPlan(string $capability = 'auto'): array
    {
        $internalProfile = self::resolveInternalProfile($capability);

        // 1. Check if an active provider explicitly handles this capability
        $primary = AiSetting::where('is_active', true)
            ->get()
            ->first(function ($setting) use ($capability) {
                $caps = $setting->capabilities ?: [];
                return in_array($capability, $caps) || in_array('auto', $caps);
            });

        // 2. Fallback to any active setting
        if (!$primary) {
            $primary = AiSetting::where('is_active', true)->first();
        }

        // 3. Fallback pool of other configured providers
        $fallbackPool = AiSetting::where('is_active', true)
            ->when($primary, fn($q) => $q->where('id', '!=', $primary->id))
            ->get();

        return [
            'internal_profile' => $internalProfile,
            'primary' => $primary,
            'fallback_pool' => $fallbackPool,
        ];
    }
}
