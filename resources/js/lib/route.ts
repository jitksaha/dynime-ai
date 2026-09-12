/**
 * Safe Route Helper for Dynime Account Center
 * Works with or without Ziggy backend package.
 */
export function safeRoute(name?: string, params?: any): any {
    if (typeof window !== 'undefined' && typeof (window as any).ziggyRoute === 'function') {
        return (window as any).ziggyRoute(name, params);
    }

    const namedRoutes: Record<string, string> = {
        'login': '/login',
        'account.login': '/login',
        'account.login.post': '/login',
        'register': '/register',
        'account.register': '/register',
        'account.register.post': '/register',
        'password.request': '/forgot-password',
        'password.email': '/forgot-password',
        'password.reset': '/reset-password',
        'password.update': '/reset-password',
        'account.portal': '/account',
        'account.portal.profile': '/account/profile',
        'account.profile': '/account/profile',
        'account.portal.password': '/account/password',
        'account.password': '/account/password',
        'account.portal.sessions.terminate': params ? `/account/sessions/${params}` : '/account/sessions',
        'account.sessions.terminate': params ? `/account/sessions/${params}` : '/account/sessions',
        'account.portal.sessions.terminate-others': '/account/sessions/terminate-others',
        'account.sessions.terminate-others': '/account/sessions/terminate-others',
        'logout': '/logout',
    };

    if (!name) {
        return {
            has: (n: string) => Boolean(namedRoutes[n]),
            current: (n?: string) => false,
        };
    }

    if (namedRoutes[name]) {
        return namedRoutes[name];
    }

    return `/${name.replace(/\./g, '/')}`;
}

export default safeRoute;
