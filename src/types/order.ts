export interface Order {
  id: string;
  user_id: string | null;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    email: string;
    fullname: string;
  };
}

export interface OrdersApiResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_time: number;
}

type PaymentCard = {
  last4: string;
  payment_number: string;
  cardholder_name: string;
  expiry_month: number;
  expiry_year: number;
};

export type OrderPayment = {
  payment_method: string;
  status: string;
  paid_at: string;
  payment_cards: PaymentCard | null;
};