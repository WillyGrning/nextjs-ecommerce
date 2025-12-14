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
    
    console.log('🔍 Fetch cart - User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      return res.status(200).json({ items: [], count: 0 });
    }

    // Get user's cart
    const { data: cartData, error: cartError } = await supabaseAdmin
      .from('carts')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    console.log('🛒 Cart query result:', { cartData, cartError });

    let cart = cartData;

    // If no cart exists, create one
    if (!cart) {
      console.log('📝 Creating new cart...');
      const { data: newCart, error: createError } = await supabaseAdmin
        .from('carts')
        .insert({ user_id: session.user.id })
        .select('id')
        .single();
      
      console.log('✅ New cart created:', { newCart, createError });
      cart = newCart;
    }

    if (!cart) {
      console.log('❌ No cart available');
      return res.status(200).json({ items: [], count: 0 });
    }

    console.log('🔍 Fetching items for cart_id:', cart.id);

    // Get cart items
    const { data: cartItems, error: itemsError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        cart_id,
        products (
          id,
          name,
          image,
          price,
          stock,
          discount
        )
      `)
      .eq('cart_id', cart.id);

    console.log('📦 Cart items query result:', { 
      cartItems, 
      itemsError,
      count: cartItems?.length 
    });

    if (itemsError) {
      console.error('❌ Error fetching items:', itemsError);
      return res.status(500).json({ error: itemsError.message });
    }

    return res.status(200).json({ 
      items: cartItems || [],
      count: cartItems?.length || 0
    });

  } catch (error) {
    console.error('💥 API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}