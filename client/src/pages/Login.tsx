import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, ShieldCheck } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const ja = language === "ja";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate("/");
      } else if (result.expired) {
        setError(
          ja
            ? "ご利用期限が終了しています。\n引き続きご利用いただく場合は、販売ページのメッセージ機能より延長をお申し込みください。"
            : "Your account has expired.\nTo continue using the service, please request an extension via the sales page messaging feature."
        );
      } else {
        setError(
          ja
            ? "ユーザーIDまたはパスワードが正しくありません。\nご購入後に発行されたID/パスワードをご確認ください。"
            : "Invalid username or password.\nPlease check the credentials provided after your purchase."
        );
      }
    } catch {
      setError(
        ja
          ? "ログイン処理中にエラーが発生しました"
          : "An error occurred during login"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              FX Strategy Doctor
            </h1>
          </div>
          <p className="text-slate-400 text-sm">by Dr. Trading</p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">
              {ja ? "ログイン" : "Login"}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm whitespace-pre-line">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {ja ? "ユーザーID" : "User ID"}
              </label>
              <Input
                type="text"
                placeholder={ja ? "ユーザーIDを入力" : "Enter your User ID"}
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {ja ? "パスワード" : "Password"}
              </label>
              <Input
                type="password"
                placeholder={ja ? "パスワードを入力" : "Enter your password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-2"
            >
              {isLoading
                ? ja
                  ? "ログイン中..."
                  : "Logging in..."
                : ja
                  ? "ログイン"
                  : "Login"}
            </Button>
          </form>

          {/* Buyer info message */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              {ja ? (
                <>
                  ログイン情報は購入後にご案内します。
                  <br />
                  お問い合わせは販売ページのメッセージ機能をご利用ください。
                </>
              ) : (
                <>
                  Login credentials will be provided after purchase.
                  <br />
                  For inquiries, please use the messaging feature on the sales page.
                </>
              )}
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 Dr. Trading. All rights reserved.
        </p>
      </div>
    </div>
  );
}
