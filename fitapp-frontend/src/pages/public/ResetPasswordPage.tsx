import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { resetPassword } from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
    password: z.string().min(6, "Minim 6 caractere"),
    confirm: z.string().min(1, "Confirmă parola"),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Parolele nu coincid" });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const navigate = useNavigate();

    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

    const onSubmit = async (v: Values) => {
        if (!token) {
            toast.error("Token lipsă din link.");
            return;
        }

        await toast.promise(
            resetPassword(token, v.password),
            {
                loading: "Se resetează parola...",
                success: () => {
                    navigate("/login");
                    return "Parola a fost resetată. Te poți loga.";
                },
                error: (err: unknown) => {
                    if (axios.isAxiosError(err)) return err.response?.data?.message || "Eroare";
                    return "Eroare";
                },
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]">
            <Card className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white">Setează o parolă nouă</CardTitle>
                    <CardDescription className="text-zinc-300/70">
                        Introdu parola nouă.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Controller name="password" control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div className="space-y-2">
                                            <label className="text-sm text-zinc-200">Parola nouă</label>
                                            <Input {...field} type="password"
                                                   className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                    focus-visible:ring-2 focus-visible:ring-emerald-400/70" />
                                            {fieldState.error && <p className="text-sm text-red-400">{fieldState.error.message}</p>}
                                        </div>
                                    )}
                        />

                        <Controller name="confirm" control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div className="space-y-2">
                                            <label className="text-sm text-zinc-200">Confirmă parola</label>
                                            <Input {...field} type="password"
                                                   className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                    focus-visible:ring-2 focus-visible:ring-emerald-400/70" />
                                            {fieldState.error && <p className="text-sm text-red-400">{fieldState.error.message}</p>}
                                        </div>
                                    )}
                        />

                        <Button type="submit" className="w-full text-black font-medium
              bg-gradient-to-r from-violet-600 to-emerald-500 hover:from-violet-500 hover:to-emerald-400">
                            Resetează parola
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
