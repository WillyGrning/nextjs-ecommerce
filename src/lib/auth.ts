import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Service role client (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin  // ✅ Harus pakai ini
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
  
  console.log('✅ User found:', data);
  return data;
}

export async function verifyPassword(inputPassword: string, storedHash: string | null) {
  if (!storedHash) return false;
  
  try {
    return await bcrypt.compare(inputPassword, storedHash);
  } catch (error) {
    console.error('❌ Error verifying password:', error);
    return false;
  }
}

export async function getUserById(id: string | number) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error("❌ Error getUserById:", error);
    return null;
  }

  return data;
}
