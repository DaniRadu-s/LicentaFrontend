import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { forgotPassword } from "@/api/api";
import { useNavigate } from "react-router-dom";

const schema = z.object({
    email: z.string().email("Email invalid"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const form = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (v: Values) => {
        await toast.promise(
            forgotPassword(v.email),
            {
                loading: "Se trimite email-ul...",
                success: "Dacă email-ul există, ai primit un link de reset.",
                error: (err: unknown) => {
                    if (axios.isAxiosError(err)) return err.response?.data?.message || "Eroare";
                    return "Eroare";
                },
            }
        );
        // optional: navigate("/login");
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]">
            <Card className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white">Reset password</CardTitle>
                    <CardDescription className="text-zinc-300/70">
                        Introdu email-ul și îți trimitem un link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Controller
                            name="email"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-200">Email</label>
                                    <Input {...field} type="email" placeholder="john@email.com"
                                           className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                    focus-visible:ring-2 focus-visible:ring-violet-500/70" />
                                    {fieldState.error && <p className="text-sm text-red-400">{fieldState.error.message}</p>}
                                </div>
                            )}
                        />
                        <Button type="submit" className="w-full text-black font-medium
              bg-gradient-to-r from-violet-600 to-emerald-500 hover:from-violet-500 hover:to-emerald-400">
                            Trimite link
                        </Button>

                        <Button type="button" variant="link" className="w-full text-zinc-400"
                                onClick={() => navigate("/login")}>
                            Înapoi la login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
