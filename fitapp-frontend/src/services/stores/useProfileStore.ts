import { create } from "zustand";
import type { UserProfileDTO } from "@/api/api";

const defaultProfile: UserProfileDTO = {
    age: undefined,
    heightCm: undefined,
    sex: null,
    experienceLevel: "BEGINNER",
    primaryGoal: "STRENGTH",
    maxWorkoutMinutes: undefined,
    equipment: "GYM",
    availableDays: [],
    restrictions: [],
};

type ProfileState = {
    profile: UserProfileDTO;
    hasLoaded: boolean;

    setProfile: (p: UserProfileDTO) => void;
    resetProfile: () => void;

    // utile dacă vrei să editezi incremental din UI
    updateField: <K extends keyof UserProfileDTO>(key: K, value: UserProfileDTO[K]) => void;
    setAvailableDays: (days: string[]) => void;
    setRestrictions: (restrictions: UserProfileDTO["restrictions"]) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
    profile: defaultProfile,
    hasLoaded: false,

    setProfile: (p) =>
        set({
            profile: {
                ...defaultProfile,
                ...p,
                availableDays: p.availableDays ?? [],
                restrictions: p.restrictions ?? [],
                sex: p.sex ?? null,
            },
            hasLoaded: true,
        }),

    resetProfile: () => set({ profile: defaultProfile, hasLoaded: false }),

    updateField: (key, value) =>
        set((state) => ({
            profile: { ...state.profile, [key]: value },
        })),

    setAvailableDays: (days) =>
        set((state) => ({
            profile: { ...state.profile, availableDays: Array.from(new Set(days)) },
        })),

    setRestrictions: (restrictions) =>
        set((state) => ({
            profile: { ...state.profile, restrictions: restrictions ?? [] },
        })),
}));
