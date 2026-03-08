import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface BuyerAccount {
  id: string;
  username: string;
  password: string;
  note: string;
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
  buyersLoading: boolean;
  fetchBuyers: () => Promise<void>;
  addBuyer: (
    username: string,
    password: string,
    note: string
  ) => Promise<boolean>;
  removeBuyer: (id: string) => Promise<void>;
  updateBuyer: (id: string, updates: Partial<BuyerAccount>) => Promise<void>;
  toggleBuyerActive: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "fx-doctor-auth";
const CREDENTIALS_KEY = "fx-doctor-admin-creds";

function getAuthHeaders(): HeadersInit {
  const creds = sessionStorage.getItem(CREDENTIALS_KEY);
  if (!creds) return {};
  return { Authorization: `Basic ${btoa(creds)}` };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [buyers, setBuyers] = useState<BuyerAccount[]>([]);
  const [buyersLoading, setBuyersLoading] = useState(false);

  // ページロード時にLocalStorageから認証状態を復元
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth) {
      try {
        const { username: storedUsername, isAdmin: storedIsAdmin } =
          JSON.parse(storedAuth);
        setUsername(storedUsername);
        setIsAuthenticated(true);
        setIsAdmin(!!storedIsAdmin);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // 管理者がログインしたら購入者リストを取得
  const fetchBuyers = useCallback(async () => {
    setBuyersLoading(true);
    try {
      const res = await fetch("/api/buyers", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBuyers(data.buyers);
        }
      }
    } catch {
      console.warn("Failed to fetch buyers from API");
    } finally {
      setBuyersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && sessionStorage.getItem(CREDENTIALS_KEY)) {
      fetchBuyers();
    }
  }, [isAdmin, fetchBuyers]);

  const login = async (
    inputUsername: string,
    inputPassword: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: inputUsername,
          password: inputPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsername(inputUsername);
          setIsAuthenticated(true);
          setIsAdmin(!!data.isAdmin);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              username: inputUsername,
              isAdmin: !!data.isAdmin,
            })
          );

          // 管理者の場合、認証情報をセッションに保存（API呼び出し用）
          if (data.isAdmin) {
            sessionStorage.setItem(
              CREDENTIALS_KEY,
              `${inputUsername}:${inputPassword}`
            );
          }

          return true;
        }
      }
    } catch {
      console.warn("Auth API unavailable");
    }

    return false;
  };

  const logout = () => {
    setUsername(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setBuyers([]);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CREDENTIALS_KEY);
  };

  // 購入者追加
  const addBuyer = async (
    username: string,
    password: string,
    note: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ username, password, note }),
      });
      const data = await res.json();
      if (data.success) {
        setBuyers(prev => [...prev, data.buyer]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // 購入者削除
  const removeBuyer = async (id: string) => {
    try {
      const res = await fetch(`/api/buyers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setBuyers(prev => prev.filter(b => b.id !== id));
      }
    } catch {
      console.error("Failed to remove buyer");
    }
  };

  // 購入者更新
  const updateBuyer = async (id: string, updates: Partial<BuyerAccount>) => {
    try {
      const res = await fetch("/api/buyers", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setBuyers(prev => prev.map(b => (b.id === id ? data.buyer : b)));
      }
    } catch {
      console.error("Failed to update buyer");
    }
  };

  // 購入者の有効/無効切替
  const toggleBuyerActive = async (id: string) => {
    const buyer = buyers.find(b => b.id === id);
    if (!buyer) return;
    await updateBuyer(id, { isActive: !buyer.isActive });
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
        buyersLoading,
        fetchBuyers,
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
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
