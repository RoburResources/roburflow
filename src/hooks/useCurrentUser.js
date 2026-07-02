import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Loads the current authenticated user once.
export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    base44.auth
      .me()
      .then((u) => { if (mounted) setUser(u); })
      .catch(() => { if (mounted) setUser(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const isAdmin = user?.role === "admin";
  return { user, loading, isAdmin };
}