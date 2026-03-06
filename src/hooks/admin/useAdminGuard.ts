import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/types/admin";

export function useAdminGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/", { replace: true });
      return;
    }

    setIsAdmin(true);
    setChecking(false);
  }, [user, loading, navigate]);

  return { isAdmin, checking: checking || loading };
}
