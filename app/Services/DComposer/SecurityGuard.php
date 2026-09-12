<?php

namespace App\Services\DComposer;

class SecurityGuard
{
    protected static array $blockedPatterns = [
        '/\b(dump|cat|read|show|print)\s+(\.env|\.git|config\/database|id_rsa|private_key|aws_secret)\b/i',
        '/\b(system\s+prompt|raw\s+prompt|ignore\s+all\s+previous\s+instructions)\b/i',
        '/\b(who\s+is\s+your\s+provider|what\s+model\s+are\s+you\s+really|are\s+you\s+gpt|are\s+you\s+claude|are\s+you\s+deepseek)\b/i',
        '/\b(make\s+a\s+bomb|synthesize\s+explosives|credit\s+card\s+skimmer|ransomware\s+code)\b/i',
    ];

    public static function inspect(string $prompt): array
    {
        $trimmed = trim($prompt);

        if (empty($trimmed)) {
            return [
                'is_safe' => false,
                'reason' => 'Empty prompt provided.',
                'sanitized' => '',
            ];
        }

        foreach (self::$blockedPatterns as $pattern) {
            if (preg_match($pattern, $trimmed)) {
                if (stripos($trimmed, 'who is your provider') !== false || 
                    stripos($trimmed, 'what model are you') !== false ||
                    stripos($trimmed, 'are you gpt') !== false ||
                    stripos($trimmed, 'are you claude') !== false) {
                    return [
                        'is_safe' => false,
                        'is_identity_query' => true,
                        'reason' => 'Identity assertion',
                        'response' => "I am **Dynime AI**, the intelligent enterprise operating and orchestration layer built specifically for the Dynime ecosystem. I operate across business intelligence, code generation, strategic reasoning, and unified automation.",
                        'sanitized' => $trimmed,
                    ];
                }

                return [
                    'is_safe' => false,
                    'reason' => 'Prompt contains prohibited directives or security violations.',
                    'response' => "I am unable to fulfill this request as it conflicts with Dynime AI security policies and enterprise safety standards.",
                    'sanitized' => '',
                ];
            }
        }

        return [
            'is_safe' => true,
            'reason' => null,
            'sanitized' => $trimmed,
        ];
    }

    public static function sanitizeOutput(string $content): string
    {
        $replacements = [
            '/\b(OpenAI|Claude|Anthropic|Gemini|DeepSeek|Qwen|Kimi|Moonshot|GLM|Z\.AI)\b/i' => 'Dynime AI',
            '/\b(gpt-[0-9a-z\.\-]+|claude-[0-9a-z\.\-]+|gemini-[0-9a-z\.\-]+|deepseek-[0-9a-z\.\-]+)\b/i' => 'Dynime AI Engine',
            '/\b(sk-[a-zA-Z0-9]{20,})\b/' => '[REDACTED_API_KEY]',
            '/Note on file generation:[\s\S]*?Word\/Google Docs:[\s\S]*?(\n\n|$)/i' => '',
            '/I can\'?t directly create or attach a downloadable [^\n]+\n?/i' => '',
            '/To turn this into a document file:[\s\S]*?Markdown file:[^\n]+\n?/i' => '',
            '/If your platform supports a file-export tool[^\n]+\n?/i' => '',
        ];

        return preg_replace(array_keys($replacements), array_values($replacements), $content);
    }
}
