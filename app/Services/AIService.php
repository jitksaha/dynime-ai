<?php

namespace App\Services;

use App\Models\AiSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    /**
     * Send chat completion request to target provider.
     */
    public static function complete(
        AiSetting $setting,
        array $messages,
        ?string $systemPrompt = null,
        array $options = []
    ): array {
        $startTime = microtime(true);
        $apiKey = $setting->getDecryptedApiKey();

        if (empty($apiKey) && $setting->provider !== 'ollama') {
            return [
                'success' => false,
                'error' => "API Key for provider '{$setting->provider}' is missing or not configured.",
            ];
        }

        $provider = $setting->provider;
        $model = $options['model'] ?? $setting->default_model;
        $temperature = (float)($options['temperature'] ?? $setting->temperature ?? 0.7);
        $maxTokens = (int)($options['max_tokens'] ?? $setting->max_tokens ?? 4096);

        try {
            if (in_array($provider, ['openai', 'deepseek', 'groq', 'mistral', 'ollama'])) {
                $endpoint = $setting->base_url ?: self::getDefaultEndpoint($provider);
                
                $formattedMessages = [];
                if (!empty($systemPrompt)) {
                    $formattedMessages[] = ['role' => 'system', 'content' => $systemPrompt];
                }
                foreach ($messages as $m) {
                    $formattedMessages[] = [
                        'role' => $m['role'] === 'assistant' ? 'assistant' : 'user',
                        'content' => $m['content'],
                    ];
                }

                $headers = ['Content-Type' => 'application/json'];
                if (!empty($apiKey)) {
                    $headers['Authorization'] = "Bearer {$apiKey}";
                }

                $payload = [
                    'model' => $model,
                    'messages' => $formattedMessages,
                    'temperature' => $temperature,
                ];

                $isReasoning = str_starts_with($model, 'o1') || str_starts_with($model, 'o3') || str_contains($model, 'reasoner');
                if ($isReasoning) {
                    $payload['max_completion_tokens'] = $maxTokens;
                    unset($payload['temperature']);
                } else {
                    $payload['max_tokens'] = $maxTokens;
                }

                $response = Http::withHeaders($headers)
                    ->timeout(60)
                    ->post($endpoint, $payload);

                $latency = (int)((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    $json = $response->json();
                    $content = $json['choices'][0]['message']['content'] ?? '';
                    $usage = $json['usage'] ?? [];

                    return [
                        'success' => true,
                        'content' => $content,
                        'tokens_in' => $usage['prompt_tokens'] ?? null,
                        'tokens_out' => $usage['completion_tokens'] ?? null,
                        'latency_ms' => $latency,
                    ];
                }

                return [
                    'success' => false,
                    'error' => self::parseErrorMessage($response, $provider),
                    'latency_ms' => $latency,
                ];

            } elseif ($provider === 'claude') {
                $endpoint = $setting->base_url ?: 'https://api.anthropic.com/v1/messages';
                
                $claudeMessages = [];
                foreach ($messages as $m) {
                    $claudeMessages[] = [
                        'role' => $m['role'] === 'assistant' ? 'assistant' : 'user',
                        'content' => $m['content'],
                    ];
                }

                $payload = [
                    'model' => $model,
                    'max_tokens' => $maxTokens,
                    'messages' => $claudeMessages,
                ];

                if (!empty($systemPrompt)) {
                    $payload['system'] = $systemPrompt;
                }

                $response = Http::withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'Content-Type' => 'application/json',
                ])->timeout(60)->post($endpoint, $payload);

                $latency = (int)((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    $json = $response->json();
                    $content = '';
                    if (!empty($json['content']) && is_array($json['content'])) {
                        foreach ($json['content'] as $block) {
                            if (($block['type'] ?? '') === 'text') {
                                $content .= $block['text'];
                            }
                        }
                    }
                    $usage = $json['usage'] ?? [];

                    return [
                        'success' => true,
                        'content' => $content,
                        'tokens_in' => $usage['input_tokens'] ?? null,
                        'tokens_out' => $usage['output_tokens'] ?? null,
                        'latency_ms' => $latency,
                    ];
                }

                return [
                    'success' => false,
                    'error' => self::parseErrorMessage($response, $provider),
                    'latency_ms' => $latency,
                ];

            } elseif ($provider === 'gemini') {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                
                $contents = [];
                foreach ($messages as $m) {
                    $contents[] = [
                        'role' => $m['role'] === 'assistant' ? 'model' : 'user',
                        'parts' => [['text' => $m['content']]],
                    ];
                }

                $payload = [
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => $temperature,
                        'maxOutputTokens' => $maxTokens,
                    ],
                ];

                if (!empty($systemPrompt)) {
                    $payload['systemInstruction'] = [
                        'parts' => [['text' => $systemPrompt]],
                    ];
                }

                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(60)
                    ->post($url, $payload);

                $latency = (int)((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    $json = $response->json();
                    $content = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $usage = $json['usageMetadata'] ?? [];

                    return [
                        'success' => true,
                        'content' => $content,
                        'tokens_in' => $usage['promptTokenCount'] ?? null,
                        'tokens_out' => $usage['candidatesTokenCount'] ?? null,
                        'latency_ms' => $latency,
                    ];
                }

                return [
                    'success' => false,
                    'error' => self::parseErrorMessage($response, $provider),
                    'latency_ms' => $latency,
                ];
            }

            return [
                'success' => false,
                'error' => "Unsupported provider: {$provider}",
            ];

        } catch (\Throwable $e) {
            Log::error("AIService complete error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => "Connection failed: " . $e->getMessage(),
                'latency_ms' => (int)((microtime(true) - $startTime) * 1000),
            ];
        }
    }

    /**
     * Test connection to provider API.
     */
    public static function testConnection(AiSetting $setting): array
    {
        $apiKey = $setting->getDecryptedApiKey();
        if (empty($apiKey) && $setting->provider !== 'ollama') {
            return ['success' => false, 'error' => 'API Key is missing or empty.'];
        }

        $provider = $setting->provider;
        $model = $setting->default_model ?: self::getDefaultModel($provider);
        $startTime = microtime(true);

        try {
            if (in_array($provider, ['openai', 'deepseek', 'groq', 'mistral', 'ollama'])) {
                $endpoint = $setting->base_url ?: self::getDefaultEndpoint($provider);
                $headers = ['Content-Type' => 'application/json'];
                if (!empty($apiKey)) {
                    $headers['Authorization'] = "Bearer {$apiKey}";
                }

                $payload = [
                    'model' => $model,
                    'messages' => [['role' => 'user', 'content' => 'Test connection. Respond with OK.']],
                    'max_tokens' => 10,
                ];

                $res = Http::withHeaders($headers)->timeout(15)->post($endpoint, $payload);
            } elseif ($provider === 'claude') {
                $endpoint = $setting->base_url ?: 'https://api.anthropic.com/v1/messages';
                $res = Http::withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post($endpoint, [
                    'model' => $model,
                    'max_tokens' => 10,
                    'messages' => [['role' => 'user', 'content' => 'Test connection. Respond with OK.']],
                ]);
            } elseif ($provider === 'gemini') {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $res = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(15)
                    ->post($url, [
                        'contents' => [['parts' => [['text' => 'Test connection. Respond with OK.']]]],
                    ]);
            } else {
                return ['success' => false, 'error' => "Unknown provider: {$provider}"];
            }

            $latency = (int)((microtime(true) - $startTime) * 1000);

            if ($res->successful()) {
                return [
                    'success' => true,
                    'latency_ms' => $latency,
                    'message' => "Successfully connected to {$setting->display_name} ({$model}) in {$latency}ms!",
                ];
            }

            return [
                'success' => false,
                'latency_ms' => $latency,
                'error' => self::parseErrorMessage($res, $provider),
            ];

        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => 'Connection test failed: ' . $e->getMessage(),
                'latency_ms' => (int)((microtime(true) - $startTime) * 1000),
            ];
        }
    }

    public static function getDefaultEndpoint(string $provider): string
    {
        return match ($provider) {
            'openai' => 'https://api.openai.com/v1/chat/completions',
            'deepseek' => 'https://api.deepseek.com/chat/completions',
            'groq' => 'https://api.groq.com/openai/v1/chat/completions',
            'mistral' => 'https://api.mistral.ai/v1/chat/completions',
            'ollama' => 'http://localhost:11434/v1/chat/completions',
            default => 'https://api.openai.com/v1/chat/completions',
        };
    }

    public static function getDefaultModel(string $provider): string
    {
        return match ($provider) {
            'openai' => 'gpt-4o',
            'claude' => 'claude-3-7-sonnet-20250219',
            'gemini' => 'gemini-2.0-flash',
            'deepseek' => 'deepseek-chat',
            'groq' => 'llama-3.3-70b-versatile',
            'mistral' => 'mistral-large-latest',
            'ollama' => 'llama3:latest',
            default => 'gpt-4o',
        };
    }

    protected static function parseErrorMessage($response, string $provider): string
    {
        $body = $response->body();
        $status = $response->status();

        if ($status === 402 || str_contains(strtolower($body), 'insufficient balance') || str_contains(strtolower($body), 'quota')) {
            return "Account Quota Notice (402): API Key is verified, but your {$provider} account has insufficient balance or quota. Please top up your account balance.";
        }

        if ($status === 401) {
            return "Authentication Failed (401): Invalid API Key for {$provider}.";
        }

        $json = $response->json();
        if (!empty($json['error']['message'])) {
            return $json['error']['message'];
        }

        return "HTTP {$status}: " . substr($body, 0, 200);
    }
}
