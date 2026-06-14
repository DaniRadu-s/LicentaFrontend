import { create } from "zustand";
import type { PlanResponse } from "@/api/api";

type PlanState = {
    activePlan: PlanResponse | null;
    plans: PlanResponse[];
    hasLoadedActive: boolean;
    hasLoadedList: boolean;

    setActivePlan: (p: PlanResponse | null) => void;
    setPlans: (p: PlanResponse[]) => void;

    resetPlans: () => void;
};

export const usePlanStore = create<PlanState>((set) => ({
    activePlan: null,
    plans: [],
    hasLoadedActive: false,
    hasLoadedList: false,

    setActivePlan: (p) =>
        set({
            activePlan: p,
            hasLoadedActive: true,
        }),

    setPlans: (p) =>
        set({
            plans: p ?? [],
            hasLoadedList: true,
        }),

    resetPlans: () =>
        set({
            activePlan: null,
            plans: [],
            hasLoadedActive: false,
            hasLoadedList: false,
        }),
}));
