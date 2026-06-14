import { useMutation } from "@tanstack/react-query";
import {
    getProfile,
    updateProfile,
    type UserProfileDTO,
} from "@/api/api";
import { useProfileStore } from "@/services/stores/useProfileStore";


export const useLoadProfile = () => {
    return useMutation<UserProfileDTO, Error>({
        mutationFn: getProfile,
        onSuccess: (data) => {
            const profileStore = useProfileStore.getState();
            profileStore.setProfile(data);
        },
    });
};

export const useSaveProfile = () => {
    return useMutation<void, Error, UserProfileDTO>({
        mutationFn: updateProfile,
        onSuccess: async () => {

            const data = await getProfile();
            useProfileStore.getState().setProfile(data);
        },
    });
};
