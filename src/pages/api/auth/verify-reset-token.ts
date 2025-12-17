import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabase } from '../../../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    // Hash token untuk compare dengan database
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

    return res.status(200).json({ 
      success: true, 
      message: 'Token is valid',
      userId: user.id // Optional: bisa kirim user ID untuk validasi tambahan
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify token' 
    });
  }
}