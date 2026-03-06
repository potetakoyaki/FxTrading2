import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BuyerAccount {
  id: string;
  username: string;
  password: string;
  note: string; // 購入者メモ（プラットフォーム名など）
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // 管理者機能
  buyers: BuyerAccount[];
  addBuyer: (username: string, password: string, note: string) => boolean;
  removeBuyer: (id: string) => void;
  updateBuyer: (id: string, updates: Partial<BuyerAccount>) => void;
  toggleBuyerActive: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'fx-doctor-auth';
const BUYERS_STORAGE_KEY = 'fx-doctor-buyers';

const generateId = () => `buyer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const getDefaultBuyers = (): BuyerAccount[] => {
  // 初期サンプル購入者（実際の運用では削除してください）
  return [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [buyers, setBuyers] = useState<BuyerAccount[]>([]);

  // ページロード時にLocalStorageから認証情報と購入者リストを復元
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const { username: storedUsername, isAdmin: storedIsAdmin } = JSON.parse(storedAuth);
        setUsername(storedUsername);
        setIsAuthenticated(true);
        setIsAdmin(!!storedIsAdmin);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const storedBuyers = localStorage.getItem(BUYERS_STORAGE_KEY);
    if (storedBuyers) {
      try {
        setBuyers(JSON.parse(storedBuyers));
      } catch {
        setBuyers(getDefaultBuyers());
      }
    } else {
      setBuyers(getDefaultBuyers());
    }
  }, []);

  const saveBuyers = (newBuyers: BuyerAccount[]) => {
    setBuyers(newBuyers);
    localStorage.setItem(BUYERS_STORAGE_KEY, JSON.stringify(newBuyers));
  };

  const login = async (inputUsername: string, inputPassword: string): Promise<boolean> => {
    // 管理者ログイン（サーバーAPIで検証）
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputUsername, password: inputPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.isAdmin) {
          setUsername(inputUsername);
          setIsAuthenticated(true);
          setIsAdmin(true);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: inputUsername, isAdmin: true }));
          return true;
        }
      }
    } catch {
      // サーバー未起動時は購入者ログインにフォールバック
      console.warn("Admin auth API unavailable, trying buyer login only");
    }

    // 購入者ログイン（LocalStorageから最新の購入者リストを取得）
    const storedBuyers = localStorage.getItem(BUYERS_STORAGE_KEY);
    const currentBuyers: BuyerAccount[] = storedBuyers ? JSON.parse(storedBuyers) : buyers;

    const buyer = currentBuyers.find(
      b => b.username === inputUsername && b.password === inputPassword && b.isActive
    );

    if (buyer) {
      setUsername(inputUsername);
      setIsAuthenticated(true);
      setIsAdmin(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: inputUsername, isAdmin: false }));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUsername(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  // 購入者追加
  const addBuyer = (username: string, password: string, note: string): boolean => {
    // 重複チェック
    if (buyers.some(b => b.username === username)) return false;

    const newBuyer: BuyerAccount = {
      id: generateId(),
      username,
      password,
      note,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    saveBuyers([...buyers, newBuyer]);
    return true;
  };

  // 購入者削除
  const removeBuyer = (id: string) => {
    saveBuyers(buyers.filter(b => b.id !== id));
  };

  // 購入者更新
  const updateBuyer = (id: string, updates: Partial<BuyerAccount>) => {
    saveBuyers(buyers.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  // 購入者の有効/無効切替
  const toggleBuyerActive = (id: string) => {
    saveBuyers(buyers.map(b => (b.id === id ? { ...b, isActive: !b.isActive } : b)));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        username,
        login,
        logout,
        buyers,
        addBuyer,
        removeBuyer,
        updateBuyer,
        toggleBuyerActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
