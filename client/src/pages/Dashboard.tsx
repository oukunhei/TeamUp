import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { ideaApi, applicationApi, notificationApi } from "@/services/api";
import { Idea, Application, Notification } from "@/types";
import { Lightbulb, Send, Inbox, Bell, Loader2, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [sentApps, setSentApps] = useState<Application[]>([]);
  const [receivedApps, setReceivedApps] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ideaApi.list({}).then((r) => setMyIdeas(r.data.filter((i: Idea) => i.holderId === user?.id))),
      applicationApi.sent().then((r) => setSentApps(r.data)),
      applicationApi.received().then((r) => setReceivedApps(r.data)),
      notificationApi.list({ unreadOnly: false }).then((r) => setNotifications(r.data)),
    ]).finally(() => setLoading(false));
  }, [user?.id]);

  const markAllRead = async () => {
    await notificationApi.readAll();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (!user) return <div className="text-center py-20 text-gray-500">请先登录</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">个人中心</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左栏 */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="我的创意" icon={<Lightbulb className="w-4 h-4" />}>
            {myIdeas.length === 0 ? (
              <p className="text-sm text-gray-500">
                还没有发布创意，<Link to="/ideas/create" className="text-primary-600">去发布</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {myIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    to={`/ideas/${idea.id}`}
                    className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{idea.title}</span>
                      <StatusBadge status={idea.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="我的申请" icon={<Send className="w-4 h-4" />}>
            {sentApps.length === 0 ? (
              <p className="text-sm text-gray-500">还没有发送申请</p>
            ) : (
              <div className="space-y-2">
                {sentApps.map((app) => (
                  <div key={app.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Link to={`/ideas/${app.ideaId}`} className="font-medium text-sm hover:text-primary-600">
                        {app.idea?.title}
                      </Link>
                      <AppStatusBadge status={app.status} isViewer={app.isViewer} />
                    </div>
                    {app.reply && <p className="text-xs text-gray-500 mt-1">回复：{app.reply}</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="收到的申请" icon={<Inbox className="w-4 h-4" />}>
            {receivedApps.length === 0 ? (
              <p className="text-sm text-gray-500">暂无收到申请</p>
            ) : (
              <div className="space-y-2">
                {receivedApps.slice(0, 10).map((app) => (
                  <div key={app.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{app.user?.name}</span>
                        <span className="text-xs text-gray-500">申请加入「{app.idea?.title}」</span>
                      </div>
                      <AppStatusBadge status={app.status} isViewer={app.isViewer} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* 右栏 - 通知 */}
        <div>
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" />
                通知
              </h2>
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                全部已读
              </button>
            </div>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-500">暂无通知</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`text-sm ${n.isRead ? "text-gray-500" : "text-gray-800 font-medium"}`}>
                    <p>{n.title}</p>
                    <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <h2 className="font-semibold flex items-center gap-2 mb-4 text-gray-800">
        {icon}
        {title}
      </h2>
      {children}
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

function AppStatusBadge({ status, isViewer }: { status: string; isViewer: boolean }) {
  if (status === "APPROVED" && isViewer) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">只读权限</span>;
  if (status === "APPROVED") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md">已通过</span>;
  if (status === "REJECTED") return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-md">已拒绝</span>;
  if (status === "WITHDRAWN") return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">已撤回</span>;
  return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">待处理</span>;
}
