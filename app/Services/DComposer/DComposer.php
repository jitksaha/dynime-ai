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
        array $attachments = [],
        ?string $selectedModel = null,
        array $skills = [],
        bool $webSearch = false
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
        $routing = ModelRouter::getRoutingPlan($capability, $selectedModel);
        $primarySetting = $routing['primary'];
        $fallbackPool = $routing['fallback_pool'];
        $emulatedModel = $routing['emulated_model'] ?? null;
        $requestedModel = $routing['requested_model'] ?? 'dcomposer';

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

        // 3. Build System Prompt with Skills & Emulation Context
        $systemPrompt = self::buildSystemPrompt(
            $user,
            $capability,
            $primarySetting->system_prompt,
            $emulatedModel,
            $skills,
            $webSearch
        );
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
                    $capability
                );

                if ($compResult['success']) {
                    $responseContent = $compResult['content'];
                    $tokensIn = $compResult['tokens_in'] ?? null;
                    $tokensOut = $compResult['tokens_out'] ?? null;
                    $usedProvider = $setting->provider;
                    $usedModel = $setting->default_model;
                    break;
                } else {
                    $lastError = $compResult['error'] ?? 'Unknown provider error';
                    Log::warning("DComposer failover from {$setting->provider}: {$lastError}");
                }
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();
                Log::warning("DComposer exception on {$setting->provider}: {$lastError}");
            }
        }

        // If all candidates failed
        if ($responseContent === null) {
            $responseContent = "Dynime AI is experiencing temporary upstream connectivity constraints: " . ($lastError ?: 'No active model candidate responded.');
        }

        $latencyMs = (int)((microtime(true) - $startTime) * 1000);

        // 5. Post-Process & Clean Response
        $cleanContent = OutputSanitizer::cleanse($responseContent);

        // 6. Record Audit Log
        AiAuditLog::create([
            'user_id' => $user->id,
            'action' => 'chat.completion',
            'provider' => $usedProvider ?? $primarySetting->provider,
            'model' => $usedModel ?? $primarySetting->default_model,
            'capability_profile' => $capability,
            'tokens_used' => ($tokensIn ?? 0) + ($tokensOut ?? 0),
            'cost_estimated' => CostTracker::estimate($usedModel, $tokensIn ?? 0, $tokensOut ?? 0),
            'latency_ms' => $latencyMs,
            'status' => $responseContent !== null ? 'success' : 'failed',
            'metadata' => [
                'conversation_id' => $conversation->id,
                'requested_model' => $requestedModel,
                'emulated_model' => $emulatedModel,
                'skills' => $skills,
                'web_search' => $webSearch,
                'error' => $lastError,
            ],
        ]);

        // 7. Persist Assistant Message
        $displayModel = $emulatedModel ?: ($usedModel ?? $primarySetting->default_model);
        $displayProvider = $emulatedModel ? 'claude' : ($usedProvider ?? $primarySetting->provider);

        $aiMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $cleanContent,
            'provider' => $displayProvider,
            'model' => $displayModel,
            'capability_profile' => $capability,
            'tokens_in' => $tokensIn,
            'tokens_out' => $tokensOut,
            'latency_ms' => $latencyMs,
        ]);

        return [
            'success' => true,
            'content' => $cleanContent,
            'message_id' => $aiMsg->id,
            'latency_ms' => $latencyMs,
            'provider' => $displayProvider,
            'model' => $displayModel,
        ];
    }

    protected static function buildSystemPrompt(
        User $user,
        string $capability,
        ?string $customPrompt = null,
        ?string $emulatedModel = null,
        array $skills = [],
        bool $webSearch = false
    ): string {
        $userName = $user->name ?? 'User';

        $prompt = "You are Dynime AI, the unified enterprise AI operating and orchestration layer.\n"
            . "You are interacting with {$userName}.\n\n"
            . "CORE IDENTITY & GUIDELINES:\n"
            . "- Your name is strictly \"Dynime AI\", the enterprise intelligence partner.\n"
            . "- Tone: Highly articulate, structured, professional, executive-grade management consultant.\n"
            . "- NEVER use robotic cliché fillers such as \"Certainly! I'd be happy to help with that\", \"Sure thing!\", \"As an AI language model...\", or \"I hope this assists you!\".\n"
            . "- Get straight to the point with authoritative clarity.\n"
            . "- Structure responses logically using clear markdown headers (e.g. ## Executive Summary, ### Strategic Recommendations).\n"
            . "- When presenting data, metrics, comparisons, or structured specifications, always format them in clean, academic three-line markdown tables with clear column headers.\n"
            . "- When generating reports or documents, provide complete, comprehensive, publication-ready content with realistic depth and precision.\n"
            . "CAPABILITY MODE: {$capability}\n";

        if ($capability === 'thinking' || $capability === 'deep_thinking') {
            $prompt .= "\n- DEEP THINKING & REASONING: Conduct thorough multi-dimensional analysis, rigorously validating assumptions, edge cases, and systemic trade-offs before delivering structured conclusions.";
        } elseif ($capability === 'fast') {
            $prompt .= "\n- FAST MODE: Deliver instantaneous, high-density, actionable answers with zero fluff.";
        } elseif ($capability === 'coding') {
            $prompt .= "\n- CODING SPECIALIST: Deliver clean, modular, production-grade code adhering to modern design patterns, complete with type safety and performance considerations.";
        } elseif ($capability === 'research') {
            $prompt .= "\n- DEEP RESEARCH: Provide exhaustive empirical research, cross-referencing domain frameworks, quantitative benchmarks, and synthesized findings.";
        } elseif ($capability === 'creative') {
            $prompt .= "\n- CREATIVE & COPY: Deliver compelling, brand-aligned executive narratives, persuasive presentations, and high-impact strategy decks.";
        }

        // Active Skills Injection
        if (!empty($skills)) {
            $prompt .= "\n\nACTIVE ENTERPRISE SKILLS AUGMENTATION:";
            foreach ($skills as $skill) {
                switch ($skill) {
                    case 'financial_analyst':
                        $prompt .= "\n- [SKILL: FINANCIAL ANALYST] Apply institutional corporate finance rigour, DCF/EBITDA models, capital efficiency, balance-sheet hygiene, and valuation ratios.";
                        break;
                    case 'code_specialist':
                        $prompt .= "\n- [SKILL: CODE SPECIALIST] Deliver senior-level software architecture, strict type definitions, fault-tolerant error boundaries, and scalable algorithms.";
                        break;
                    case 'legal_auditor':
                        $prompt .= "\n- [SKILL: LEGAL AUDITOR] Scrutinize legal clauses, risk distributions, indemnification liabilities, SLA boundaries, and regulatory compliance frameworks.";
                        break;
                    case 'sql_analyst':
                        $prompt .= "\n- [SKILL: SQL & DATA ANALYST] Formulate optimized relational queries, execution plans, star schemas, indexing strategies, and analytical summaries.";
                        break;
                    case 'executive_memo':
                        $prompt .= "\n- [SKILL: EXECUTIVE MEMO] Deliver board-level memos with executive takeaway, strategic thesis, operational milestones, and risk matrices.";
                        break;
                    case 'deep_research':
                        $prompt .= "\n- [SKILL: DEEP RESEARCH] Provide thorough multi-perspective empirical syntheses, citations, and critical evaluations.";
                        break;
                }
            }
        }

        // Web Search Directive
        if ($webSearch) {
            $prompt .= "\n\nWEB SEARCH & CURRENT AWARENESS: Real-time intelligence mode enabled. Synthesize current developments and synthesize fresh insights into your answer.";
        }

        // Emulated Model Persona (Claude / GPT-4o / etc.)
        if (!empty($emulatedModel)) {
            if (str_contains(strtolower($emulatedModel), 'claude')) {
                $prompt .= "\n\nPERSONA PROFILE: Emulate Anthropic Claude 3.7 Sonnet. Demonstrate exceptional nuance, warmth without verbosity, deep reasoning, impeccable formatting, and intellectual rigor.";
            } elseif (str_contains(strtolower($emulatedModel), 'gpt') || str_contains(strtolower($emulatedModel), 'openai')) {
                $prompt .= "\n\nPERSONA PROFILE: Emulate OpenAI GPT-4o. High-velocity omni intelligence, crisp and exhaustive answers.";
            }
        }

        if (!empty($customPrompt)) {
            $prompt .= "\n\nORGANIZATIONAL GUIDELINES:\n" . trim($customPrompt);
        }

        $prompt .= "\n\nFORMATTING DIRECTIVE: Use standard markdown with crisp bold headers, clean unordered lists, and clean markdown tables.";
        return $prompt;
    }

    protected static function buildMessageContext(AiConversation $conversation, string $newInput, array $attachments = []): array
    {
        $messages = [];

        // Load recent history (last 20 turns)
        $history = $conversation->messages()
            ->orderBy('id', 'desc')
            ->take(20)
            ->get()
            ->reverse();

        foreach ($history as $msg) {
            if ($msg->role === 'user') {
                $messages[] = ['role' => 'user', 'content' => $msg->content];
            } elseif ($msg->role === 'assistant') {
                $messages[] = ['role' => 'assistant', 'content' => $msg->content];
            }
        }

        // Add the current prompt with attachments if any
        $userContent = $newInput;
        if (!empty($attachments)) {
            $userContent .= "\n\n[Attached Enterprise Assets:]\n";
            foreach ($attachments as $att) {
                $userContent .= "- {$att['name']} ({$att['type']}, size: {$att['size']})\n";
            }
        }

        $messages[] = ['role' => 'user', 'content' => $userContent];

        return $messages;
    }
}
