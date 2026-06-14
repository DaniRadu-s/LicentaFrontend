import { jwtDecode } from "jwt-decode";

export function isTokenValid(token : any) {
    if (!token) return false;
    try {
        const decoded = jwtDecode(token);
        if(!decoded.exp) return false;

        // exp is in seconds, Date.now() is in ms
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false; // invalid token format
    }
}
