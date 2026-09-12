<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\User;
use App\Services\DynimeSSOClient;

class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
        if (Auth::check()) {
            return redirect()->route('chat.index');
        }

        $ssoClient = new DynimeSSOClient();
        $ssoLoginUrl = $ssoClient->getLoginUrl(route('auth.sso.callback'));

        // If not requesting explicit local emergency login (?local=1), redirect straight to account.dynime.com
        if (!$request->has('local')) {
            return redirect()->away($ssoLoginUrl);
        }

        return Inertia::render('Auth/Login', [
            'sso_login_url' => $ssoLoginUrl,
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->intended(route('chat.index'));
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    public function ssoRedirect()
    {
        $ssoClient = new DynimeSSOClient();
        return redirect()->away($ssoClient->getLoginUrl(route('auth.sso.callback')));
    }

    public function ssoCallback(Request $request)
    {
        $ticket = $request->query('ticket');

        if (empty($ticket)) {
            return redirect()->away('https://account.dynime.com/login?client_id=dynime_ai_app&redirect=' . urlencode(route('auth.sso.callback')));
        }

        $ssoClient = new DynimeSSOClient();
        $verification = $ssoClient->verifyTicket($ticket);

        if (!$verification || empty($verification['success']) || empty($verification['user'])) {
            return redirect()->away('https://account.dynime.com/login?client_id=dynime_ai_app&redirect=' . urlencode(route('auth.sso.callback')));
        }

        $ssoUserData = $verification['user'];
        $email = $ssoUserData['email'];
        $name = $ssoUserData['name'] ?? 'Dynime User';
        $ssoId = $ssoUserData['id'] ?? null;
        $avatar = $ssoUserData['avatar_url'] ?? "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=6d28d9&color=fff";

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->name = $name;
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'sso_id')) {
                $user->sso_id = (string)$ssoId;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'avatar_url')) {
                $user->avatar_url = $avatar;
            }
            $user->save();
        } else {
            $user = new User();
            $user->name = $name;
            $user->email = $email;
            $user->password = Hash::make(Str::random(32));
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'role')) {
                $user->role = 'user';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'type')) {
                $user->type = 'company';
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'sso_id')) {
                $user->sso_id = (string)$ssoId;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'avatar_url')) {
                $user->avatar_url = $avatar;
            }
            $user->save();
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->route('chat.index');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->away('https://account.dynime.com/login?client_id=dynime_ai_app&redirect=' . urlencode(route('auth.sso.callback')));
    }
}
