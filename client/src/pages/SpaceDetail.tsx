import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { spaceApi, ideaApi } from "@/services/api";
import { Space, Idea } from "@/types";
import { Users, Lightbulb, Loader2, Copy, CheckCircle } from "lucide-react";

export default function SpaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      spaceApi.get(id).then((r) => setSpace(r.data)),
      ideaApi.list({ spaceId: id }).then((r) => setIdeas(r.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    try {
      await spaceApi.join(id, joinCode);
      alert("加入成功");
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || "加入失败");
    }
  };

  const copyCode = () => {
    if (space?.joinCode) {
      navigator.clipboard.writeText(space.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  if (!space) return <div className="text-center py-20 text-gray-500">空间不存在</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white border rounded-xl p-6 md:p-8 mb-6">
        <h1 className="text-2xl font-bold mb-2">{space.name}</h1>
        <p className="text-gray-500 mb-4">{space.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {space.members?.length || 0} 成员</span>
          <span className="flex items-center gap-1"><Lightbulb className="w-4 h-4" /> {ideas.length} 创意</span>
          {space.courseCode && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{space.courseCode}</span>}
          {space.semester && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{space.semester}</span>}
        </div>

        {space.joinCode && (
          <div className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="text-sm text-amber-800">邀请码：{space.joinCode}</span>
            <button onClick={copyCode} className="text-xs text-amber-700 hover:underline flex items-center gap-1">
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        )}

        {!space.members?.some((m) => m.userId) && (
          <div className="mt-4 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="输入邀请码加入"
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={handleJoin} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">加入</button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">空间内的创意</h2>
        <Link to="/ideas/create" className="text-sm text-primary-600 hover:underline">发布创意</Link>
      </div>
      {ideas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white border rounded-xl">暂无创意</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <Link key={idea.id} to={`/ideas/${idea.id}`} className="bg-white border rounded-xl p-5 hover:shadow-md transition block">
              <h3 className="font-semibold mb-2">{idea.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{idea.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
