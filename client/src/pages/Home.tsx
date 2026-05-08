import { Link } from "react-router-dom";
import { Lightbulb, Users, Shield, FolderOpen } from "lucide-react";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            找到志同道合的队友
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            TeamUp 是一个创意驱动的大学生组队平台，让有想法的人与有技能的人高效匹配
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/ideas"
              className="bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition"
            >
              浏览创意广场
            </Link>
            <Link
              to="/ideas/create"
              className="bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-800 transition border border-primary-500"
            >
              发布我的创意
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Lightbulb className="w-8 h-8 text-primary-600" />}
              title="创意广场"
              desc="浏览和发布项目创意，快速找到感兴趣的团队"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-primary-600" />}
              title="双向筛选"
              desc="申请后获得只读权限，双方确认后再正式组队"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-primary-600" />}
              title="时间戳存证"
              desc="创意发布即生成不可篡改的哈希证书，保护原创性"
            />
            <FeatureCard
              icon={<FolderOpen className="w-8 h-8 text-primary-600" />}
              title="版本控制"
              desc="文档自动归档历史版本，随时回滚查看过往快照"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}
