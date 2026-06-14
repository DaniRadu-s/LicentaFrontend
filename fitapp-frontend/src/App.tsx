import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/public/LoginPage";
import AuthRoutes from "@/utils/AuthRoutes.tsx";
import PrivateRoutes from "@/utils/PrivateRoutes.tsx";
import HomePage from "@/pages/private/HomePage.tsx";
import {ThemeProvider} from "@/components/theme-provider.tsx";
import SignUpPage from "@/pages/public/SignUpPage.tsx";
import ProfilePage from "@/pages/private/ProfilePage.tsx";
import ForgotPasswordPage from "@/pages/public/ForgotPasswordPage.tsx";
import ResetPasswordPage from "@/pages/public/ResetPasswordPage.tsx";
import WorkoutHistoryPage from "@/pages/private/WorkoutHistoryPage.tsx";
import PlansPage from "@/pages/private/PlansPage.tsx";
import StartWorkoutPage from "@/pages/private/StartWorkoutPage.tsx";
import ProgressPage from "@/pages/private/ProgressPage.tsx";

export default function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route element={<AuthRoutes defaultRoute="/home" />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                    </Route>
                    <Route element={<PrivateRoutes defaultRoute="/login" />}>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/plans" element={<PlansPage />} />
                        <Route path="/start-workout" element={<StartWorkoutPage />} />
                        <Route path="/workout-history" element={<WorkoutHistoryPage />} />
                        <Route path="/progress" element={<ProgressPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}
