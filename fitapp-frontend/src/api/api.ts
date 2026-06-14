import axios from "axios";

const TOKEN_KEY = "auth_token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface AuthRequest {
    email: string;
    password: string;
}

export interface UserResponse {
    id: string;
    email: string;
    username: string;
    lastName: string;
    firstName: string;
    BirthDate: string;
}

export interface AuthResponse {
    token: string;
    user: UserResponse;
}

export interface SignUpRequest {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    BirthDate: string;
    password: string;
    confirmPassword: string;

}

export interface SignUpResponse {
    id: string;
    email: string;
    username: string;
    BirthDate: string;
    message?: string;
}

export interface RestrictionDTO {
    restrictionType?: string;
    description: string;
}

export interface UserProfileDTO {
    age?: number;
    weight?: number;
    heightCm?: number;
    sex?: string | null;

    experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    primaryGoal: "LOSE_WEIGHT" | "GAIN_MASS" | "STRENGTH";

    maxWorkoutMinutes?: number;
    equipment: "GYM" | "HOME";

    availableDays: string[];
    restrictions: RestrictionDTO[];
}

export interface PlanExerciseDTO {
    id: number;
    exerciseId?: number;
    orderIndex: number;
    name: string;
    exerciseType?: string | null;
    sets?: number | null;
    reps?: number | null;
    restSeconds?: number | null;
    recommendedWeightKg?: number | null;
    rpeTarget?: string | null;
    notes?: string | null;
}

export interface PlanDayDTO {
    id: number;
    dayIndex: number;
    dayOfWeek: string;
    exercises: PlanExerciseDTO[];
}

export interface PlanResponse {
    id: number;
    goal: string;
    level: string;
    active: boolean;
    creationDate: string;
    days: PlanDayDTO[];
}

    export interface WorkoutExerciseLogRequestDTO {
        exerciseId: number;
        plannedSets?: number | null;
        plannedReps?: number | null;
        completedSets?: number | null;
        completedReps?: number | null;
        weightKg?: number | null;
        restSeconds?: number | null;
        notes?: string | null;
    }

    export interface WorkoutHistoryCreateRequestDTO {
        planId?: number | null;
        planDayId?: number | null;
        completedAt?: string | null;
        durationMinutes?: number | null;
        perceivedEffort?: number | null;
        notes?: string | null;
        exercises: WorkoutExerciseLogRequestDTO[];
    }

    export interface WorkoutExerciseLogResponseDTO {
        id: number;
        exerciseId: number;
        exerciseName: string;
        plannedSets?: number | null;
        plannedReps?: number | null;
        completedSets?: number | null;
        completedReps?: number | null;
        weightKg?: number | null;
        restSeconds?: number | null;
        notes?: string | null;
    }

    export interface WorkoutHistoryResponseDTO {
        id: number;
        planId?: number | null;
        planDayId?: number | null;
        completedAt: string;
        durationMinutes?: number | null;
        perceivedEffort?: number | null;
        notes?: string | null;
        exercises: WorkoutExerciseLogResponseDTO[];
    }

    export type WorkoutProgressMetricDTO =
        | "WEIGHT"
        | "REPS"
        | "VOLUME"
        | "ESTIMATED_1RM";

    export interface WorkoutProgressPointDTO {
        completedAt: string;
        value: number;
        weightKg?: number | null;
        completedReps?: number | null;
        completedSets?: number | null;
    }

    export interface WorkoutProgressSummaryDTO {
        initialValue?: number | null;
        finalValue?: number | null;
        deltaValue?: number | null;
        deltaPercent?: number | null;
        personalRecord?: number | null;
        sessionsCount: number;
    }

    export interface WorkoutProgressResponseDTO {
        exerciseId: number;
        exerciseName: string;
        metricType: WorkoutProgressMetricDTO;
        startDate: string;
        endDate: string;
        points: WorkoutProgressPointDTO[];
        summary: WorkoutProgressSummaryDTO;
    }

export const login = async (request: AuthRequest): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", request);
    return data;
};

export const register = async (
    request: SignUpRequest
): Promise<SignUpResponse> => {
    const { data } = await api.post<SignUpResponse>("/auth/register", request);
    return data;
};

export const forgotPassword = async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    await api.post("/auth/reset-password", { token, newPassword });
};

export const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
};

export const getProfile = async (): Promise<UserProfileDTO> => {
    const { data } = await api.get<UserProfileDTO>("/api/profile");
    return data;
};

export const updateProfile = async (
    profile: UserProfileDTO
): Promise<void> => {
    await api.put("/api/profile", profile);
};

export const generatePlan = async (): Promise<PlanResponse> => {
    const { data } = await api.post<PlanResponse>("/api/plans/generate");
    return data;
};

export const getActivePlan = async (): Promise<PlanResponse> => {
    const { data } = await api.get<PlanResponse>("/api/plans/active");
    return data;
};

export const listPlans = async (): Promise<PlanResponse[]> => {
    const { data } = await api.get<PlanResponse[]>("/api/plans");
    return data;
};

    export const createWorkoutHistory = async (
        request: WorkoutHistoryCreateRequestDTO
    ): Promise<WorkoutHistoryResponseDTO> => {
        const { data } = await api.post<WorkoutHistoryResponseDTO>("/api/workout-history", request);
        return data;
    };

    export const listWorkoutHistory = async (): Promise<WorkoutHistoryResponseDTO[]> => {
        const { data } = await api.get<WorkoutHistoryResponseDTO[]>("/api/workout-history");
        return data;
    };

    export const getWorkoutProgress = async (
        exerciseId: number,
        startDate: string,
        endDate: string,
        metricType: WorkoutProgressMetricDTO
    ): Promise<WorkoutProgressResponseDTO> => {
        const { data } = await api.get<WorkoutProgressResponseDTO>("/api/workout-history/progress", {
            params: {
                exerciseId,
                startDate,
                endDate,
                metricType,
            },
        });
        return data;
    };
