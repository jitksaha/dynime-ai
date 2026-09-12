<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_settings')) {
            Schema::create('ai_settings', function (Blueprint $table) {
                $table->id();
                $table->string('provider', 64)->unique();
                $table->string('display_name', 128);
                $table->text('api_key')->nullable();
                $table->string('base_url', 500)->nullable();
                $table->string('default_model', 128)->nullable();
                $table->json('available_models')->nullable();
                $table->json('capabilities')->nullable();
                $table->decimal('temperature', 3, 2)->default(0.70);
                $table->unsignedInteger('max_tokens')->default(4096);
                $table->text('system_prompt')->nullable();
                $table->boolean('is_active')->default(false);
                $table->boolean('is_default')->default(false);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        //
    }
};
