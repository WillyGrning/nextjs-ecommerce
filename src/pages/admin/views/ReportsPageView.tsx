import { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Filter,
  X,
} from "lucide-react";
import React from "react";

/* =======================
   Types
======================= */
interface SalesReport {
  id: string;
  order_date: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_revenue: number;
  customer_name: string;
  status: string;
}

interface ProductReport {
  id: string;
  name: string;
  category: string;
  stock: number;
  sold: number;
  revenue: number;
  status: string;
}

interface CustomerReport {
  id: string;
  name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

interface ReportStats {
  totalRevenue: number;
  totalItemsSold: number;
  averageOrderValue: number;
  totalOrders: number;
  totalCustomers: number;
  topProduct: string;
}

/* =======================
   Utils
======================= */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

type CSVValue = string | number | boolean | null | undefined;

type SalesCSV = {
  Date: string;
  Product: string;
  Customer: string;
  Quantity: number;
  "Unit Price": number;
  "Total Revenue": number;
  Status: string;
};

type ProductsCSV = {
  Product: string;
  Category: string;
  Stock: number;
  Sold: number;
  Revenue: number;
  Status: string;
};

type CustomersCSV = {
  Customer: string;
  Email: string;
  "Total Orders": number;
  "Total Spent": number;
  "Last Order": string;
};

// Generic type T, fleksibel untuk array of objects apapun
const exportToCSV = <T extends Record<string, CSVValue>>(
  data: T[],
  filename: string
) => {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printReport = () => {
  window.print();
};

/* =======================
   Component
======================= */
export default function ReportsPageView() {
  const [activeTab, setActiveTab] = useState<
    "sales" | "products" | "customers"
  >("sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    topProduct: "-",
  });
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [productsReport, setProductsReport] = useState<ProductReport[]>([]);
  const [customersReport, setCustomersReport] = useState<CustomerReport[]>([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (category) params.append("category", category);
      const query = params.toString();

      const [statsRes, reportRes] = await Promise.all([
        fetch(`/api/admin/reports/stats?${query}`),
        fetch(`/api/admin/reports/${activeTab}?${query}`),
      ]);

      const statsData = await statsRes.json();
      const reportData = await reportRes.json();

      setStats(statsData.data);

      if (activeTab === "sales") setSalesReport(reportData.data || []);
      else if (activeTab === "products")
        setProductsReport(reportData.data || []);
      else setCustomersReport(reportData.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategory("");
  };

  const hasFilters = dateFrom || dateTo || category;

  const handleExport = () => {
    let data: (SalesCSV | ProductsCSV | CustomersCSV)[] = [];
    let filename = "";

    switch (activeTab) {
      case "sales":
        data = salesReport.map((item) => ({
          Date: formatDate(item.order_date),
          Product: item.product_name,
          Customer: item.customer_name,
          Quantity: item.quantity,
          "Unit Price": item.unit_price,
          "Total Revenue": item.total_revenue,
          Status: item.status,
        }));
        filename = "sales_report";
        break;
      case "products":
        data = productsReport.map((item) => ({
          Product: item.name,
          Category: item.category,
          Stock: item.stock,
          Sold: item.sold,
          Revenue: item.revenue,
          Status: item.status,
        }));
        filename = "products_report";
        break;
      case "customers":
        data = customersReport.map((item) => ({
          Customer: item.name,
          Email: item.email,
          "Total Orders": item.total_orders,
          "Total Spent": item.total_spent,
          "Last Order": formatDate(item.last_order_date),
        }));
        filename = "customers_report";
        break;
    }

    exportToCSV(data, filename);
  };

  React.useEffect(() => {
    fetchData();
  }, [activeTab, dateFrom, dateTo, category]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-600 mt-1">
            View and export detailed business reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-emerald-600 cursor-pointer text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={printReport}
            className="px-4 py-2.5 bg-slate-600 cursor-pointer text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-slate-600 text-sm font-medium">Total Orders Completed</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-slate-600 text-sm font-medium">Items Sold</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats.totalItemsSold}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Avg Order Value
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatCurrency(stats.averageOrderValue)}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pink-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Total Customers
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {stats.totalCustomers}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-slate-600 text-sm font-medium">Top Product</p>
          </div>
          <p
            className="text-lg font-bold text-slate-800 truncate"
            title={stats.topProduct}
          >
            {stats.topProduct}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Filters</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm cursor-pointer text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food</option>
              <option value="books">Books</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-slate-600">
              {hasFilters ? (
                <span className="inline-flex items-center gap-1 px-3 py-3 bg-blue-50 text-blue-700 rounded-lg">
                  <Filter className="w-4 h-4" />
                  Filters Active
                </span>
              ) : (
                <span className="text-slate-400 inline-flex items-center gap-1 px-3 py-3">No filters applied</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex-1 px-6 cursor-pointer py-4 text-sm font-medium transition-colors ${
                activeTab === "sales"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Sales Report
              </div>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 px-6 cursor-pointer py-4 text-sm font-medium transition-colors ${
                activeTab === "products"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                Product Report
              </div>
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`flex-1 px-6 cursor-pointer py-4 text-sm font-medium transition-colors ${
                activeTab === "customers"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Customer Report
              </div>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Sales Report */}
              {activeTab === "sales" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Total Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {salesReport.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No sales data available
                          </td>
                        </tr>
                      ) : (
                        salesReport.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {formatDate(item.order_date)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.customer_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-800">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-right text-emerald-600">
                              {formatCurrency(item.total_revenue)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  item.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Products Report */}
              {activeTab === "products" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Sold
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {productsReport.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No product data available
                          </td>
                        </tr>
                      ) : (
                        productsReport.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.category}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-slate-800">
                              {item.stock}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                              {item.sold}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-right text-emerald-600">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  item.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Customers Report */}
              {activeTab === "customers" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Total Orders
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                          Total Spent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                          Last Order
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {customersReport.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No customer data available
                          </td>
                        </tr>
                      ) : (
                        customersReport.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {item.email}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                              {item.total_orders}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-right text-emerald-600">
                              {formatCurrency(item.total_spent)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {formatDate(item.last_order_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
