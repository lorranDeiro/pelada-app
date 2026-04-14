/**
 * API route to send admin notification email when a new comment is created
 * POST /api/notify-admin
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify this is a valid internal request
  // In production, consider adding additional security (Bearer token, etc)
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { authorName, authorEmail, content, matchDate } = body;

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For now, we'll log this - in production you would:
    // 1. Call Supabase Edge Function for Resend/SendGrid email
    // 2. Or query admin email from settings table
    // 3. Send actual email

    console.log('📧 New comment notification:');
    console.log(`   Author: ${authorName} (${authorEmail})`);
    console.log(`   Match Date: ${matchDate}`);
    console.log(`   Content: ${content.substring(0, 100)}...`);

    // TODO: Integrate with email service (Resend, SendGrid, AWS SES)
    // Example with Resend (add to env vars: RESEND_API_KEY, ADMIN_EMAIL):
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'notifications@pelada-app.com',
      to: process.env.ADMIN_EMAIL || 'admin@pelada-app.com',
      subject: `Novo comentário em ${matchDate}`,
      html: `
        <h2>Novo Comentário</h2>
        <p><strong>${authorName}</strong> deixou um comentário em ${matchDate}:</p>
        <blockquote>${content}</blockquote>
        <p><a href="https://pelada-app.com/admin/comentarios">Ver no Dashboard</a></p>
      `,
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Notificação enviada (implementar email service)',
    });
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

export { POST };
