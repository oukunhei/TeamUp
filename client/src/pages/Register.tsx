import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { Mail, Lock, User, GraduationCap, Loader2 } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    studentId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-center mb-2">创建账号</h1>
        <p className="text-center text-gray-500 text-sm mb-8">加入 TeamUp，找到你的队友</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">姓名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="你的名字"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">学号（可选）</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="2024xxxxxx"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="至少6位"
                required
                minLength={6}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            注册
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          已有账号？{" "}
          <Link to="/login" className="text-primary-600 font-medium">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
