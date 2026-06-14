import { useMutation } from "@tanstack/react-query";
import { generatePlan, getActivePlan, listPlans, type PlanResponse } from "@/api/api";
import { usePlanStore } from "@/services/stores/usePlanStore";

/**
 * LOAD ACTIVE PLAN (mutation style)
 * - îl chemi în useEffect
 * - pune planul în store
 */
export const useLoadActivePlan = () => {
    return useMutation<PlanResponse, Error>({
        mutationFn: getActivePlan,
        onSuccess: (data) => {
            usePlanStore.getState().setActivePlan(data);
        },
    });
};

/**
 * LOAD PLAN LIST (mutation style)
 * - pune lista în store
 */
export const useLoadPlans = () => {
    return useMutation<PlanResponse[], Error>({
        mutationFn: listPlans,
        onSuccess: (data) => {
            usePlanStore.getState().setPlans(data);
        },
    });
};

/**
 * GENERATE PLAN
 * - generează plan nou pe backend
 * - setează activePlan și reîncarcă lista (optional)
 */
export const useGeneratePlan = () => {
    return useMutation<PlanResponse, Error>({
        mutationFn: generatePlan,
        onSuccess: async (data) => {
            const store = usePlanStore.getState();
            store.setActivePlan(data);

            // opțional: reîncarcă lista ca să apară și în "history"
            try {
                const all = await listPlans();
                store.setPlans(all);
            } catch {
                // ignore list refresh errors
            }
        },
    });
};
