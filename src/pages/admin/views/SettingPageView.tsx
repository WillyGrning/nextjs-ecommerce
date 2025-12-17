import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
  Camera,
  Edit2,
} from "lucide-react";
import Image from "next/image";

export default function SettingPageView() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");

  // Profile State
  const [profile, setProfile] = useState({
    fullname: session?.user?.name || "",
    email: session?.user?.email || "",
    avatar: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/setting/user");
      const data = await res.json();

      setProfile({
        fullname: data.fullName,
        email: data.email,
        avatar: data.image, // ← DARI DB
      });
    };

    fetchProfile();
  }, []);

  const imageSrc = preview || profile?.avatar;

  // Password State
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderUpdates: true,
    productUpdates: false,
    securityAlerts: true,
    weeklyReport: true,
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: "light",
    language: "en",
  });

  // Security Settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
  });

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "password", name: "Password", icon: Lock },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "security", name: "Security", icon: Shield },
  ];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // API call to update profile
      const res = await fetch("/api/setting/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        // Update session
        await update();
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      const avatarDataUrl = reader.result as string;
      setPreview(avatarDataUrl);
      setProfile((prev) => ({
        ...prev,
        avatar: avatarDataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      alert("New passwords do not match!");
      return;
    }

    if (password.new.length < 8) {
      alert("Password must be at least 8 characters!");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/setting/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.new,
        }),
      });

      if (res.ok) {
        alert("Password changed successfully!");
        setPassword({ current: "", new: "", confirm: "" });
      } else {
        const data = await res.json();
        alert(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      alert("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (type: string) => {
    setSaving(true);
    try {
      const data =
        type === "notifications"
          ? notifications
          : type === "appearance"
          ? appearance
          : security;

      const res = await fetch(`/api/user/settings/${type}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center cursor-pointer gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Profile Information
                  </h2>
                  <p className="text-gray-500">
                    Update your personal information
                  </p>
                </div>

                {/* Avatar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {imageSrc ? (
                        <Image
                          width={24}
                          height={24}
                          src={
                            preview ||
                            profile.avatar ||
                            "/image/placeholder.png"
                          }
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100"
                        />
                      ) : (
                        profile.fullname.charAt(0).toUpperCase()
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 cursor-pointer px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Change Photo
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.fullname}
                    onChange={(e) =>
                      setProfile({ ...profile, fullname: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center cursor-pointer gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Change Password
                  </h2>
                  <p className="text-gray-500">
                    Update your password to keep your account secure
                  </p>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      value={password.current}
                      onChange={(e) =>
                        setPassword({ ...password, current: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all pr-12"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          current: !showPassword.current,
                        })
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword.current ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      value={password.new}
                      onChange={(e) =>
                        setPassword({ ...password, new: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all pr-12"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          new: !showPassword.new,
                        })
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword.new ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={password.confirm}
                      onChange={(e) =>
                        setPassword({ ...password, confirm: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all pr-12"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          confirm: !showPassword.confirm,
                        })
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Change Password Button */}
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {saving ? "Updating..." : "Change Password"}
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Notification Preferences
                  </h2>
                  <p className="text-gray-500">
                    Choose what notifications you want to receive
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {key === "emailNotifications" &&
                            "Receive email notifications"}
                          {key === "orderUpdates" && "Get updates about orders"}
                          {key === "productUpdates" &&
                            "Get notified about new products"}
                          {key === "securityAlerts" &&
                            "Receive security alerts"}
                          {key === "weeklyReport" &&
                            "Receive weekly performance reports"}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({ ...notifications, [key]: !value })
                        }
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          value ? "bg-indigo-600" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            value ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSaveSettings("notifications")}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Appearance Settings
                  </h2>
                  <p className="text-gray-500">
                    Customize how the admin panel looks
                  </p>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {["light", "dark", "auto"].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setAppearance({ ...appearance, theme })}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          appearance.theme === theme
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-semibold capitalize">{theme}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={appearance.language}
                    onChange={(e) =>
                      setAppearance({ ...appearance, language: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <button
                  onClick={() => handleSaveSettings("appearance")}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Security Settings
                  </h2>
                  <p className="text-gray-500">
                    Manage your account security options
                  </p>
                </div>

                {/* Two-Factor Auth */}
                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSecurity({
                          ...security,
                          twoFactorAuth: !security.twoFactorAuth,
                        })
                      }
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        security.twoFactorAuth ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          security.twoFactorAuth
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Session Timeout */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Timeout
                  </label>
                  <select
                    value={security.sessionTimeout}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        sessionTimeout: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <button
                  onClick={() => handleSaveSettings("security")}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Security Settings"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
