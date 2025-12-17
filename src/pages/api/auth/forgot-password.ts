// File: pages/api/auth/forgot-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Supabase server-side client pakai service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // HARUS pakai service role key
);

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user pakai service key
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      // Jangan reveal apakah email ada atau tidak (security)
      return res.status(200).json({
        success: true,
        message: 'If an account exists, reset link sent',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiry (pakai Date object supaya Supabase timestamp cocok)
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    console.log('Updating user:', user.id, hashedToken, tokenExpiry);

    // Update user pakai service key (bypass RLS)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        reset_token: hashedToken,
        reset_token_expires: tokenExpiry,
      })
      .eq('id', user.id)
      .select(); // select supaya bisa lihat hasil update

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to process request' });
    }

    console.log('Updated user:', updatedUser);

    // Buat reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // Kirim email
    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔐 Password Reset Request</h2>
          <p>Hi ${user.fullname || 'there'},</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
            Reset My Password
          </a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reset email',
    });
  }
}
