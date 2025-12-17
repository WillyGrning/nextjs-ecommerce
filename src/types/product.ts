export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  image: string | null;
  status: "active" | "inactive";
  created_at?: string;
}
export interface ProductsApiResponse {
  data: Product[];
  meta: {
    total: number;
  };
}
export interface Sale {
  product_id: string; // UUID
  product_name: string;
  qty_sold: number;
  total_revenue: number;
}

export interface ProductReport {
  id: string;
  name: string;
  category: string;
  stock: number;
  sold: number;
  revenue: number;
  status: string;
}