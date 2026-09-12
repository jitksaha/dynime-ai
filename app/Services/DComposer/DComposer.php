<?php

namespace App\Services\DComposer;

use App\Models\User;
use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\AiAuditLog;
use App\Services\AIService;
use Illuminate\Support\Facades\Log;

class DComposer
{
    public static function process(
        User $user,
        AiConversation $conversation,
        string $userInput,
        string $capability = 'auto',
        array $attachments = []
    ): array {
        $startTime = microtime(true);

        // 1. Security & Guardrail Check
        $securityCheck = SecurityGuard::inspect($userInput);
        if (!$securityCheck['is_safe']) {
            $refusal = $securityCheck['response'] ?? 'I cannot process this request due to enterprise safety policies.';
            
            $msg = AiMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $refusal,
                'capability_profile' => $capability,
                'latency_ms' => (int)((microtime(true) - $startTime) * 1000),
            ]);

            return [
                'success' => true,
                'content' => $refusal,
                'message_id' => $msg->id,
            ];
        }

        // 2. Resolve Routing Plan & Fallbacks
        $routing = ModelRouter::getRoutingPlan($capability);
        $primarySetting = $routing['primary'];
        $fallbackPool = $routing['fallback_pool'];

        if (!$primarySetting || (empty($primarySetting->getDecryptedApiKey()) && $primarySetting->provider !== 'ollama')) {
            $errContent = "Dynime AI Engine is currently not configured or active. An administrator can enable and configure an AI provider in Admin Settings > Providers.";
            
            $msg = AiMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $errContent,
                'capability_profile' => $capability,
                'latency_ms' => (int)((microtime(true) - $startTime) * 1000),
            ]);

            return [
                'success' => true,
                'content' => $errContent,
                'message_id' => $msg->id,
            ];
        }

        // 3. Build System Prompt & Context
        $systemPrompt = self::buildSystemPrompt($user, $capability, $primarySetting->system_prompt);
        $messages = self::buildMessageContext($conversation, $userInput, $attachments);

        // 4. Candidate list: primary followed by fallbacks
        $activeCandidates = collect([$primarySetting])->concat($fallbackPool);

        $responseContent = null;
        $tokensIn = null;
        $tokensOut = null;
        $usedProvider = null;
        $usedModel = null;
        $lastError = null;

        foreach ($activeCandidates as $setting) {
            try {
                $compResult = AIService::complete(
                    $setting,
                    $messages,
                    $systemPrompt,
                    ['capability' => $capability]
                );

                if (!empty($compResult['success']) && !empty($compResult['content'])) {
                    $responseContent = $compResult['content'];
                    $tokensIn = $compResult['tokens_in'] ?? null;
                    $tokensOut = $compResult['tokens_out'] ?? null;
                    $usedProvider = $setting->provider;
                    $usedModel = $setting->default_model;
                    break;
                } else {
                    $lastError = $compResult['error'] ?? 'Unknown error';
                    Log::warning("DComposer failover from {$setting->provider}: {$lastError}");
                }
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();
                Log::warning("DComposer provider exception ({$setting->provider}): " . $e->getMessage());
                continue;
            }
        }

        if (!$responseContent) {
            $responseContent = "I encountered a connection interruption with the AI provider (" . ($lastError ?: 'service unavailable') . "). Please check your AI settings or try again shortly.";
        }

        // 5. Sanitize Output
        $cleanContent = SecurityGuard::sanitizeOutput($responseContent);
        $latencyMs = (int)((microtime(true) - $startTime) * 1000);

        // 6. Persist Message & Audit Log
        $aiMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $cleanContent,
            'provider' => $usedProvider,
            'model' => $usedModel,
            'capability_profile' => $capability,
            'tokens_in' => $tokensIn,
            'tokens_out' => $tokensOut,
            'latency_ms' => $latencyMs,
        ]);

        AiAuditLog::create([
            'user_id' => $user->id,
            'provider' => $usedProvider,
            'model' => $usedModel,
            'capability' => $capability,
            'tokens_used' => ($tokensIn ?? 0) + ($tokensOut ?? 0),
            'latency_ms' => $latencyMs,
            'status' => $responseContent ? 'success' : 'failed',
            'error_message' => $lastError,
        ]);

        return [
            'success' => true,
            'content' => $cleanContent,
            'message_id' => $aiMsg->id,
            'latency_ms' => $latencyMs,
            'provider' => $usedProvider,
            'model' => $usedModel,
        ];
    }

        protected static function buildSystemPrompt(User $user, string $capability, ?string $customPrompt = null): string
    {
        $userName = $user->name ?? 'User';

        $prompt = "You are Dynime AI, the unified enterprise AI operating and orchestration layer.
"
            . "You are interacting with {$userName}.

"
            . "CORE IDENTITY & GUIDELINES:
"
            . "- Your name is strictly \"Dynime AI\", the enterprise intelligence partner.
"
            . "- Tone: Highly articulate, structured, professional, executive-grade management consultant.
"
            . "- NEVER use robotic cliché fillers such as \"Certainly! I'd be happy to help with that\", \"Sure thing!\", \"As an AI language model...\", or \"I hope this assists you!\".
"
            . "- Get straight to the point with authoritative clarity.
"
            . "- Structure responses logically using clear markdown headers (e.g. ## Executive Summary, ### Strategic Recommendations).
"
            . "- When presenting data, metrics, comparisons, or structured specifications, always format them in clean, academic three-line markdown tables with clear column headers.
"
            . "- When generating reports or documents, provide complete, comprehensive, publication-ready content with realistic depth and precision.
"
            . "CAPABILITY MODE: {$capability}
";

        if ($capability === 'thinking' || $capability === 'deep_thinking') {
            $prompt .= "
- DEEP THINKING & REASONING: Conduct thorough multi-dimensional analysis, rigorously validating assumptions, edge cases, and systemic trade-offs before delivering structured conclusions.";
        } elseif ($capability === 'fast') {
            $prompt .= "
- FAST MODE: Deliver instantaneous, high-density, actionable answers with zero fluff.";
        } elseif ($capability === 'coding') {
            $prompt .= "
- CODING SPECIALIST: Deliver clean, modular, production-grade code adhering to modern design patterns, complete with type safety and performance considerations.";
        } elseif ($capability === 'research') {
            $prompt .= "
- DEEP RESEARCH: Provide exhaustive empirical research, cross-referencing domain frameworks, quantitative benchmarks, and synthesized findings.";
        } elseif ($capability === 'creative') {
            $prompt .= "
- CREATIVE & COPY: Deliver compelling, brand-aligned executive narratives, persuasive presentations, and high-impact strategy decks.";
        }

        if (!empty($customPrompt)) {
            $prompt .= "

ORGANIZATIONAL GUIDELINES:
" . trim($customPrompt);
        }

        $prompt .= "

FORMATTING DIRECTIVE: Use standard markdown with crisp bold headers, clean unordered lists, and clean markdown tables.";
        return $prompt;
    }

    protected static function buildMessageContext(AiConversation $conversation, string $newInput, array $attachments = []): array
    {
        $messages = [];

        // Fetch recent messages (up to 12) for context continuity
        $history = $conversation->messages()->orderBy('id', 'desc')->take(12)->get()->reverse();

        foreach ($history as $m) {
            $messages[] = [
                'role' => $m->role === 'assistant' ? 'assistant' : 'user',
                'content' => $m->content,
            ];
        }

        // Process attachments text
        $attachmentContext = '';
        if (!empty($attachments)) {
            foreach ($attachments as $att) {
                if (!empty($att['text'])) {
                    $attachmentContext .= "\n[Attached File: {$att['name']}]\n{$att['text']}\n";
                }
            }
        }

        $fullUserContent = $newInput;
        if (!empty($attachmentContext)) {
            $fullUserContent .= "\n\n" . trim($attachmentContext);
        }

        $messages[] = [
            'role' => 'user',
            'content' => $fullUserContent,
        ];

        return $messages;
    }
}
