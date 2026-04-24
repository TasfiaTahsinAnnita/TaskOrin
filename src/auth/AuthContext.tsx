import { createContext, useContext, useMemo, useState } from "react";

type StoredUser = {
  name: string;
  email: string;
  password: string;
};

type AuthUser = {
  name: string;
  email: string;
};

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (input: LoginInput) => { ok: boolean; error?: string };
  signup: (input: SignupInput) => { ok: boolean; error?: string };
  logout: () => void;
};

const USERS_KEY = "pm_users";
const SESSION_KEY = "pm_session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? (JSON.parse(raw) as StoredUser[]) : [];
}

function setStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): AuthUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredSession());

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login: ({ email, password }) => {
        const users = getStoredUsers();
        const match = users.find(
          (candidate) => candidate.email.toLowerCase() === email.toLowerCase().trim()
        );

        if (!match || match.password !== password) {
          return { ok: false, error: "Invalid email or password." };
        }

        const nextUser = { name: match.name, email: match.email };
        setUser(nextUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        return { ok: true };
      },
      signup: ({ name, email, password }) => {
        const users = getStoredUsers();
        const normalizedEmail = email.toLowerCase().trim();
        const exists = users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail);

        if (exists) {
          return { ok: false, error: "Account already exists with this email." };
        }

        const nextUsers = [...users, { name: name.trim(), email: normalizedEmail, password }];
        setStoredUsers(nextUsers);

        const nextUser = { name: name.trim(), email: normalizedEmail };
        setUser(nextUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
        return { ok: true };
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
