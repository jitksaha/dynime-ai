<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_plans')) {
            Schema::create('ai_plans', function (Blueprint $table) {
                $table->id();
                $table->string('slug', 64)->unique();
                $table->string('name', 100);
                $table->string('category', 32)->default('individual')->index(); // individual, business, student
                $table->string('tagline', 255)->nullable();
                $table->decimal('price_monthly', 8, 2)->default(0.00);
                $table->decimal('price_annually', 8, 2)->default(0.00);
                $table->string('currency', 10)->default('USD');
                $table->boolean('is_popular')->default(false);
                $table->string('badge_top', 100)->nullable();
                $table->string('badge_limited_time', 100)->nullable();
                $table->string('button_text', 64)->default('Get Started');
                $table->json('features')->nullable();
                $table->json('limits')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'current_plan_slug')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('current_plan_slug', 64)->default('free')->after('email');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_plans');
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'current_plan_slug')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('current_plan_slug');
            });
        }
    }
};
