import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    logout().finally(() => {
      if (alive) navigate("/login", { replace: true });
    });
    return () => {
      alive = false;
    };
  }, [logout, navigate]);

  return null;
}
