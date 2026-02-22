import { useQuery } from "@tanstack/react-query";
import { supervisorApi } from "@/lib/api/supervisor";

export function useSupervisorDashboard() {
  return useQuery({
    queryKey: ["supervisor-dashboard"],
    queryFn: () => supervisorApi.getDashboard(),
  });
}
