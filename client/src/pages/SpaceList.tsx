import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { spaceApi } from "@/services/api";
import { Space } from "@/types";
import { Globe, BookOpen, Users, Loader2, Plus } from "lucide-react";

export default function SpaceList() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "OPEN" as "OPEN" | "COURSE", courseCode: "", courseName: "", semester: "" });

  useEffect(() => {
    spaceApi.list().then((res) => setSpaces(res.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await spaceApi.create(form);
      setSpaces([data, ...spaces]);
      setShowCreate(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "创建失败");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">空间</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 创建空间
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 mb-8 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">名称</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "OPEN" | "COURSE" })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="OPEN">开放空间</option>
                <option value="COURSE">课程空间</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
          </div>
          {form.type === "COURSE" && (
            <div className="grid md:grid-cols-3 gap-4">
              <input placeholder="课程代码" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="课程名称" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="学期" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">创建</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">取消</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-20 text-gray-500">暂无空间</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <Link key={space.id} to={`/spaces/${space.id}`} className="bg-white border rounded-xl p-5 hover:shadow-md transition block">
              <div className="flex items-center gap-3 mb-3">
                {space.type === "OPEN" ? <Globe className="w-5 h-5 text-primary-600" /> : <BookOpen className="w-5 h-5 text-amber-600" />}
                <h3 className="font-semibold">{space.name}</h3>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{space.description || "暂无描述"}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {space._count?.members || 0} 成员</span>
                <span>{space.type === "OPEN" ? "开放空间" : "课程空间"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
