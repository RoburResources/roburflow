import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Dashboard from "@/pages/Dashboard";
import DriverJobs from "@/pages/DriverJobs";

// Role-aware landing: admins see the dashboard, drivers see their job list.
export default function Home() {
  const { isAdmin } = useCurrentUser();
  return isAdmin ? <Dashboard /> : <DriverJobs />;
}