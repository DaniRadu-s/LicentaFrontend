import { useMutation } from "@tanstack/react-query";
import {
    createWorkoutHistory,
    getWorkoutProgress,
    listWorkoutHistory,
    type WorkoutHistoryCreateRequestDTO,
    type WorkoutProgressMetricDTO,
    type WorkoutProgressResponseDTO,
    type WorkoutHistoryResponseDTO,
} from "@/api/api";
import { useWorkoutHistoryStore } from "@/services/stores/useWorkoutHistoryStore";

export const useLoadWorkoutHistory = () => {
    return useMutation<WorkoutHistoryResponseDTO[], Error>({
        mutationFn: listWorkoutHistory,
        onSuccess: (data) => {
            useWorkoutHistoryStore.getState().setHistory(data);
        },
    });
};

export const useCreateWorkoutHistory = () => {
    return useMutation<WorkoutHistoryResponseDTO, Error, WorkoutHistoryCreateRequestDTO>({
        mutationFn: createWorkoutHistory,
        onSuccess: async (created) => {
            const store = useWorkoutHistoryStore.getState();
            store.prependHistory(created);

            try {
                const all = await listWorkoutHistory();
                store.setHistory(all);
            } catch {
                // ignore list refresh errors
            }
        },
    });
};

type WorkoutProgressRequest = {
    exerciseId: number;
    startDate: string;
    endDate: string;
    metricType: WorkoutProgressMetricDTO;
};

export const useLoadWorkoutProgress = () => {
    return useMutation<WorkoutProgressResponseDTO, Error, WorkoutProgressRequest>({
        mutationFn: ({ exerciseId, startDate, endDate, metricType }) =>
            getWorkoutProgress(exerciseId, startDate, endDate, metricType),
    });
};
