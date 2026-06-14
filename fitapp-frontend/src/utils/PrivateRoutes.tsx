import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid } from "./TokenValidator";
import { useAuthStore } from "@/services/stores/useAuthStore";

const PrivateRoutes = ({defaultRoute}: {defaultRoute: string}) => {
    const token = useAuthStore.getState().token;

    return isTokenValid(token) ? <Outlet /> : <Navigate to={defaultRoute} replace />;
};

export default PrivateRoutes;