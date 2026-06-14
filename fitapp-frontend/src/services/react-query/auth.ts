import { useMutation } from "@tanstack/react-query";
import {login, register, type SignUpRequest, type SignUpResponse} from "@/api/api";
import type { AuthRequest, AuthResponse } from "@/api/api";
import { useAuthStore} from "@/services/stores/useAuthStore";

export const useLogin = () => {
    return useMutation<AuthResponse, Error, AuthRequest>({
        mutationFn: login,
        onSuccess: (data) => {
            const auth = useAuthStore.getState();
            auth.setToken(data.token);
            auth.setUser(data.user);
        },
    });
};

export const useSignUp = () => {
    return useMutation<SignUpResponse, Error, SignUpRequest>({
        mutationFn: register,
    })
};

export const useLogout = () => {
    return useMutation<void, Error, void>({
        mutationFn: async ()=> { return; },
        onSuccess: () => {
            useAuthStore.getState().logout();
        }
    });
};
