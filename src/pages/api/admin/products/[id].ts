import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  /* ================= GET PRODUCT ================= */
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, category, stock, image, status, description")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ data });
  }

  /* ================= DELETE PRODUCT ================= */
  if (req.method === "DELETE") {
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(500).json({ message: "Failed to delete product" });
    }

    return res.status(200).json({
      message: `Product "${product.name}" deleted successfully`,
    });
  }

  if (req.method === 'PUT') {
    try {
      const { name, description, price, stock, category, status, image } = req.body;

      // Validation
      if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, price, and stock are required' 
        });
      }

      if (price < 0 || stock < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Price and stock must be positive numbers' 
        });
      }

      // Check if product exists
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existingProduct) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }

      // Update product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          name,
          description,
          price,
          stock,
          category,
          status,
          image,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update product' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Product updated successfully',
        data: updatedProduct 
      });

    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
