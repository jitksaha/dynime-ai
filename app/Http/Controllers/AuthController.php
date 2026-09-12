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
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('chat.index');
        }

        $ssoClient = new DynimeSSOClient();
        $ssoLoginUrl = $ssoClient->getLoginUrl(route('auth.sso.callback'));

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
            return redirect()->route('login')->withErrors(['sso' => 'SSO Ticket missing from Account Center callback.']);
        }

        $ssoClient = new DynimeSSOClient();
        $verification = $ssoClient->verifyTicket($ticket);

        if (!$verification || empty($verification['success']) || empty($verification['user'])) {
            return redirect()->route('login')->withErrors(['sso' => 'SSO Ticket verification failed with Account Center.']);
        }

        $ssoUserData = $verification['user'];
        $email = $ssoUserData['email'];
        $name = $ssoUserData['name'] ?? 'Dynime User';
        $ssoId = $ssoUserData['id'] ?? null;
        $avatar = $ssoUserData['avatar_url'] ?? "https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=6d28d9&color=fff";

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->name = $name;
            $user->sso_id = (string)$ssoId;
            $user->avatar_url = $avatar;
            $user->save();
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'avatar_url' => $avatar,
                'role' => 'user',
                'sso_id' => (string)$ssoId,
            ]);
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

        return redirect()->route('login');
    }
}
