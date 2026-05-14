import { useState } from "react";
import { Application } from "@/types";
import { Eye, CheckCircle, XCircle, ArrowUpCircle } from "lucide-react";

interface Props {
  app: Application;
  onReview: (id: string, status: "APPROVED" | "REJECTED" | "VIEWER", reply?: string) => void;
  onPromote?: (id: string) => void;
  onClose: () => void;
}

export default function ApplicationDetailModal({ app, onReview, onPromote, onClose }: Props) {
  const [reply, setReply] = useState(app.reply || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">申请详情</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-5">
          {/* 申请人信息 */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold shrink-0">
              {app.user?.name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-base">{app.user?.name}</p>
              {app.user?.skills && app.user.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {app.user.skills.map((s) => (
                    <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {app.user?.bio && <p className="text-sm text-gray-600 mt-2">{app.user.bio}</p>}
            </div>
          </div>

          {/* 申请信息 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">申请项目</span>
              <span className="text-sm text-gray-700 font-medium">{app.idea?.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">申请时间</span>
              <span className="text-sm text-gray-700">{new Date(app.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">当前状态</span>
              <AppStatusBadge status={app.status} isViewer={app.isViewer} />
            </div>
            {app.message && (
              <div>
                <span className="text-sm text-gray-500 block mb-1">申请留言</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-md p-3 border">{app.message}</p>
              </div>
            )}
            {app.reply && (
              <div>
                <span className="text-sm text-gray-500 block mb-1">审批回复</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-md p-3 border">{app.reply}</p>
              </div>
            )}
          </div>

          {/* 审批操作 */}
          {app.status === "PENDING" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">审批回复（可选）</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="输入回复内容..."
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReview(app.id, "VIEWER", reply); onClose(); }}
                  className="flex-1 text-sm bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-medium hover:bg-amber-200 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" /> 给只读权限
                </button>
                <button
                  onClick={() => { onReview(app.id, "APPROVED", reply); onClose(); }}
                  className="flex-1 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-200 flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> 通过申请
                </button>
                <button
                  onClick={() => { onReview(app.id, "REJECTED", reply); onClose(); }}
                  className="flex-1 text-sm bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> 拒绝申请
                </button>
              </div>
            </div>
          )}

          {app.isViewer && onPromote && (
            <div className="flex gap-2">
              <button
                onClick={() => { onPromote(app.id); onClose(); }}
                className="w-full text-sm bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-1"
              >
                <ArrowUpCircle className="w-4 h-4" /> 升级为核心成员
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppStatusBadge({ status, isViewer }: { status: string; isViewer: boolean }) {
  if (status === "APPROVED" && isViewer) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-medium">只读权限</span>;
  if (status === "APPROVED") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">已通过</span>;
  if (status === "REJECTED") return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-medium">已拒绝</span>;
  if (status === "WITHDRAWN") return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">已撤回</span>;
  return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">待处理</span>;
}
