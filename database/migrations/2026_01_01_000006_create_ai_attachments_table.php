<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_attachments')) {
            Schema::create('ai_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('conversation_id')->nullable()->constrained('ai_conversations')->cascadeOnDelete();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('file_name', 255);
                $table->string('file_path', 500);
                $table->string('mime_type', 128)->nullable();
                $table->unsignedBigInteger('file_size')->default(0);
                $table->longText('extracted_text')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        //
    }
};
