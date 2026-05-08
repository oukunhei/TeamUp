import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ideaApi } from "@/services/api";
import { Idea } from "@/types";
import { Lightbulb, Users, Search, Tag, Loader2 } from "lucide-react";

export default function IdeaHub() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");

  useEffect(() => {
    ideaApi
      .list({ search: search || undefined, skill: skill || undefined })
      .then((res) => setIdeas(res.data))
      .finally(() => setLoading(false));
  }, [search, skill]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary-600" />
          创意广场
        </h1>
        <Link
          to="/ideas/create"
          className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 self-start"
        >
          + 发布创意
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索创意..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div className="relative w-48">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="技能标签"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          暂无创意，<Link to="/ideas/create" className="text-primary-600">发布第一个</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link
      to={`/ideas/${idea.id}`}
      className="bg-white border rounded-xl p-5 hover:shadow-md transition block"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg line-clamp-1">{idea.title}</h3>
        <StatusBadge status={idea.status} />
      </div>
      <p className="text-gray-500 text-sm line-clamp-3 mb-4">{idea.summary}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {idea.requiredSkills.slice(0, 5).map((s) => (
          <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-md">
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {idea.holder?.name?.[0] || "?"}
          </div>
          <span>{idea.holder?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {idea._count?.members || 0}/{idea.teamSize || "∞"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-green-100 text-green-700",
    RECRUITING: "bg-primary-100 text-primary-700",
    IN_PROGRESS: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-purple-100 text-purple-700",
  };
  const label: Record<string, string> = {
    DRAFT: "草稿",
    PUBLISHED: "已发布",
    RECRUITING: "招募中",
    IN_PROGRESS: "进行中",
    COMPLETED: "已完成",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium ${map[status] || map.DRAFT}`}>
      {label[status] || status}
    </span>
  );
}
