import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Bell, Shield, CreditCard, MapPin, Phone, Camera, Save, X, Check, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import BillingTab from './BillingTab';

export default function UserSetting() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      const avatarDataUrl = reader.result as string;
      setPreview(avatarDataUrl);
      setFormData(prev => ({
        ...prev,
        profile: { ...prev.profile, avatar: avatarDataUrl },
      }));
    };
    reader.readAsDataURL(file);
  };


  const handleRemoveAvatar = async () => {
    try {
      await fetch("/api/setting/user/update", { method: "DELETE" });
      setFormData(prev => ({ ...prev, profile: { ...prev.profile, avatar: "" } }));
      setPreview("");
    } catch (err) {
      console.error(err);
      alert("Failed to remove avatar");
    }
  };
  
  // Sample user data (bisa diganti dengan data dari props/context)
  const [formData, setFormData] = useState({
    profile: {
      fullname: "",
      email: "",
      phone: "",
      avatar: "",
      address: "",
      bio: "",
    },
    password: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: false,
    },
    notification: {
      emailNotifications: true,
      orderUpdates: true,
      promotions: false,
      newsletter: false,
    },
    billing: {
      cardNumber: "",
      expiry: "",
    },
  });


  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'billing', label: 'Pembayaran', icon: CreditCard },
  ];

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let res;
      switch(activeTab) {
        case "profile":
          res = await fetch("/api/setting/user/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData.profile),
          });
          break;

        case "security":
          res = await fetch("/api/setting/user/security", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              twoFactorAuth: formData.security.twoFactorAuth,
              loginAlerts: formData.security.loginAlerts,
            }),
          });
          break;

        case "billing":
          res = await fetch("/api/setting/user/billing", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData.billing),
          });
          break;

        default:
          throw new Error("Unknown tab");
      }

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Update failed");
      } else {
        alert("Changes saved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/setting/user", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return console.error("Failed to fetch user");

        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          profile: {
            fullname: data.fullname || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            bio: data.bio || "",
            avatar: data.image || "",
          },
          password: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          },
          security: {
            twoFactorAuth: data.twoFactorAuth ?? false,
            loginAlerts: data.loginAlerts ?? false,
          },
          notifications: {
            emailNotifications: data.emailNotifications ?? true,
            orderUpdates: data.orderUpdates ?? true,
            promotions: data.promotions ?? false,
            newsletter: data.newsletter ?? false,
          },
          billing: {
            cardNumber: data.cardNumber || "",
            expiry: data.expiry || "",
          },
        }));
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    }

    fetchUser();
  }, []);
  
// handle password update
  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmNewPassword } = formData.password;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("All password fields are required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters");
      return;
    }

    try {
      const res = await fetch("/api/setting/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update password");
        return;
      }

      alert("Password updated successfully!");
      setFormData(prev => ({
        ...prev,
        password: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
      }));
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 mt-8 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pengaturan Akun</h1>
          <p className="text-gray-600">Kelola preferensi dan pengaturan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center cursor-pointer gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Informasi Akun</h2>
                  
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                    <div className="relative group">
                      <Image
                        width={24} height={24}
                        src={preview || formData.profile.avatar || "/image/placeholder.png"}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Foto Profil</h3>
                      <p className="text-sm text-gray-500 mb-3">Upload foto profil</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Upload Baru
                        </button>
                        <button
                          onClick={handleRemoveAvatar} 
                          className="px-4 py-2 bg-gray-100 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nama Lengkap
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.profile.fullname}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              profile: { ...prev.profile, fullname: e.target.value }
                            }))}
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Alamat Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={formData.profile.email}
                            onChange={(e) => 
                              setFormData( prev => ({
                                ...prev,
                                profile: { ...prev.profile, email: e.target.value }
                              }))
                            }
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.profile.phone}
                          onChange={(e) => 
                            setFormData( prev => ({
                              ...prev,
                              profile: { ...prev.profile, phone: e.target.value }
                            }))
                          }
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alamat
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.profile.address}
                          onChange={(e) => 
                            setFormData( prev => ({
                              ...prev,
                              profile: { ...prev.profile, address: e.target.value }
                            }))
                          }
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.profile.bio}
                        onChange={(e) => 
                          setFormData( prev => ({
                            ...prev,
                            profile: { ...prev.profile, bio: e.target.value }
                          }))
                        }
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
                        placeholder="Ceritakan tentang diri Anda..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan Keamanan</h2>
                  
                  {/* Change Password */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubah Kata Sandi</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Kata Sandi Saat Ini
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showOldPassword ? "text" : "password"}
                            value={formData.password.currentPassword}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                password: { ...prev.password, currentPassword: e.target.value },
                              }))
                            }
                            className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                          <button
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Kata Sandi Baru
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={formData.password.newPassword}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                password: { ...prev.password, newPassword: e.target.value },
                              }))
                            }
                            className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                          <button
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Minimal 8 karakter</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Konfirmasi Kata Sandi Baru
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="password"
                            value={formData.password.confirmNewPassword}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                password: { ...prev.password, confirmNewPassword: e.target.value },
                              }))
                            }
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleUpdatePassword}
                        className="px-6 py-2.5 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Perbarui Kata Sandi
                      </button>
                    </div>
                  </div>

                  {/* Security Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Options</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        onClick={() => 
                          setFormData((prev) => ({
                            ...prev,
                            security: { ...prev.security, twoFactorAuth: !prev.security.twoFactorAuth },
                          }))
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          formData.security.twoFactorAuth ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.security.twoFactorAuth ? "translate-x-7" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Login Alerts</h4>
                        <p className="text-sm text-gray-500">Get notified of new login activity</p>
                      </div>
                      <button
                        onClick={() => 
                          setFormData((prev) => ({
                            ...prev,
                            security: { ...prev.security, loginAlerts: !prev.security.loginAlerts },
                          }))
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          formData.security.loginAlerts ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.security.loginAlerts ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <button
                        onClick={() => 
                          setFormData((prev) => ({
                            ...prev,
                            notification: { ...prev.notification, emailNotifications: !prev.notification.emailNotifications },
                          }))
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          formData.notification.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.notification.emailNotifications ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Order Updates</h4>
                        <p className="text-sm text-gray-500">Get updates about your orders</p>
                      </div>
                      <button
                        onClick={() => 
                          setFormData((prev) => ({
                            ...prev,
                            notification: { ...prev.notification, orderUpdates: !prev.notification.orderUpdates },
                          }))
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          formData.notification.orderUpdates ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.notification.orderUpdates ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Promotions & Deals</h4>
                        <p className="text-sm text-gray-500">Receive promotional offers and deals</p>
                      </div>
                      <button
                        onClick={() => 
                          setFormData((prev) => ({
                            ...prev,
                            notification: { ...prev.notification, promotions: !prev.notification.promotions },
                          }))
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          formData.notification.promotions ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.notification.promotions ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Newsletter</h4>
                        <p className="text-sm text-gray-500">Weekly updates and tips</p>
                      </div>
                      <button
                        onClick={() => 
                          setFormData((prev) => ({
                            ...prev,
                            notification: { ...prev.notification, newsletter: !prev.notification.newsletter },
                          }))
                        }
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          formData.notification.newsletter ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            formData.notification.newsletter ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <BillingTab />
              )}

              {/* Save Button */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Terakhir diubah: 2 hari yang lalu
                  </p>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 border-2 border-gray-300 cursor-pointer text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium">
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-blue-600 text-white cursor-pointer rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}