import { useState } from "react";
import { useAuth, BuyerAccount } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  LogOut,
  Copy,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const {
    buyers,
    buyersLoading,
    fetchBuyers,
    addBuyer,
    removeBuyer,
    updateBuyer,
    toggleBuyerActive,
    logout,
    username,
  } = useAuth();
  const [, navigate] = useLocation();

  // 新規追加フォーム
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newLicenseDays, setNewLicenseDays] = useState("0");
  const [addError, setAddError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  // 編集状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");

  // パスワード表示状態
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAdd = async () => {
    setAddError("");
    if (!newUsername.trim() || !newPassword.trim()) {
      setAddError("ユーザーIDとパスワードは必須です");
      return;
    }
    if (newUsername.length < 3) {
      setAddError("ユーザーIDは3文字以上にしてください");
      return;
    }
    if (newPassword.length < 6) {
      setAddError("パスワードは6文字以上にしてください");
      return;
    }
    setAdding(true);
    const days = parseInt(newLicenseDays, 10);
    let expiresAt: string | null = null;
    if (days > 0) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      // UTC末尾に統一（editと同じ基準）
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      expiresAt = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`).toISOString();
    }
    const success = await addBuyer(
      newUsername.trim(),
      newPassword.trim(),
      newNote.trim(),
      expiresAt
    );
    setAdding(false);
    if (!success) {
      setAddError("このユーザーIDは既に使用されています");
      return;
    }
    toast.success(`購入者 "${newUsername}" を追加しました`);
    setNewUsername("");
    setNewPassword("");
    setNewNote("");
    setNewLicenseDays("0");
    setShowAddForm(false);
  };

  const handleEdit = (buyer: BuyerAccount) => {
    setEditingId(buyer.id);
    setEditUsername(buyer.username);
    setEditPassword(buyer.password);
    setEditNote(buyer.note);
    setEditExpiresAt(
      buyer.expiresAt
        ? new Date(buyer.expiresAt).toISOString().slice(0, 10)
        : ""
    );
  };

  const handleEditSave = async (id: string) => {
    if (!editUsername.trim() || !editPassword.trim()) return;
    const expiresAt = editExpiresAt
      ? new Date(editExpiresAt + "T23:59:59.999Z").toISOString()
      : null;
    await updateBuyer(id, {
      username: editUsername.trim(),
      password: editPassword.trim(),
      note: editNote.trim(),
      expiresAt,
    });
    setEditingId(null);
    toast.success("購入者情報を更新しました");
  };

  const handleRemove = async (buyer: BuyerAccount) => {
    if (
      window.confirm(
        `"${buyer.username}" を削除しますか？この操作は元に戻せません。`
      )
    ) {
      await removeBuyer(buyer.id);
      toast.success(`"${buyer.username}" を削除しました`);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label}をコピーしました`),
      () => toast.error("クリップボードへのコピーに失敗しました")
    );
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeBuyers = buyers.filter(b => b.isActive);
  const inactiveBuyers = buyers.filter(b => !b.isActive);
  const expiredBuyers = buyers.filter(
    b => b.expiresAt && new Date(b.expiresAt) < new Date()
  );
  const expiringSoonBuyers = buyers.filter(
    b =>
      b.expiresAt &&
      new Date(b.expiresAt) >= new Date() &&
      new Date(b.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">
                FX Strategy Doctor
              </h1>
              <p className="text-slate-400 text-xs">
                管理者パネル — {username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-white text-xs"
            >
              ツールを開く
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 統計サマリー */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {buyers.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">総購入者数</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {activeBuyers.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">有効アカウント</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-slate-500">
              {inactiveBuyers.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">無効アカウント</p>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
            <p
              className={`text-2xl font-bold ${expiredBuyers.length > 0 ? "text-red-400" : expiringSoonBuyers.length > 0 ? "text-amber-400" : "text-slate-500"}`}
            >
              {expiredBuyers.length}
              {expiringSoonBuyers.length > 0 && (
                <span className="text-sm text-amber-400 ml-1">
                  (+{expiringSoonBuyers.length})
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">期限切れ</p>
          </Card>
        </div>

        {/* 購入者追加 */}
        <Card className="bg-slate-800/50 border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h2 className="text-white font-semibold">購入者管理</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fetchBuyers()}
                disabled={buyersLoading}
                className="text-slate-400 hover:text-white text-xs"
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${buyersLoading ? "animate-spin" : ""}`}
                />
                更新
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                新規追加
              </Button>
            </div>
          </div>

          {/* 追加フォーム */}
          {showAddForm && (
            <div className="mb-5 p-4 bg-slate-900/50 rounded-lg border border-slate-600 space-y-3">
              <h3 className="text-sm font-medium text-slate-300">
                新規購入者を追加
              </h3>
              {addError && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {addError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    ユーザーID *
                  </label>
                  <Input
                    placeholder="例: user001"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    パスワード *
                  </label>
                  <Input
                    placeholder="例: Pass2026!"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    メモ（任意）
                  </label>
                  <Input
                    placeholder="例: Brain購入者 #001"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    <CalendarClock className="w-3 h-3 inline mr-1" />
                    利用期間
                  </label>
                  <select
                    value={newLicenseDays}
                    onChange={e => setNewLicenseDays(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white text-sm h-8 rounded-md px-2"
                  >
                    <option value="0">無期限（買い切り）</option>
                    <option value="7">7日（お試し）</option>
                    <option value="30">30日</option>
                    <option value="90">90日</option>
                    <option value="180">180日</option>
                    <option value="365">365日</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={adding}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {adding ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  追加する
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddError("");
                  }}
                  className="text-slate-400 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {/* ローディング */}
          {buyersLoading && buyers.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm">購入者リストを読み込み中...</p>
            </div>
          ) : buyers.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">購入者がまだいません</p>
              <p className="text-xs mt-1">
                「新規追加」ボタンから購入者を登録してください
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {buyers.map(buyer => (
                <div
                  key={buyer.id}
                  className={`rounded-lg border p-3 transition-all ${
                    buyer.isActive
                      ? "bg-slate-900/40 border-slate-700"
                      : "bg-slate-900/20 border-slate-800 opacity-60"
                  }`}
                >
                  {editingId === buyer.id ? (
                    // 編集モード
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <Input
                          value={editUsername}
                          onChange={e => setEditUsername(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white text-xs h-7"
                          placeholder="ユーザーID"
                        />
                        <Input
                          value={editPassword}
                          onChange={e => setEditPassword(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white text-xs h-7"
                          placeholder="パスワード"
                        />
                        <Input
                          value={editNote}
                          onChange={e => setEditNote(e.target.value)}
                          className="bg-slate-700/50 border-slate-600 text-white text-xs h-7"
                          placeholder="メモ"
                        />
                        <div className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <Input
                            type="date"
                            value={editExpiresAt}
                            onChange={e => setEditExpiresAt(e.target.value)}
                            className="bg-slate-700/50 border-slate-600 text-white text-xs h-7 flex-1"
                          />
                          {editExpiresAt && (
                            <button
                              onClick={() => setEditExpiresAt("")}
                              className="text-slate-500 hover:text-amber-400 flex-shrink-0"
                              title="無期限に戻す"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(buyer.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-6 px-2"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 text-xs h-6 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // 表示モード
                    <div className="flex items-center gap-3">
                      {/* ステータスドット */}
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          buyer.isActive ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />

                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                        {/* ID */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400 w-6 flex-shrink-0">
                            ID:
                          </span>
                          <span className="text-sm font-mono text-white truncate">
                            {buyer.username}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(buyer.username, "ユーザーID")
                            }
                            className="text-slate-500 hover:text-emerald-400 flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* パスワード */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400 w-6 flex-shrink-0">
                            PW:
                          </span>
                          <span className="text-sm font-mono text-slate-300 truncate">
                            {visiblePasswords.has(buyer.id)
                              ? buyer.password
                              : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(buyer.id)}
                            className="text-slate-500 hover:text-slate-300 flex-shrink-0"
                          >
                            {visiblePasswords.has(buyer.id) ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(buyer.password, "パスワード")
                            }
                            className="text-slate-500 hover:text-emerald-400 flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* メモ */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 truncate">
                            {buyer.note || (
                              <span className="italic">メモなし</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 登録日・期限 */}
                      <div className="flex-shrink-0 hidden sm:flex flex-col items-end gap-0.5">
                        <span className="text-xs text-slate-600">
                          {new Date(buyer.createdAt).toLocaleDateString(
                            "ja-JP"
                          )}
                        </span>
                        {buyer.expiresAt ? (
                          <span
                            className={`text-xs flex items-center gap-0.5 ${
                              new Date(buyer.expiresAt) < new Date()
                                ? "text-red-400"
                                : new Date(buyer.expiresAt).getTime() -
                                      Date.now() <
                                    7 * 24 * 60 * 60 * 1000
                                  ? "text-amber-400"
                                  : "text-slate-500"
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(buyer.expiresAt) < new Date()
                              ? "期限切れ"
                              : `〜${new Date(buyer.expiresAt).toLocaleDateString("ja-JP")}`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">無期限</span>
                        )}
                      </div>

                      {/* アクションボタン */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleBuyerActive(buyer.id)}
                          className={`transition-colors ${
                            buyer.isActive
                              ? "text-emerald-400 hover:text-slate-400"
                              : "text-slate-600 hover:text-emerald-400"
                          }`}
                          title={buyer.isActive ? "無効化する" : "有効化する"}
                        >
                          {buyer.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(buyer)}
                          className="text-slate-500 hover:text-cyan-400 transition-colors"
                          title="編集"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemove(buyer)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 使い方ガイド */}
        <Card className="bg-slate-800/30 border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            管理者ガイド
          </h3>
          <div className="space-y-2 text-xs text-slate-500">
            <p>
              • <span className="text-slate-400">購入者追加:</span>{" "}
              「新規追加」ボタンからID・パスワード・メモを入力して登録します
            </p>
            <p>
              • <span className="text-slate-400">ID/PW通知:</span>{" "}
              各行のコピーボタンでID・パスワードをクリップボードにコピーして購入者に送付します
            </p>
            <p>
              • <span className="text-slate-400">有効/無効:</span>{" "}
              トグルボタンでアカウントを一時停止・再開できます（返金対応時などに使用）
            </p>
            <p>
              • <span className="text-slate-400">利用期限:</span>{" "}
              デフォルトは「無期限（買い切り）」。お試し用に期間限定も設定可能。期限切れアカウントは自動的にログイン不可になります
            </p>
            <p>
              • <span className="text-slate-400">管理者ログイン:</span>{" "}
              ID・パスワードはサーバー環境変数（ADMIN_USERNAME /
              ADMIN_PASSWORD）で設定されています
            </p>
            <p>
              • <span className="text-slate-400">データ保存:</span>{" "}
              購入者情報はCloudflare
              KVに保存されます。すべてのデバイスから管理可能です
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
