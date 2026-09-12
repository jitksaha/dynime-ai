<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class AiSetting extends Model
{
    protected $table = 'ai_settings';

    protected $fillable = [
        'provider',
        'display_name',
        'api_key',
        'base_url',
        'default_model',
        'available_models',
        'capabilities',
        'temperature',
        'max_tokens',
        'system_prompt',
        'is_active',
        'is_default',
        'created_by',
    ];

    protected $casts = [
        'available_models' => 'array',
        'capabilities' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'temperature' => 'float',
        'max_tokens' => 'integer',
    ];

    protected $hidden = [
        'api_key',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function setApiKeyAttribute($value)
    {
        if (!empty($value)) {
            $this->attributes['api_key'] = Crypt::encryptString($value);
        } else {
            $this->attributes['api_key'] = null;
        }
    }

    public function getDecryptedApiKey(): ?string
    {
        if (empty($this->attributes['api_key'])) {
            return null;
        }

        try {
            return Crypt::decryptString($this->attributes['api_key']);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getMaskedApiKey(): ?string
    {
        $raw = $this->getDecryptedApiKey();
        if (empty($raw)) {
            return null;
        }

        $len = strlen($raw);
        if ($len <= 8) {
            return '••••••••';
        }

        return substr($raw, 0, 4) . '••••••••' . substr($raw, -4);
    }
}
