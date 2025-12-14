export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
                <div>
                <h3 className="text-white text-xl font-bold mb-4">ShopHub</h3>
                <p className="text-sm text-gray-400">
                    Your one-stop destination for premium products and amazing
                    deals.
                </p>
                </div>
                <div>
                <h4 className="text-white font-semibold mb-4">Shop</h4>
                <ul className="space-y-2 text-sm">
                    <li>
                    <a href="#" className="hover:text-white transition">
                        New Arrivals
                    </a>
                    </li>
                    <li>
                    <a href="#" className="hover:text-white transition">
                        Best Sellers
                    </a>
                    </li>
                    <li>
                    <a href="#" className="hover:text-white transition">
                        Sale
                    </a>
                    </li>
                </ul>
                </div>
                <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                    <li>
                    <a href="#" className="hover:text-white transition">
                        Contact Us
                    </a>
                    </li>
                    <li>
                    <a href="#" className="hover:text-white transition">
                        FAQs
                    </a>
                    </li>
                    <li>
                    <a href="#" className="hover:text-white transition">
                        Shipping
                    </a>
                    </li>
                </ul>
                </div>
                <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                    <li>
                    <a href="#" className="hover:text-white transition">
                        About Us
                    </a>
                    </li>
                    <li>
                    <a href="#" className="hover:text-white transition">
                        Careers
                    </a>
                    </li>
                    <li>
                    <a href="#" className="hover:text-white transition">
                        Privacy
                    </a>
                    </li>
                </ul>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                <p>© 2025 ShopHub. All rights reserved.</p>
            </div>
            </div>
        </footer>
    )
}