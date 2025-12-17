import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalCustomers: number;
  averageOrderValue: number;
  topProduct: string;
}

interface SalesItem {
  order_date: string;
  total_revenue: number;
  customer_name: string;
  product_name: string;
  quantity: number;
}

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  sold: number;
  revenue: number;
  status: string;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<SalesItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState("7d");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeGranularity, setTimeGranularity] = useState<
    "day" | "week" | "month"
  >("day");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Calculate date range
      const now = new Date();
      const dateFrom = new Date();
      if (dateRange === "7d") dateFrom.setDate(now.getDate() - 7);
      else if (dateRange === "30d") dateFrom.setDate(now.getDate() - 30);
      else if (dateRange === "90d") dateFrom.setDate(now.getDate() - 90);

      if (dateRange !== "all") {
        params.append("dateFrom", dateFrom.toISOString());
        params.append("dateTo", now.toISOString());
      }

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const [statsRes, salesRes, customersRes, productsRes] = await Promise.all(
        [
          fetch(`/api/admin/reports/stats?${params}`),
          fetch(`/api/admin/reports/sales?${params}`),
          fetch(`/api/admin/reports/customers?${params}`),
          fetch(`/api/admin/reports/products?${params}`),
        ]
      );

      const statsData = await statsRes.json();
      const salesData = await salesRes.json();
      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      setStats(statsData.data);
      setSales(salesData.data);
      setCustomers(customersData.data);
      setProducts(productsData.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mb-4"></div>
          <p className="text-xl font-semibold text-white">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // Process data
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  // Sales trends with granularity
  const salesTrend = sales.reduce((acc, item) => {
    const date = new Date(item.order_date);
    let key: string;

    if (timeGranularity === "day") {
      key = date.toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
      });
    } else if (timeGranularity === "week") {
      const week = Math.ceil(date.getDate() / 7);
      key = `Week ${week} ${date.toLocaleDateString("id-ID", {
        month: "short",
      })}`;
    } else {
      key = date.toLocaleDateString("id-ID", { month: "long" });
    }

    const existing = acc.find((d) => d.period === key);
    if (existing) {
      existing.revenue += item.total_revenue;
      existing.orders += 1;
    } else {
      acc.push({ period: key, revenue: item.total_revenue, orders: 1 });
    }
    return acc;
  }, [] as { period: string; revenue: number; orders: number }[]);

  // Top products
  const topProducts = products.sort((a, b) => b.sold - a.sold).slice(0, 8);

  // Category performance
  const categoryPerformance = products
    .reduce((acc, product) => {
      const existing = acc.find((c) => c.category === product.category);
      if (existing) {
        existing.revenue += product.revenue;
        existing.sold += product.sold;
      } else {
        acc.push({
          category: product.category,
          revenue: product.revenue,
          sold: product.sold,
        });
      }
      return acc;
    }, [] as { category: string; revenue: number; sold: number }[])
    .sort((a, b) => b.revenue - a.revenue);

  // Customer growth
  const customerGrowth = customers.reduce((acc, customer) => {
    const date = new Date(customer.last_order_date);
    const month = date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });

    const existing = acc.find((d) => d.month === month);
    if (existing) {
      existing.newCustomers += 1;
      if (customer.total_orders > 1) {
        existing.returning += 1;
      }
    } else {
      acc.push({
        month,
        newCustomers: 1,
        returning: customer.total_orders > 1 ? 1 : 0,
      });
    }
    return acc;
  }, [] as { month: string; newCustomers: number; returning: number }[]);

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number): string => {
    if (previous === 0) return "100";
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const revenueGrowth =
    salesTrend.length >= 2
      ? calculateGrowth(
          salesTrend[salesTrend.length - 1].revenue,
          salesTrend[salesTrend.length - 2].revenue
        )
      : "0";

  const ordersGrowth =
    salesTrend.length >= 2
      ? calculateGrowth(
          salesTrend[salesTrend.length - 1].orders,
          salesTrend[salesTrend.length - 2].orders
        )
      : "0";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  interface TooltipPayload {
    color: string;
    name: string;
    value: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-200 font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => {
            const name =
              typeof entry.name === "string"
                ? entry.name
                : String(entry.name ?? "");

            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {name}:{" "}
                {name.toLowerCase().includes("revenue")
                  ? formatCurrency(Number(entry.value))
                  : entry.value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time insights & performance metrics
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>

            {/* Time Granularity */}
            <select
              value={timeGranularity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "day" || value === "week" || value === "month") {
                  setTimeGranularity(value);
                }
              }}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>

            <button
              onClick={fetchAnalytics}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards with Growth Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="from-indigo-500 to-purple-600"
            growth={revenueGrowth}
            isPositive={parseFloat(revenueGrowth) > 0}
          />
          <MetricCard
            title="Total Orders"
            value={(stats?.totalOrders || 0).toString()}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="from-green-500 to-emerald-600"
            growth={ordersGrowth}
            isPositive={parseFloat(ordersGrowth) > 0}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(stats?.averageOrderValue || 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="from-purple-500 to-pink-600"
            growth="4.2"
            isPositive={true}
          />
          <MetricCard
            title="Total Customers"
            value={(stats?.totalCustomers || 0).toString()}
            icon={<Users className="w-6 h-6" />}
            color="from-blue-500 to-indigo-600"
            growth="8.5"
            isPositive={true}
          />
        </div>

        {/* Revenue & Orders Trend - Main Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Revenue & Orders Trend
            </h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Orders</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="left"
                stroke="#6366f1"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                style={{ fontSize: "12px" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Product Performance & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Top Selling Products
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  style={{ fontSize: "11px" }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="sold"
                  fill="#f59e0b"
                  radius={[0, 8, 8, 0]}
                  name="Quantity Sold"
                >
                  {topProducts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-500" />
              Revenue by Category
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const entry = props.payload as { category: string };
                    const percent = props.percent || 0;
                    return `${entry.category} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {categoryPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Analytics & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Growth */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-500" />
              Customer Growth (New vs Returning)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="newCustomers"
                  fill="#06b6d4"
                  name="New Customers"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="returning"
                  fill="#8b5cf6"
                  name="Returning"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              Category Performance
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {categoryPerformance.map((cat, index) => (
                <div
                  key={cat.category}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="font-semibold text-gray-900">
                        {cat.category}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {cat.sold} sold
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (cat.revenue / categoryPerformance[0].revenue) * 100
                          }%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatCurrency(cat.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-500" />
            Top Customers Leaderboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.slice(0, 6).map((customer, index) => (
              <div
                key={customer.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-500"
                        : index === 2
                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {customer.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="font-bold text-green-600">
                      {formatCurrency(customer.total_spent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="font-bold text-indigo-600">
                      {customer.total_orders}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
  growth,
  isPositive,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  growth: string;
  isPositive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}
        >
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
            isPositive
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {growth}%
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}
