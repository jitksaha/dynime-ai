<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 255)->default('New Discussion');
            $table->string('provider', 64)->nullable();
            $table->string('model', 128)->nullable();
            $table->string('capability_profile', 32)->default('auto');
            $table->text('system_prompt')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_conversations');
    }
};
