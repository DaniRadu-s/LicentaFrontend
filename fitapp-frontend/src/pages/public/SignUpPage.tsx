import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useSignUp } from "@/services/react-query/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-new.svg";
import chevronLeft from "@/assets/img.png";

const step1Schema = z
    .object({
        firstName: z.string().min(1, "First name must not be empty").max(60),
        lastName: z.string().min(1, "Last name must not be empty").max(60),
        email: z.string().email("Email is not valid"),
        BirthDate: z
            .string()
            .min(1, "Birth date is required")
            .refine((v) => {
                const d = new Date(v);
                if (Number.isNaN(d.getTime())) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return d < today;
            }, "Birth date must be before today"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords must match",
        path: ["confirmPassword"],
    });

const step2Schema = z.object({
    username: z.string().min(1, "Username must not be empty").max(60),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

type SignupPayload = {
    firstName: string;
    lastName: string;
    email: string;
    BirthDate: string;
    password: string;
    confirmPassword: string;
    username: string;
};

export default function Signup() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2>(1);
    const { mutateAsync: signupAsync, isPending } = useSignUp();

    const form1 = useForm<Step1Values>({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            BirthDate: "",
            password: "",
            confirmPassword: "",
        },
    });

    const form2 = useForm<Step2Values>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            username: "",
        },
    });

    const handleFirstStep = (_: Step1Values) => {
        setStep(2);
    };

    const handleSecondStep = async (_: Step2Values) => {
        const s1 = form1.getValues();
        const s2 = form2.getValues();

        const payload: SignupPayload = {
            firstName: s1.firstName,
            lastName: s1.lastName,
            email: s1.email,
            BirthDate: s1.BirthDate,
            password: s1.password,
            confirmPassword: s1.confirmPassword,
            username: s2.username,
        };

        await toast.promise(signupAsync(payload), {
            loading: "Creating account...",
            success: () => {
                navigate("/login");
                return "Account created successfully!";
            },
            error: (err: any) => err?.message || "Account could not be created",
        });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            <Card
                className="relative w-full max-w-5xl overflow-hidden
        border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
            >
                <CardContent className="grid md:grid-cols-2 p-0">
                    {/* LEFT */}
                    <div className="p-10 relative">
                        {step === 2 && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="absolute left-3 top-1/2 -translate-y-1/2
                  bg-transparent hover:bg-transparent shadow-none border-none
                  focus-visible:ring-0 focus-visible:ring-offset-0"
                            >
                                <img
                                    src={chevronLeft}
                                    alt=""
                                    className="h-5 w-5 object-contain"
                                    style={{ filter: "brightness(0) invert(1)" }}
                                />
                                <span className="sr-only">Back</span>
                            </Button>
                        )}

                        <CardHeader className="p-0 mb-8 text-center">
                            <CardTitle className="text-2xl text-white">
                                Create your SmartFit account
                            </CardTitle>
                            <CardDescription className="text-zinc-300/70">
                                Sign up to get started
                            </CardDescription>
                        </CardHeader>

                        {/* STEP 1 */}
                        {step === 1 && (
                            <form onSubmit={form1.handleSubmit(handleFirstStep)} className="space-y-6">
                                <FieldGroup>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="firstName"
                                            control={form1.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel className="text-zinc-200">First name</FieldLabel>
                                                    <Input
                                                        {...field}
                                                        placeholder="John"
                                                        className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                              focus-visible:ring-2 focus-visible:ring-violet-500/70"
                                                    />
                                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="lastName"
                                            control={form1.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel className="text-zinc-200">Last name</FieldLabel>
                                                    <Input
                                                        {...field}
                                                        placeholder="Doe"
                                                        className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                              focus-visible:ring-2 focus-visible:ring-violet-500/70"
                                                    />
                                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    <Controller
                                        name="email"
                                        control={form1.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel className="text-zinc-200">Email</FieldLabel>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="john@email.com"
                                                    className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                            focus-visible:ring-2 focus-visible:ring-violet-500/70"
                                                />
                                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="BirthDate"
                                        control={form1.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel className="text-zinc-200"> Birth Date </FieldLabel>
                                                <Input
                                                    {...field}
                                                    type="date"
                                                    className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                              focus-visible:ring-2 focus-visible:ring-violet-500/70"
                                                />
                                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                            </Field>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Controller
                                            name="password"
                                            control={form1.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel className="text-zinc-200">Password</FieldLabel>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                              focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                                                    />
                                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="confirmPassword"
                                            control={form1.control}
                                            render={({ field, fieldState }) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel className="text-zinc-200">Confirm password</FieldLabel>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                              focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                                                    />
                                                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-1/2 self-center text-black font-medium
                      bg-gradient-to-r from-violet-600 to-emerald-500
                      hover:from-violet-500 hover:to-emerald-400 transition-all"
                                    >
                                        Continue
                                    </Button>

                                    <div className="flex justify-center gap-1 text-sm mt-4">
                                        <span className="text-zinc-400">Already have an account?</span>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="text-emerald-300 hover:text-emerald-200 p-0 h-auto"
                                            onClick={() => navigate("/login")}
                                        >
                                            Log in
                                        </Button>
                                    </div>
                                </FieldGroup>
                            </form>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <form onSubmit={form2.handleSubmit(handleSecondStep)} className="space-y-6">
                                <FieldGroup>
                                    <Controller
                                        name="username"
                                        control={form2.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel className="text-zinc-200">Username</FieldLabel>
                                                <Input
                                                    {...field}
                                                    placeholder="john_doe"
                                                    className="bg-zinc-950/40 border-white/10 text-white placeholder:text-zinc-500
                            focus-visible:ring-2 focus-visible:ring-violet-500/70"
                                                />
                                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                                            </Field>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-1/2 self-center text-black font-medium
                      bg-gradient-to-r from-violet-600 to-emerald-500
                      hover:from-violet-500 hover:to-emerald-400 transition-all"
                                    >
                                        Sign Up
                                    </Button>

                                    <div className="flex justify-center gap-1 text-sm mt-4">
                                        <span className="text-zinc-400">Already have an account?</span>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="text-emerald-300 hover:text-emerald-200 p-0 h-auto"
                                            onClick={() => navigate("/login")}
                                        >
                                            Log in
                                        </Button>
                                    </div>
                                </FieldGroup>
                            </form>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div
                        className="hidden md:flex flex-col items-center justify-center relative
            bg-gradient-to-br from-violet-700/20 via-transparent to-emerald-600/20
            border-l border-white/10 p-10"
                    >
                        <div
                            className="absolute inset-0
              bg-[radial-gradient(600px_circle_at_30%_20%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(600px_circle_at_70%_80%,rgba(16,185,129,0.16),transparent_55%)]
              blur-2xl"
                        />

                        <img src={logo} alt="FitApp Logo" className="w-24 h-24 mb-6 opacity-90 relative z-10" />
                        <h2 className="text-xl font-semibold text-white relative z-10">SmartFit</h2>
                        <p className="text-zinc-300/70 text-center mt-2 max-w-xs relative z-10">
                            Track workouts. Monitor progress. Stay consistent.
                        </p>

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
