<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AiProject extends Model
{
    use HasFactory;

    protected $table = 'ai_projects';

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'color',
        'icon',
        'is_collapsed',
    ];

    protected $casts = [
        'is_collapsed' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($project) {
            if (empty($project->uuid)) {
                $project->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(AiConversation::class, 'project_id')->orderBy('updated_at', 'desc');
    }
}
