import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Secure all routes under /admin
  if (url.pathname.startsWith('/admin')) {
    const accessToken = context.cookies.get('sb-access-token')?.value;
    const refreshToken = context.cookies.get('sb-refresh-token')?.value;

    if (!accessToken && !refreshToken) {
      return context.redirect('/login?error=Silakan login terlebih dahulu');
    }

    // Verify access token with Supabase server-side
    const { data: { user }, error } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null }, error: new Error('no access token') };

    if (error || !user) {
      // Access token expired/invalid — try to silently refresh using refresh token
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (!refreshError && refreshData.session) {
          // Refresh berhasil: update cookies dengan token baru
          const newSession = refreshData.session;
          const isHttps = url.protocol === 'https:';
          const cookieOpts = {
            path: '/',
            sameSite: 'lax' as const,
            secure: isHttps,
            httpOnly: true, // Blokir akses token via JS (XSS → Session Hijacking mitigation)
          };
          context.cookies.set('sb-access-token', newSession.access_token, {
            ...cookieOpts,
            maxAge: newSession.expires_in,
          });
          context.cookies.set('sb-refresh-token', newSession.refresh_token, {
            ...cookieOpts,
            maxAge: 60 * 60 * 24 * 7, // 7 hari
          });
          // Lanjut ke halaman admin dengan session baru
          return next();
        }
      }

      // Refresh gagal atau tidak ada refresh token: paksa logout
      context.cookies.delete('sb-access-token', { path: '/' });
      context.cookies.delete('sb-refresh-token', { path: '/' });
      return context.redirect('/login?error=Sesi telah berakhir, silakan login kembali');
    }
  }

  return next();
});
