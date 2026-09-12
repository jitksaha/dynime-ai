<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiMessage extends Model
{
    protected $table = 'ai_messages';

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'provider',
        'model',
        'capability_profile',
        'tool_calls',
        'attachments',
        'tokens_in',
        'tokens_out',
        'latency_ms',
    ];

    protected $casts = [
        'tool_calls' => 'array',
        'attachments' => 'array',
        'tokens_in' => 'integer',
        'tokens_out' => 'integer',
        'latency_ms' => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }
}
