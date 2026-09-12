<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $guarded = [];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(AiConversation::class);
    }

    public function getRoleAttribute(): string
    {
        return $this->attributes['role'] ?? ($this->attributes['type'] ?? 'user');
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (!empty($this->attributes['avatar_url'])) {
            return $this->attributes['avatar_url'];
        }
        if (!empty($this->attributes['avatar']) && $this->attributes['avatar'] !== 'avatar.png') {
            return asset('uploads/users-avatar/' . $this->attributes['avatar']);
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name ?? 'User') . '&background=6d28d9&color=fff';
    }

    public function isAdmin(): bool
    {
        $r = $this->role;
        return in_array($r, ['admin', 'superadmin', 'company', 'super admin']);
    }
}
