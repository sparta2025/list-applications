import { useState, useCallback } from "react";
import LoginForm from "./components/LoginForm";
import RequestForm from "./components/RequestForm";
import RequestList from "./components/RequestList";
import { checkAuth, setAuthHeader, clearAuthHeader, createRequest } from "./api/client";
import type { RequestCreate } from "./types";
import styles from "./App.module.css";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setAuthError("");
    try {
      const ok = await checkAuth(username, password);
      if (ok) {
        setAuthHeader(username, password);
        setIsAdmin(true);
        setShowLogin(false);
        setAuthError("");
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.detail || "Неверные учётные данные");
    }
  };

  const handleLogout = () => {
    clearAuthHeader();
    setIsAdmin(false);
  };

  const handleCreate = async (data: RequestCreate) => {
    await createRequest(data);
    refresh();
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Заявки</h1>
        <div className={styles.headerRight}>
          <span className={styles.adminBadge}>
            {isAdmin ? "Администратор" : "Пользователь"}
          </span>
          {isAdmin ? (
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Выйти
            </button>
          ) : (
            <button className={styles.loginBtn} onClick={() => setShowLogin(true)}>
              Войти как админ
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.sidebar}>
          <RequestForm onSubmit={handleCreate} />
        </section>
        <section className={styles.content}>
          <RequestList isAdmin={isAdmin} refreshKey={refreshKey} onRefresh={refresh} />
        </section>
      </main>

      {showLogin && (
        <LoginForm onLogin={handleLogin} error={authError} />
      )}
    </div>
  );
}
