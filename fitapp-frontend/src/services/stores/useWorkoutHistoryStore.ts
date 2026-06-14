import { create } from "zustand";
import type { WorkoutHistoryResponseDTO } from "@/api/api";

type WorkoutHistoryState = {
    history: WorkoutHistoryResponseDTO[];
    hasLoaded: boolean;

    setHistory: (history: WorkoutHistoryResponseDTO[]) => void;
    prependHistory: (item: WorkoutHistoryResponseDTO) => void;
    resetHistory: () => void;
};

export const useWorkoutHistoryStore = create<WorkoutHistoryState>((set) => ({
    history: [],
    hasLoaded: false,

    setHistory: (history) =>
        set({
            history: history ?? [],
            hasLoaded: true,
        }),

    prependHistory: (item) =>
        set((state) => ({
            history: [item, ...state.history],
            hasLoaded: true,
        })),

    resetHistory: () =>
        set({
            history: [],
            hasLoaded: false,
        }),
}));
