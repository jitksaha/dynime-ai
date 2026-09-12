<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_projects')) {
            Schema::create('ai_projects', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('name', 128);
                $table->string('color', 32)->default('#635bff');
                $table->string('icon', 64)->default('Folder');
                $table->boolean('is_collapsed')->default(false);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('ai_conversations') && !Schema::hasColumn('ai_conversations', 'project_id')) {
            Schema::table('ai_conversations', function (Blueprint $table) {
                $table->unsignedBigInteger('project_id')->nullable()->index()->after('user_id');
            });
        }
    }

    public function down(): void
    {
        //
    }
};
