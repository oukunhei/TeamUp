import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ideaApi } from "@/services/api";
import { Loader2, Lightbulb } from "lucide-react";

export default function EditIdea() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    detail: "",
    requiredSkills: "",
    teamSize: "",
  });

  useEffect(() => {
    if (!id) return;
    ideaApi
      .get(id)
      .then((res) => {
        const d = res.data;
        setForm({
          title: d.title || "",
          summary: d.summary || "",
          detail: d.detail || "",
          requiredSkills: (d.requiredSkills || []).join(", "),
          teamSize: d.teamSize ? String(d.teamSize) : "",
        });
      })
      .catch(() => alert("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await ideaApi.update(id, {
        title: form.title,
        summary: form.summary,
        detail: form.detail || undefined,
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        teamSize: form.teamSize ? parseInt(form.teamSize) : undefined,
      });
      navigate(`/ideas/${id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Lightbulb className="w-6 h-6 text-primary-600" />
        编辑创意
      </h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 md:p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">标题</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="给你的创意起个名字"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            公开概述 <span className="text-gray-400 font-normal">（所有人可见）</span>
          </label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            rows={4}
            placeholder="简要描述你的创意，吸引潜在队友..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            详细内容 <span className="text-gray-400 font-normal">（仅审批通过者可见）</span>
          </label>
          <textarea
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            rows={6}
            placeholder="详细描述项目方案、预期成果、分工计划等..."
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">所需技能（用逗号分隔）</label>
            <input
              type="text"
              value={form.requiredSkills}
              onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="React, Python, UI Design"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">期望人数</label>
            <input
              type="number"
              value={form.teamSize}
              onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="不限"
              min={1}
              max={20}
            />
          </div>
        </div>
        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            保存修改
          </button>
          <button
            type="button"
            onClick={() => navigate(`/ideas/${id}`)}
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
