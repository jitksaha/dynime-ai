<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AiConversation extends Model
{
    protected $table = 'ai_conversations';

    protected $fillable = [
        'uuid',
        'user_id',
        'title',
        'provider',
        'model',
        'capability_profile',
        'system_prompt',
        'is_pinned',
        'is_archived',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_archived' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($conversation) {
            if (empty($conversation->uuid)) {
                $conversation->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class, 'conversation_id')->orderBy('id', 'asc');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AiAttachment::class, 'conversation_id');
    }
}
