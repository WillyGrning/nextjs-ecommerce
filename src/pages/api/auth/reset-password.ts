import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Pakai service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Email transporter (sama seperti forgot-password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { token, newPassword } = req.body;

    // Validate inputs
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      });
    }

    // Hash token untuk compare
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user dengan valid token
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', hashedToken)
      .gt('reset_token_expires', new Date().toISOString())
      .single();

    if (error || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password dan clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to reset password' 
      });
    }

    // Optional: Send confirmation email
    try {
      await transporter.sendMail({
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>✅ Password Changed</h2>
            <p>Hi ${user.fullname || 'there'},</p>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact us immediately.</p>
            <p>Best regards,<br>Your App Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password' 
    });
  }
}