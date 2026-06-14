import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import logo from "@/assets/logo-new.svg";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/services/react-query/auth";
import { toast } from "sonner";
import axios from "axios";

const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { mutateAsync: loginAsync, isPending } = useLogin();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleSubmit = async (values: LoginFormValues) => {
        await toast.promise(loginAsync(values), {
            loading: "Logging in...",
            success: () => {
                setTimeout(() => navigate("/home"), 300);
                return "Logged in successfully!";
            },
            error: (err: unknown) => {
                if (axios.isAxiosError(err)) {
                    const status = err.response?.status;
                    if (status === 401) return "Invalid credentials";
                    if (status === 400) return "Bad request";
                    return err.response?.data?.message || "Login failed";
                }
                return "Login failed";
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            <Card className="w-full max-w-5xl overflow-hidden
        border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardContent className="grid md:grid-cols-2 p-0">

                    {/* LEFT (FORM) */}
                    <div className="p-10">
                        <CardHeader className="p-0 mb-8">
                            <CardTitle className="text-2xl text-white">
                                Welcome back
                            </CardTitle>
                            <CardDescription className="text-zinc-300/70">
                                Log in to your SmartFit account
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                            {/* EMAIL */}
                            <Controller
                                name="email"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-200">
                                            Email
                                        </label>
                                        <Input
                                            {...field}
                                            placeholder="john@example.com"
                                            className="
                        bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                        focus-visible:ring-2 focus-visible:ring-violet-500/70
                      "
                                        />
                                        {fieldState.error && (
                                            <p className="text-sm text-red-400">
                                                {fieldState.error.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            {/* PASSWORD */}
                            <Controller
                                name="password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-200">
                                            Password
                                        </label>
                                        <Input
                                            {...field}
                                            type="password"
                                            placeholder="••••••••"
                                            className="
                        bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                        focus-visible:ring-2 focus-visible:ring-emerald-400/70
                      "
                                        />
                                        {fieldState.error && (
                                            <p className="text-sm text-red-400">
                                                {fieldState.error.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            {/* SUBMIT */}
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="
                  w-full mt-4 text-black font-medium
                  bg-gradient-to-r from-violet-600 to-emerald-500
                  hover:from-violet-500 hover:to-emerald-400
                  transition-all
                "
                            >
                                {isPending ? "Logging in..." : "Log In"}
                            </Button>

                            {/* LINKS */}
                            <div className="flex flex-col items-center gap-3 mt-6 text-sm">
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-zinc-400 hover:text-violet-300"
                                    onClick={() => navigate("/forgot-password")}
                                >
                                    Forgot password?
                                </Button>

                                <div className="flex gap-1 text-zinc-400">
                                    <span>Don't have an account?</span>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="p-0 h-auto text-emerald-300 hover:text-emerald-200"
                                        onClick={() => navigate("/signup")}
                                    >
                                        Sign up
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT (BRAND) */}
                    <div className="hidden md:flex flex-col items-center justify-center relative
            bg-gradient-to-br from-violet-700/20 via-transparent to-emerald-600/20
            border-l border-white/10 p-10">

                        {/* subtle glow */}
                        <div className="absolute inset-0
              bg-[radial-gradient(600px_circle_at_30%_20%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(600px_circle_at_70%_80%,rgba(16,185,129,0.16),transparent_55%)]
              blur-2xl"
                        />

                        <img src={logo} alt="FitApp Logo" className="w-24 h-24 mb-6 opacity-90 relative z-10" />
                        <h2 className="text-xl font-semibold text-white relative z-10">
                            SmartFit
                        </h2>
                        <p className="text-zinc-300/70 text-center mt-2 max-w-xs relative z-10">
                            Track workouts. Monitor progress. Stay consistent.
                        </p>

                        {/* accent line */}
                        <div className="mt-8 h-px w-32 bg-gradient-to-r from-violet-500/60 to-emerald-400/60 relative z-10" />
                        <p className="mt-3 text-xs text-zinc-400 relative z-10">
                            Violet focus • Green progress
                        </p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
