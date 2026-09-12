<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AiSetting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class AiSettingSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create or retrieve Admin
        $admin = User::where('email', 'admin@dynime.com')->first();
        if (!$admin) {
            $admin = new User();
            $admin->email = 'admin@dynime.com';
            $admin->name = 'Dynime AI Administrator';
            $admin->password = Hash::make('Dynime@2026!');
            if (Schema::hasColumn('users', 'type')) $admin->type = 'company';
            if (Schema::hasColumn('users', 'role')) $admin->role = 'admin';
            $admin->save();
        }

        // 2. Preset AI Providers with modern catalog
        $providers = [
            [
                'provider' => 'openai',
                'display_name' => 'OpenAI',
                'base_url' => 'https://api.openai.com/v1/chat/completions',
                'default_model' => 'gpt-4o',
                'available_models' => [
                    'gpt-4o' => ['name' => 'GPT-4o (Omni flagship)', 'type' => 'chat'],
                    'gpt-4o-mini' => ['name' => 'GPT-4o Mini (Ultra fast)', 'type' => 'chat'],
                    'o1' => ['name' => 'o1 (Deep Reasoning)', 'type' => 'reasoning'],
                    'o3-mini' => ['name' => 'o3-mini (High-speed reasoning)', 'type' => 'reasoning'],
                ],
                'capabilities' => ['auto', 'fast', 'deep_thinking', 'coding', 'vision'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => true,
            ],
            [
                'provider' => 'claude',
                'display_name' => 'Anthropic Claude',
                'base_url' => 'https://api.anthropic.com/v1/messages',
                'default_model' => 'claude-3-7-sonnet-20250219',
                'available_models' => [
                    'claude-3-7-sonnet-20250219' => ['name' => 'Claude 3.7 Sonnet (Hybrid reasoning)', 'type' => 'reasoning'],
                    'claude-3-5-sonnet-20241022' => ['name' => 'Claude 3.5 Sonnet (Coding leader)', 'type' => 'chat'],
                    'claude-3-5-haiku-20241022' => ['name' => 'Claude 3.5 Haiku (Lightning fast)', 'type' => 'chat'],
                ],
                'capabilities' => ['auto', 'coding', 'deep_thinking', 'creative', 'research'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => false,
            ],
            [
                'provider' => 'gemini',
                'display_name' => 'Google Gemini',
                'base_url' => 'https://generativelanguage.googleapis.com/v1beta/models',
                'default_model' => 'gemini-2.0-flash',
                'available_models' => [
                    'gemini-2.0-flash' => ['name' => 'Gemini 2.0 Flash (Next-gen fast)', 'type' => 'chat'],
                    'gemini-2.0-pro-exp-02-05' => ['name' => 'Gemini 2.0 Pro Experimental', 'type' => 'chat'],
                    'gemini-1.5-pro' => ['name' => 'Gemini 1.5 Pro (2M context)', 'type' => 'chat'],
                    'gemini-1.5-flash' => ['name' => 'Gemini 1.5 Flash (Lightweight)', 'type' => 'chat'],
                ],
                'capabilities' => ['auto', 'fast', 'vision', 'research'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => false,
            ],
            [
                'provider' => 'deepseek',
                'display_name' => 'DeepSeek',
                'base_url' => 'https://api.deepseek.com/chat/completions',
                'default_model' => 'deepseek-chat',
                'available_models' => [
                    'deepseek-chat' => ['name' => 'DeepSeek-V3 (State-of-the-art chat)', 'type' => 'chat'],
                    'deepseek-reasoner' => ['name' => 'DeepSeek-R1 (Open reasoning)', 'type' => 'reasoning'],
                ],
                'capabilities' => ['auto', 'coding', 'deep_thinking', 'fast'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => false,
            ],
            [
                'provider' => 'groq',
                'display_name' => 'Groq (Ultra-Fast LPU)',
                'base_url' => 'https://api.groq.com/openai/v1/chat/completions',
                'default_model' => 'llama-3.3-70b-versatile',
                'available_models' => [
                    'llama-3.3-70b-versatile' => ['name' => 'Llama 3.3 70B Versatile', 'type' => 'chat'],
                    'llama-3.1-8b-instant' => ['name' => 'Llama 3.1 8B Instant', 'type' => 'chat'],
                    'mixtral-8x7b-32768' => ['name' => 'Mixtral 8x7B MoE', 'type' => 'chat'],
                    'deepseek-r1-distill-llama-70b' => ['name' => 'DeepSeek R1 Distill Llama 70B', 'type' => 'reasoning'],
                ],
                'capabilities' => ['fast', 'auto', 'coding'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => false,
            ],
            [
                'provider' => 'mistral',
                'display_name' => 'Mistral AI',
                'base_url' => 'https://api.mistral.ai/v1/chat/completions',
                'default_model' => 'mistral-large-latest',
                'available_models' => [
                    'mistral-large-latest' => ['name' => 'Mistral Large', 'type' => 'chat'],
                    'codestral-latest' => ['name' => 'Codestral (Code expert)', 'type' => 'chat'],
                    'mistral-small-latest' => ['name' => 'Mistral Small', 'type' => 'chat'],
                ],
                'capabilities' => ['auto', 'coding', 'creative'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => false,
            ],
            [
                'provider' => 'ollama',
                'display_name' => 'Ollama (Local / Self-Hosted)',
                'base_url' => 'http://localhost:11434/v1/chat/completions',
                'default_model' => 'llama3:latest',
                'available_models' => [
                    'llama3:latest' => ['name' => 'Llama 3 Local', 'type' => 'chat'],
                    'deepseek-r1:latest' => ['name' => 'DeepSeek R1 Local', 'type' => 'reasoning'],
                    'mistral:latest' => ['name' => 'Mistral Local', 'type' => 'chat'],
                ],
                'capabilities' => ['auto', 'fast', 'coding'],
                'temperature' => 0.70,
                'max_tokens' => 4096,
                'is_active' => false,
                'is_default' => false,
            ],
        ];

        foreach ($providers as $data) {
            AiSetting::updateOrCreate(
                ['provider' => $data['provider']],
                array_merge($data, ['created_by' => $admin->id])
            );
        }
    }
}
