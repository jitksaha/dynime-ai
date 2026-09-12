<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiPlan extends Model
{
    use HasFactory;

    protected $table = 'ai_plans';

    protected $fillable = [
        'slug',
        'name',
        'category',
        'tagline',
        'price_monthly',
        'price_annually',
        'currency',
        'is_popular',
        'badge_top',
        'badge_limited_time',
        'button_text',
        'features',
        'limits',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'price_monthly' => 'float',
        'price_annually' => 'float',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
        'features' => 'array',
        'limits' => 'array',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order', 'asc');
    }
}
