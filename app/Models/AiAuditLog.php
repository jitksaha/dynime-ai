<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAuditLog extends Model
{
    protected $table = 'ai_audit_logs';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'provider',
        'model',
        'capability',
        'tokens_used',
        'latency_ms',
        'status',
        'error_message',
        'tools_executed',
        'created_at',
    ];

    protected $casts = [
        'tools_executed' => 'array',
        'tokens_used' => 'integer',
        'latency_ms' => 'integer',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
