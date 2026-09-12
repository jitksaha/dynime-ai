<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAttachment extends Model
{
    protected $table = 'ai_attachments';

    protected $fillable = [
        'conversation_id',
        'user_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'extracted_text',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }
}
