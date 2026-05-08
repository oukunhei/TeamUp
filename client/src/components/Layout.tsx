import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { Lightbulb, Bell, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl">
                <Lightbulb className="w-6 h-6" />
                TeamUp
              </Link>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                <Link to="/ideas" className="hover:text-primary-600 transition-colors">
                  创意广场
                </Link>
                <Link to="/spaces" className="hover:text-primary-600 transition-colors">
                  空间
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <Bell className="w-4 h-4" />
                    通知
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <User className="w-4 h-4" />
                    {user.name}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    退出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
            <button className="md:hidden flex items-center" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2 bg-white">
            <Link to="/ideas" className="block text-gray-600" onClick={() => setMobileOpen(false)}>
              创意广场
            </Link>
            <Link to="/spaces" className="block text-gray-600" onClick={() => setMobileOpen(false)}>
              空间
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block text-gray-600" onClick={() => setMobileOpen(false)}>
                  个人中心
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                    setMobileOpen(false);
                  }}
                  className="block text-red-600"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-primary-600" onClick={() => setMobileOpen(false)}>
                  登录
                </Link>
                <Link to="/register" className="block text-primary-600" onClick={() => setMobileOpen(false)}>
                  注册
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          TeamUp - 大学生小组作业组队平台
        </div>
      </footer>
    </div>
  );
}
