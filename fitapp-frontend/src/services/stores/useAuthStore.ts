import type { UserResponse } from '@/api/api';
import { create } from 'zustand';

const LEGACY_PROFILE_IMAGE_KEY = 'auth_profile_image';

const profileImageKeyForUser = (user?: UserResponse) =>
    user?.id ? `auth_profile_image_${user.id}` : LEGACY_PROFILE_IMAGE_KEY;

interface AuthState {
    user: UserResponse | undefined;
    token: string | undefined;
    profileImage: string | undefined;

    setToken: (t: string) => void;
    setUser: (u: UserResponse) => void;
    setProfileImage: (image: string | undefined) => void;
    logout: () => void;
    getStoredUser: () => UserResponse | undefined;
}

export const useAuthStore = create<AuthState>((set,get) => {
    const localToken: string | undefined= localStorage.getItem('auth_token') || undefined;
    let userLogged: UserResponse | undefined = undefined;

    try {
        const raw = localStorage.getItem('auth_user');
        if (raw) userLogged = JSON.parse(raw);
    } catch {
        userLogged = undefined;
    }

    const localProfileImage: string | undefined =
        localStorage.getItem(profileImageKeyForUser(userLogged)) ||
        localStorage.getItem(LEGACY_PROFILE_IMAGE_KEY) ||
        undefined;

    return {
        user: userLogged,
        token: localToken,
        profileImage: localProfileImage,

        setToken: (t) => {
            localStorage.setItem('auth_token', t);
            set({ token: t });
        },

        setUser: (u) => {
            localStorage.setItem('auth_user', JSON.stringify(u));
            const storedImage =
                localStorage.getItem(profileImageKeyForUser(u)) ||
                localStorage.getItem(LEGACY_PROFILE_IMAGE_KEY) ||
                undefined;
            set({ user: u, profileImage: storedImage });
        },

        setProfileImage: (image) => {
            const state = get();
            const imageKey = profileImageKeyForUser(state.user);

            if (image) {
                localStorage.setItem(imageKey, image);
            } else {
                localStorage.removeItem(imageKey);
            }
            set({ profileImage: image });
        },

        getStoredUser : () => {
            const state = get();

            if (state.user) return state.user;

            try {
                const raw = localStorage.getItem('auth_user');
                if (raw) {
                    const user = JSON.parse(raw);
                    state.setUser(user);
                    return user;
                }
            } catch {
                return undefined;
            }

            return null;
        }

        ,logout: () => {
            set({ user: undefined, token: undefined, profileImage: undefined });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        },
    }});

