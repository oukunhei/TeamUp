import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import {
  ideaApi,
  applicationApi,
  documentApi,
} from "@/services/api";
import { Idea, Application, Document } from "@/types";
import ApplicationDetailModal from "@/components/ApplicationDetailModal";
import {
  Loader2,
  Users,
  Tag,
  Calendar,
  Shield,
  FileText,
  Upload,
  Download,
  History,
  ChevronLeft,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpCircle,
  MessageSquare,
} from "lucide-react";

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [appMessage, setAppMessage] = useState("");
  const [showVersionModal, setShowVersionModal] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchIdea = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await ideaApi.get(id);
      setIdea(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdea();
  }, [id]);

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      await applicationApi.create({ ideaId: id, message: appMessage });
      alert("申请已发送");
      setAppMessage("");
      fetchIdea();
    } catch (err: any) {
      alert(err.response?.data?.message || "申请失败");
    } finally {
      setApplying(false);
    }
  };

  const handleReview = async (appId: string, status: "APPROVED" | "REJECTED" | "VIEWER", reply?: string) => {
    try {
      await applicationApi.review(appId, { status, reply });
      fetchIdea();
    } catch (err: any) {
      alert(err.response?.data?.message || "操作失败");
    }
  };

  const handlePromote = async (appId: string) => {
    try {
      await applicationApi.promote(appId);
      fetchIdea();
    } catch (err: any) {
      alert(err.response?.data?.message || "操作失败");
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await ideaApi.publish(id);
      alert("发布成功");
      fetchIdea();
    } catch (err: any) {
      alert(err.response?.data?.message || "发布失败");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ideaId", id);
    formData.append("name", file.name);
    try {
      await documentApi.upload(formData);
      alert("上传成功");
      fetchIdea();
    } catch (err: any) {
      alert(err.response?.data?.message || "上传失败");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }
  if (!idea) return <div className="text-center py-20 text-gray-500">创意不存在</div>;

  const isHolder = idea.holderId === user?.id;
  const isMember = idea.canEdit;
  const isViewer = idea.viewerMode;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> 返回
      </button>

      <div className="bg-white border rounded-xl p-6 md:p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{idea.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {idea.holder?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(idea.createdAt).toLocaleDateString()}
              </span>
              {idea.hash && (
                <span className="flex items-center gap-1 text-green-600">
                  <Shield className="w-3.5 h-3.5" />
                  已存证
                </span>
              )}
            </div>
          </div>
          {isHolder && (
            <div className="flex items-center gap-2">
              {idea.status === "DRAFT" && (
                <button
                  onClick={handlePublish}
                  className="text-sm bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg"
                >
                  正式发布
                </button>
              )}
              <Link
                to={`/ideas/${idea.id}/edit`}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
              >
                编辑
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {idea.requiredSkills.map((s) => (
            <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-md">
              {s}
            </span>
          ))}
        </div>

        <div className="prose max-w-none mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">项目概述</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{idea.summary}</p>
        </div>

        {/* 只读/成员可见区域 */}
        {(isMember || isViewer) && idea.detail && (
          <div className="border-t pt-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-700">
                项目详情 {isViewer && <span className="text-amber-600 font-normal">(只读模式)</span>}
              </h3>
            </div>
            <div className={`bg-gray-50 rounded-lg p-4 ${isViewer ? "select-none" : ""}`}>
              <p className="text-gray-700 whitespace-pre-wrap">{idea.detail}</p>
            </div>
          </div>
        )}

        {/* 申请区 */}
        {!isHolder && !isMember && !isViewer && idea.status === "PUBLISHED" && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">申请加入</h3>
            <textarea
              value={appMessage}
              onChange={(e) => setAppMessage(e.target.value)}
              placeholder="介绍一下自己，为什么想加入这个项目..."
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none mb-3"
              rows={3}
            />
            <button
              onClick={handleApply}
              disabled={applying}
              className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" /> 发送申请
            </button>
          </div>
        )}

        {/* Holder 的申请管理 */}
        {isHolder && idea.applications && idea.applications.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">加入申请</h3>
            <div className="space-y-3">
              {idea.applications.map((app) => (
                <ApplicationRow key={app.id} app={app} onReview={handleReview} onPromote={handlePromote} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 文档区 */}
      {(isMember || isViewer) && (
        <div className="bg-white border rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              项目文档
            </h2>
            {isMember && (
              <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                上传新版本
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            )}
          </div>
          <DocumentList ideaId={idea.id} canDownload={!!idea.canDownload} onVersionClick={setShowVersionModal} />
        </div>
      )}

      {showVersionModal && (
        <VersionModal
          docId={showVersionModal}
          onClose={() => setShowVersionModal(null)}
          canRollback={!!isMember}
        />
      )}
    </div>
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
    DRAFT: "草稿", PUBLISHED: "已发布", RECRUITING: "招募中", IN_PROGRESS: "进行中", COMPLETED: "已完成",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${map[status] || map.DRAFT}`}>
      {label[status] || status}
    </span>
  );
}

function ApplicationRow({
  app,
  onReview,
  onPromote,
}: {
  app: Application;
  onReview: (id: string, status: "APPROVED" | "REJECTED" | "VIEWER", reply?: string) => void;
  onPromote: (id: string) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  if (app.status === "WITHDRAWN") return null;

  return (
    <>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
              {app.user?.name?.[0] || "?"}
            </div>
            <div>
              <p className="font-medium text-sm">{app.user?.name}</p>
              <p className="text-xs text-gray-500">{app.user?.skills?.join(", ")}</p>
            </div>
          </div>
          <StatusBadge status={app.status} />
        </div>
        {app.message && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{app.message}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setShowDetail(true)}
            className="text-xs bg-white border text-gray-700 px-3 py-1.5 rounded-md font-medium hover:bg-gray-50 flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" /> 查看申请详情
          </button>
          {app.status === "PENDING" && (
            <>
              <button
                onClick={() => onReview(app.id, "VIEWER")}
                className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md font-medium hover:bg-amber-200 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> 给只读权限
              </button>
              <button
                onClick={() => onReview(app.id, "APPROVED")}
                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-md font-medium hover:bg-green-200 flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" /> 直接通过
              </button>
              <button
                onClick={() => onReview(app.id, "REJECTED")}
                className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-md font-medium hover:bg-red-200 flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" /> 拒绝
              </button>
            </>
          )}
          {app.isViewer && (
            <button
              onClick={() => onPromote(app.id)}
              className="text-xs bg-primary-100 text-primary-700 px-3 py-1.5 rounded-md font-medium hover:bg-primary-200 flex items-center gap-1"
            >
              <ArrowUpCircle className="w-3 h-3" /> 升级为核心成员
            </button>
          )}
        </div>
      </div>
      {showDetail && (
        <ApplicationDetailModal
          app={app}
          onReview={onReview}
          onPromote={onPromote}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

function DocumentList({
  ideaId,
  canDownload,
  onVersionClick,
}: {
  ideaId: string;
  canDownload: boolean;
  onVersionClick: (id: string) => void;
}) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentApi
      .listByIdea(ideaId)
      .then((res) => setDocs(res.data))
      .finally(() => setLoading(false));
  }, [ideaId]);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-primary-600" />;
  if (docs.length === 0) return <p className="text-sm text-gray-500">暂无文档</p>;

  return (
    <div className="space-y-3">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-gray-500">
                v{doc.version} · {(doc.size / 1024).toFixed(1)}KB · {doc.uploader?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVersionClick(doc.id)}
              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
            >
              <History className="w-3 h-3" /> 版本历史
            </button>
            {canDownload && (
              <a
                href={`/api/documents/${doc.id}/download`}
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> 下载
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function VersionModal({ docId, onClose, canRollback }: { docId: string; onClose: () => void; canRollback: boolean }) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentApi
      .versions(docId)
      .then((res) => setVersions(res.data))
      .finally(() => setLoading(false));
  }, [docId]);

  const handleRollback = async (versionNumber: number) => {
    if (!confirm(`确定回滚到 v${versionNumber}？`)) return;
    try {
      await documentApi.rollback(docId, versionNumber);
      alert("回滚成功");
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "回滚失败");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">版本历史</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-2">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium">
                    v{v.versionNumber} {v.id === "current" && <span className="text-primary-600 text-xs">当前</span>}
                  </p>
                  <p className="text-xs text-gray-500">{v.comment || "无备注"}</p>
                </div>
                {canRollback && v.id !== "current" && (
                  <button
                    onClick={() => handleRollback(v.versionNumber)}
                    className="text-xs bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700"
                  >
                    回滚到此版本
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
