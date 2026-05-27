import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { sanitizeInput, hashIp, checkRateLimit } from '../../lib/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate request origin via exact-match allowlist (prevent cross-domain spam)
    const origin = request.headers.get('origin');
    const ALLOWED_ORIGINS = [
      'https://mpksmansamal.netlify.app',
      'http://localhost:4321',
      'http://127.0.0.1:4321',
    ];
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Get Client IP and apply Hashed Rate Limiting
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipHash = hashIp(clientIp);
    const rateLimit = checkRateLimit(ipHash);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Terlalu banyak pengiriman. Silakan coba lagi dalam satu menit.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { name, class: className, content } = body;

    if (!className || !content) {
      return new Response(
        JSON.stringify({ error: 'Kelas dan isi aspirasi wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Sanitization to prevent XSS
    const cleanName = name ? sanitizeInput(name) : 'Anonim';
    const cleanClass = sanitizeInput(className);
    const cleanContent = sanitizeInput(content);

    // 4. Save to Supabase
    const { error } = await supabase
      .from('aspirations')
      .insert([
        {
          name: cleanName,
          class: cleanClass,
          content: cleanContent,
          ip_hash: ipHash,
          status: 'Belum Diproses'
        }
      ]);

    if (error) throw error;

    // 5. Trigger Discord Webhook Notification (Optional but highly recommended)
    const DISCORD_WEBHOOK_URL = import.meta.env.DISCORD_WEBHOOK_URL;
    if (DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL.startsWith('https://')) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title: '📥 Aspirasi Baru Masuk!',
                color: 3447003, // Hex equivalent (decimal) for Blue
                fields: [
                  { name: 'Pengirim', value: cleanName, inline: true },
                  { name: 'Kelas', value: cleanClass, inline: true },
                  { name: 'Isi Aspirasi', value: cleanContent }
                ],
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (webhookError) {
        console.error('Gagal memicu webhook Discord:', webhookError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('API Error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Gagal memproses aspirasi.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
export const prerender = false; // Disable prerendering for API route
