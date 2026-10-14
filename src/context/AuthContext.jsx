import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { api, friendlyErrorMessage } from "../services/api";

export const AuthContext = createContext(null);

function validAccount(value) {
  return typeof value?.id === "string" && typeof value?.username === "string";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const authenticating = useRef(false);

  const refresh = useCallback(async () => {
    if (authenticating.current) return null;
    const current = ++sequence.current;
    setError("");
    try {
      const me = await api.get("/auth/me");
      if (current !== sequence.current) return null;
      if (!validAccount(me)) throw { code: "INVALID_RESPONSE" };
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch (failure) {
      if (current !== sequence.current) return null;
      if (failure?.status === 401) {
        setUser(null);
        setStatus("guest");
      } else {
        setError(friendlyErrorMessage(failure));
        setStatus((value) => (value === "authenticated" ? value : "error"));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      sequence.current++;
    };
  }, [refresh]);

  useEffect(() => {
    const invalidate = () => {
      if (authenticating.current) return;
      sequence.current++;
      setUser(null);
      setStatus("guest");
      setError("");
    };
    window.addEventListener("deadsmile:auth-invalidated", invalidate);
    return () => window.removeEventListener("deadsmile:auth-invalidated", invalidate);
  }, []);

  const authenticate = useCallback(async (path, payload) => {
    if (authenticating.current) throw { code: "SERVICE_UNAVAILABLE" };
    const current = ++sequence.current;
    authenticating.current = true;
    setError("");
    try {
      const result = await api.post(path, payload);
      if (current !== sequence.current) throw { code: "INVALID_RESPONSE" };
      if (result?.requiresTwoFactor === true) {
        setUser(null);
        setStatus("twoFactor");
      } else if (result?.verificationRequired === true) {
        setUser(null);
        setStatus("guest");
      } else {
        if (!validAccount(result)) throw { code: "INVALID_RESPONSE" };
        setUser(result);
        setStatus("authenticated");
      }
      return result;
    } catch (failure) {
      if (current === sequence.current) {
        setUser(null);
        setStatus(
          path === "/auth/verify-2fa" && failure?.code !== "TWO_FACTOR_CHALLENGE_EXPIRED"
            ? "twoFactor"
            : "guest",
        );
      }
      throw failure;
    } finally {
      if (current === sequence.current) authenticating.current = false;
    }
  }, []);

  const login = useCallback(
    (email, password, recaptchaToken) =>
      authenticate("/auth/login", { email, password, recaptchaToken }),
    [authenticate],
  );

  const verifyTwoFactor = useCallback(
    (token) => authenticate("/auth/verify-2fa", { token }),
    [authenticate],
  );

  const register = useCallback(
    (payload) => authenticate("/auth/register", payload),
    [authenticate],
  );

  const logout = useCallback(async () => {
    if (authenticating.current) return;
    const current = ++sequence.current;
    if (status === "authenticated") {
      try {
        await api.post("/auth/logout");
      } catch (failure) {
        if (failure?.code !== "UNAUTHENTICATED") throw failure;
      }
    }
    if (current !== sequence.current) return;
    setUser(null);
    setStatus("guest");
    setError("");
  }, [status]);

  return (
    <AuthContext.Provider
      value={{ user, status, error, login, verifyTwoFactor, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
