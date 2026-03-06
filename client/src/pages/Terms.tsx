import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            戻る
          </Button>
          <h1 className="text-xl font-bold text-white">利用規約</h1>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="container py-12 max-w-3xl">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-slate-300 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">FX Strategy Doctor 利用規約</h2>
            <p className="text-sm text-slate-400">最終更新日: 2026年3月5日</p>
          </div>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第1条 総則</h3>
            <p className="mb-3">
              本利用規約は、Dr. Trading（以下「提供者」）が提供するFX Strategy Doctor（以下「本サービス」）の利用条件を定めるものです。ユーザーが本サービスにアクセスし利用することで、本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第2条 著作権・知的財産権</h3>
            <p className="mb-3">
              本サービスのすべてのコンテンツ、デザイン、機能、データベース、ロジック、アルゴリズムは、Dr. Tradingまたはその提供者に帰属する著作物です。著作権法により保護されています。
            </p>
            <p>
              © 2026 Dr. Trading. All rights reserved.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第3条 利用許諾</h3>
            <p className="mb-3">
              提供者は、ユーザーに対し、本サービスを個人的、非商業的な目的で利用する権利のみを許諾します。以下の行為は禁止されています：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本サービスの全部または一部の複製、改変、翻案</li>
              <li>本サービスの再販売、転売、レンタル</li>
              <li>本サービスの無断配布、公開、共有</li>
              <li>リバースエンジニアリング、逆アセンブリ、デコンパイル</li>
              <li>本サービスを利用した類似サービスの開発・提供</li>
              <li>ログイン情報の第三者への共有、貸与</li>
              <li>本サービスを利用した営利目的の活動</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第4条 アカウント管理</h3>
            <p className="mb-3">
              ユーザーは、自身のアカウント情報（ユーザーID、パスワード）を厳格に管理する責任があります。以下の行為は禁止されています：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>ログイン情報の第三者への開示</li>
              <li>複数人でのアカウント共有</li>
              <li>他人のアカウントの無断利用</li>
            </ul>
            <p className="mt-3">
              アカウント情報の不正利用が発見された場合、提供者はアカウントを停止する権利を有します。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第5条 データプライバシー</h3>
            <p className="mb-3">
              本サービスはブラウザ内で完結し、ユーザーのトレード履歴データはサーバーに送信されません。ユーザーのプライバシーは保護されます。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第6条 免責事項</h3>
            <p className="mb-3">
              本サービスの分析結果は参考情報であり、投資判断の根拠として使用することはできません。以下の事項について、提供者は一切の責任を負いません：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>分析結果の正確性、完全性、有用性</li>
              <li>ユーザーが本サービスを利用して被った損失</li>
              <li>投資判断に基づく損益</li>
              <li>本サービスの中断、停止、エラー</li>
            </ul>
            <p className="mt-3">
              投資判断はユーザー自身の責任で行ってください。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第7条 サービス停止</h3>
            <p className="mb-3">
              提供者は、以下の場合、ユーザーへの事前通知なしにサービスを停止、中断、または終了する権利を有します：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>本規約に違反する行為が認められた場合</li>
              <li>ログイン情報の不正利用が疑われた場合</li>
              <li>システムメンテナンスが必要な場合</li>
              <li>その他正当な理由がある場合</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第8条 規約の変更</h3>
            <p className="mb-3">
              提供者は、本規約を予告なく変更する権利を有します。変更後のサービス利用をもって、新規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第9条 準拠法</h3>
            <p className="mb-3">
              本規約は日本国法に準拠し、日本国の裁判所の管轄に服するものとします。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-3">第10条 お問い合わせ</h3>
            <p className="mb-3">
              本規約に関するご質問やご不明な点がある場合は、お問い合わせください。
            </p>
          </section>

          <div className="pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              © 2026 Dr. Trading. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
