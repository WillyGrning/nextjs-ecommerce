import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../auth/[...nextauth]';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(200).json({ items: [], count: 0 });
    }

    const { data: favoriteData, error: favoriteError } = await supabaseAdmin
      .from('favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    console.log('🛒 Fav query result:', { favoriteData, favoriteError });

    const { data: favoriteItems, error: favoriteItemsError } = await supabaseAdmin
        .from('favorites')
        .select(`
            id,
            product_id,
            products (
                id,
                name,
                price,
                discount,
                image,
                stock
            )
        `)
        .eq("user_id", session.user.id);
    
    console.log('Favorite items query results:', {
        favoriteItems,
        favoriteItemsError,
        count: favoriteItems?.length
    });

    if (favoriteItemsError) {
      console.error('❌ Error fetching items:', favoriteItemsError);
      return res.status(500).json({ error: favoriteItemsError.message });
    }

    return res.status(200).json({
        items: favoriteItems || [],
        count: favoriteItems?.length || 0
    })
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}