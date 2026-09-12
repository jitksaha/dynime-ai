<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider', 64)->nullable();
            $table->string('model', 128)->nullable();
            $table->string('capability', 32)->default('auto');
            $table->unsignedInteger('tokens_used')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->string('status', 32)->default('success');
            $table->text('error_message')->nullable();
            $table->json('tools_executed')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_audit_logs');
    }
};
