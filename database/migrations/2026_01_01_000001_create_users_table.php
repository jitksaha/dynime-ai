<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password')->nullable();
                $table->string('avatar_url', 500)->nullable();
                $table->string('role', 32)->default('user');
                $table->string('sso_id', 128)->nullable()->index();
                $table->rememberToken();
                $table->timestamps();
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'role')) {
                    $table->string('role', 32)->default('user')->nullable();
                }
                if (!Schema::hasColumn('users', 'sso_id')) {
                    $table->string('sso_id', 128)->nullable()->index();
                }
                if (!Schema::hasColumn('users', 'avatar_url')) {
                    $table->string('avatar_url', 500)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // Don't drop shared users table
    }
};
