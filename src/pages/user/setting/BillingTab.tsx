import { useState, useEffect } from 'react';
import { CreditCard, Check, Trash2, X, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';

type PaymentCard = {
  id: string;
  last4: string;
  card_brand: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  cardholder_name: string;
};

type Transaction = {
  id: string;
  created_at: string;
  total: number;
  status: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function BillingTab() {
  const { data: session } = useSession();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchPaymentData();
    }
  }, [session]);

  const fetchPaymentData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      
      // Fetch cards
      const cardsRes = await fetch(`/api/setting/user/cards?user_id=${session.user.id}`);
      const cardsData = await cardsRes.json();
      setCards(cardsData.cards || []);

      // Fetch recent transactions
      const transactionsRes = await fetch(`/api/orders/list?user_id=${session.user.id}`);
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.orders?.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert('Please login first');
      return;
    }

    if (!newCard.cardNumber || !newCard.cardholderName || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      alert('Please fill all fields');
      return;
    }

    // Validate card number (16 digits)
    if (newCard.cardNumber.replace(/\s/g, '').length !== 16) {
      alert('Card number must be 16 digits');
      return;
    }

    // Validate CVV (3-4 digits)
    if (newCard.cvv.length < 3 || newCard.cvv.length > 4) {
      alert('CVV must be 3 or 4 digits');
      return;
    }

    try {
      const res = await fetch('/api/setting/user/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          card_number: newCard.cardNumber.replace(/\s/g, ''),
          cardholder_name: newCard.cardholderName,
          expiry_month: parseInt(newCard.expiryMonth),
          expiry_year: parseInt(newCard.expiryYear),
          cvv: newCard.cvv,
          is_default: cards.length === 0, // First card is default
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add card');
      }

      alert('Card added successfully!');
      setShowAddCard(false);
      setNewCard({ cardNumber: '', cardholderName: '', expiryMonth: '', expiryYear: '', cvv: '' });
      fetchPaymentData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to add card');
    }
  };

  const handleSetDefault = async (cardId: string) => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch('/api/setting/user/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id, card_id: cardId }),
      });

      if (!res.ok) {
        throw new Error('Failed to set default card');
      }

      alert('Default card updated!');
      fetchPaymentData();
    } catch (err) {
      console.error(err);
      alert('Failed to set default card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!session?.user?.id) return;
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const res = await fetch(`/api/setting/user/cards?user_id=${session.user.id}&card_id=${cardId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete card');
      }

      alert('Card deleted successfully!');
      fetchPaymentData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete card');
    }
  };

  const getCardBrandGradient = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'from-blue-600 to-blue-800';
      case 'mastercard':
        return 'from-red-600 to-orange-600';
      case 'amex':
        return 'from-green-600 to-teal-600';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Penagihan & Pembayaran</h2>
      
      {/* Payment Methods */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h3>
          <button
            onClick={() => setShowAddCard(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Kartu
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Tidak ada metode pembayaran yang ditambahkan</p>
            <button
              onClick={() => setShowAddCard(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Tambah Kartu Pertama Anda
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`flex items-center justify-between p-4 rounded-xl transition ${
                  card.is_default
                    ? 'border-2 border-blue-600 bg-blue-50'
                    : 'border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-8 bg-gradient-to-r ${getCardBrandGradient(card.card_brand)} rounded flex items-center justify-center`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {card.card_brand.toUpperCase()} •••• {card.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      {card.cardholder_name} • Expires {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year.toString().slice(-2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {card.is_default ? (
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(card.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Atur sebagai default
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terbaru</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">Tidak ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Order #{transaction.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(transaction.total)}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" />
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Card</h3>
              <button
                onClick={() => setShowAddCard(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(newCard.cardNumber)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '');
                    if (/^\d*$/.test(value) && value.length <= 16) {
                      setNewCard({ ...newCard, cardNumber: value });
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  maxLength={19}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newCard.cardholderName}
                  onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <input
                    type="text"
                    placeholder="MM"
                    value={newCard.expiryMonth}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 2 && parseInt(value || '0') <= 12) {
                        setNewCard({ ...newCard, expiryMonth: value });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    placeholder="YY"
                    value={newCard.expiryYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 2) {
                        setNewCard({ ...newCard, expiryYear: value });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={newCard.cvv}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 4) {
                        setNewCard({ ...newCard, cvv: value });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}