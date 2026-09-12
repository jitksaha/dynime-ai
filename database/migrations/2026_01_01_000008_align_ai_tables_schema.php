<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. ai_conversations
        if (Schema::hasTable('ai_conversations')) {
            Schema::table('ai_conversations', function (Blueprint $table) {
                if (!Schema::hasColumn('ai_conversations', 'provider')) {
                    $table->string('provider', 64)->nullable()->after('title');
                }
                if (!Schema::hasColumn('ai_conversations', 'model')) {
                    $table->string('model', 128)->nullable()->after('provider');
                }
                if (!Schema::hasColumn('ai_conversations', 'capability_profile')) {
                    $table->string('capability_profile', 32)->default('auto')->after('model');
                }
                if (!Schema::hasColumn('ai_conversations', 'system_prompt')) {
                    $table->text('system_prompt')->nullable()->after('capability_profile');
                }
                if (!Schema::hasColumn('ai_conversations', 'is_pinned')) {
                    $table->boolean('is_pinned')->default(false)->after('system_prompt');
                }
                if (!Schema::hasColumn('ai_conversations', 'is_archived')) {
                    $table->boolean('is_archived')->default(false)->after('is_pinned');
                }
            });
        }

        // 2. ai_messages
        if (Schema::hasTable('ai_messages')) {
            Schema::table('ai_messages', function (Blueprint $table) {
                if (!Schema::hasColumn('ai_messages', 'provider')) {
                    $table->string('provider', 64)->nullable()->after('content');
                }
                if (!Schema::hasColumn('ai_messages', 'model')) {
                    $table->string('model', 128)->nullable()->after('provider');
                }
                if (!Schema::hasColumn('ai_messages', 'capability_profile')) {
                    $table->string('capability_profile', 32)->default('auto')->after('model');
                }
                if (!Schema::hasColumn('ai_messages', 'tool_calls')) {
                    $table->json('tool_calls')->nullable()->after('capability_profile');
                }
                if (!Schema::hasColumn('ai_messages', 'attachments')) {
                    $table->json('attachments')->nullable()->after('tool_calls');
                }
                if (!Schema::hasColumn('ai_messages', 'tokens_in')) {
                    $table->unsignedInteger('tokens_in')->nullable()->after('attachments');
                }
                if (!Schema::hasColumn('ai_messages', 'tokens_out')) {
                    $table->unsignedInteger('tokens_out')->nullable()->after('tokens_in');
                }
                if (!Schema::hasColumn('ai_messages', 'latency_ms')) {
                    $table->unsignedInteger('latency_ms')->nullable()->after('tokens_out');
                }
            });
        }

        // 3. ai_audit_logs
        if (Schema::hasTable('ai_audit_logs')) {
            Schema::table('ai_audit_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('ai_audit_logs', 'provider')) {
                    $table->string('provider', 64)->nullable()->after('user_id');
                }
                if (!Schema::hasColumn('ai_audit_logs', 'model')) {
                    $table->string('model', 128)->nullable()->after('provider');
                }
                if (!Schema::hasColumn('ai_audit_logs', 'tokens_used')) {
                    $table->unsignedInteger('tokens_used')->nullable()->after('latency_ms');
                }
                if (!Schema::hasColumn('ai_audit_logs', 'error_message')) {
                    $table->text('error_message')->nullable()->after('status');
                }
            });
        }
    }

    public function down(): void
    {
        //
    }
};
