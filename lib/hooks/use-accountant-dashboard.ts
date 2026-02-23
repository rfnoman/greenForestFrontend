import { useQuery } from "@tanstack/react-query";
import { accountantApi } from "@/lib/api/accountant";

export function useAccountantDashboard() {
  return useQuery({
    queryKey: ["accountant-dashboard"],
    queryFn: accountantApi.getDashboard,
  });
}
