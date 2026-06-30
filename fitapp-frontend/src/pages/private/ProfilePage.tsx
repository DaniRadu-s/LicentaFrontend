import { useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "@/services/stores/useProfileStore";
import { useLoadProfile, useSaveProfile } from "@/services/react-query/profile.ts";
import type { RestrictionDTO, UserProfileDTO } from "@/api/api";
import { useAuthStore } from "@/services/stores/useAuthStore.ts";
import { toast } from "sonner";
import axios from "axios";

const DAYS: { key: string; label: string }[] = [
    { key: "MONDAY", label: "Luni" },
    { key: "TUESDAY", label: "Marți" },
    { key: "WEDNESDAY", label: "Miercuri" },
    { key: "THURSDAY", label: "Joi" },
    { key: "FRIDAY", label: "Vineri" },
    { key: "SATURDAY", label: "Sâmbătă" },
    { key: "SUNDAY", label: "Duminică" },
];

function toIntOrUndef(v: string): number | undefined {
    const t = v.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function toDoubleOrUndef(v: string): number | undefined {
    const t = v.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
}

function calculateAge(birthdate?: string): number | "" {
    if (!birthdate) return "";
    const bd = new Date(birthdate);
    if (Number.isNaN(bd.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const monthDiff = today.getMonth() - bd.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
}
export default function ProfilePage() {
    const navigate = useNavigate();

    const user = useAuthStore((u) => u.user);
    const profile = useProfileStore((s) => s.profile);
    const updateField = useProfileStore((s) => s.updateField);
    const setAvailableDays = useProfileStore((s) => s.setAvailableDays);
    const setRestrictions = useProfileStore((s) => s.setRestrictions);

    const loadProfile = useLoadProfile();
    const saveProfile = useSaveProfile();

    useEffect(() => {
        loadProfile.mutate();
    }, []);

    const selectedDays = new Set(profile.availableDays ?? []);

    const toggleDay = (dayKey: string) => {
        const next = new Set(profile.availableDays ?? []);
        if (next.has(dayKey)) next.delete(dayKey);
        else next.add(dayKey);
        setAvailableDays(Array.from(next));
    };

    const addRestriction = () => {
        const next = [...(profile.restrictions ?? [])];
        next.push({ restrictionType: "", description: "" });
        setRestrictions(next);
    };

    const removeRestriction = (index: number) => {
        const next = [...(profile.restrictions ?? [])];
        next.splice(index, 1);
        setRestrictions(next);
    };

    const updateRestriction = (index: number, field: keyof RestrictionDTO, value: string) => {
        const next = [...(profile.restrictions ?? [])];
        const current = next[index] ?? { restrictionType: "", description: "" };
        next[index] = { ...current, [field]: value };
        setRestrictions(next);
    };

    const validate = (): string | null => {
        if (!profile.experienceLevel) return "Selectează nivelul de experiență.";
        if (!profile.primaryGoal) return "Selectează obiectivul.";
        if (!profile.equipment) return "Selectează echipamentul.";

        for (const r of profile.restrictions ?? []) {
            const t = (r.restrictionType ?? "").trim();
            const d = (r.description ?? "").trim();
            if ((t && !d) || (!t && d)) {
                return "La restricții, completează și tipul și descrierea (sau șterge rândul).";
            }
        }
        return null;
    };

    const onSave = async () => {
        const err = validate();

        if (err) {
            toast.error(err);
            return;
        }

        const payload: UserProfileDTO = {
            ...profile,
            sex: profile.sex && profile.sex.trim() ? profile.sex : null,
            availableDays: profile.availableDays ?? [],
            restrictions: (profile.restrictions ?? []).map((r) => ({
                restrictionType: (r.restrictionType ?? "").trim() || undefined,
                description: (r.description ?? "").trim(),
            })),
        };

        await toast.promise(saveProfile.mutateAsync(payload), {
            loading: "Se salvează profilul...",
            success: "Profilul a fost salvat cu succes!",
            error: (err: unknown) => {
                if (axios.isAxiosError(err)) {
                    return err.response?.data?.message || "A apărut o eroare la salvarea profilului.";
                }

                return "A apărut o eroare la salvarea profilului.";
            },
        });
    };

    return (
        <div
            className="min-h-screen relative px-4 py-10
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            {/* Top left actions */}
            <div className="absolute top-6 left-6 flex gap-3">
                <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800
                     text-white font-medium transition border border-white/10"
                >
                    Home
                </button>
            </div>

            {/* Card */}
            <div className="max-w-3xl mx-auto">
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Profil</h1>
                            <p className="text-white/60 mt-1">
                                Completează profilul și preferințele pentru planuri mai bune.
                            </p>
                        </div>
                    </div>

                    {/* Loading / error states */}
                    {loadProfile.isPending && (
                        <div className="mt-6 text-white/70">Se încarcă profilul...</div>
                    )}

                    {loadProfile.isError && (
                        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                            Eroare la încărcare profil.
                        </div>
                    )}

                    {/* Form */}
                    {!loadProfile.isPending && (
                        <div className="mt-6 space-y-8">
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-3">Date personale</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm text-white/70">Vârstă</label>
                                        <input
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            type="number"
                                            value={calculateAge(user?.BirthDate)}
                                            disabled
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-white/70">Greutate (kg)</label>
                                        <input
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            type="number"
                                            value={profile.weight ?? ""}
                                            onChange={(e) => updateField("weight", toDoubleOrUndef(e.target.value))}
                                            placeholder="ex: 75.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-white/70">Înălțime (cm)</label>
                                        <input
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            type="number"
                                            value={profile.heightCm ?? ""}
                                            onChange={(e) => updateField("heightCm", toIntOrUndef(e.target.value))}
                                            placeholder="ex: 178"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-white/70">Sex (opțional)</label>
                                        <select
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            value={profile.sex ?? ""}
                                            onChange={(e) => updateField("sex", e.target.value || null)}
                                        >
                                            <option className="bg-zinc-900" value="">
                                                Nespecificat
                                            </option>
                                            <option className="bg-zinc-900" value="M">
                                                M
                                            </option>
                                            <option className="bg-zinc-900" value="F">
                                                F
                                            </option>
                                            <option className="bg-zinc-900" value="OTHER">
                                                Other
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="text-sm text-white/70">Nivel experiență</label>
                                        <select
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            value={profile.experienceLevel}
                                            onChange={(e) =>
                                                updateField(
                                                    "experienceLevel",
                                                    e.target.value as UserProfileDTO["experienceLevel"]
                                                )
                                            }
                                        >
                                            <option className="bg-zinc-900" value="BEGINNER">
                                                Începător
                                            </option>
                                            <option className="bg-zinc-900" value="INTERMEDIATE">
                                                Intermediar
                                            </option>
                                            <option className="bg-zinc-900" value="ADVANCED">
                                                Avansat
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm text-white/70">Obiectiv principal</label>
                                        <select
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            value={profile.primaryGoal}
                                            onChange={(e) =>
                                                updateField(
                                                    "primaryGoal",
                                                    e.target.value as UserProfileDTO["primaryGoal"]
                                                )
                                            }
                                        >
                                            <option className="bg-zinc-900" value="LOSE_WEIGHT">
                                                Slăbire
                                            </option>
                                            <option className="bg-zinc-900" value="GAIN_MASS">
                                                Masă musculară
                                            </option>
                                            <option className="bg-zinc-900" value="STRENGTH">
                                                Forță
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm text-white/70">Durată max (minute)</label>
                                        <input
                                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                 px-3 py-2 text-white outline-none focus:border-violet-500"
                                            type="number"
                                            value={profile.maxWorkoutMinutes ?? ""}
                                            onChange={(e) =>
                                                updateField("maxWorkoutMinutes", toIntOrUndef(e.target.value))
                                            }
                                            placeholder="ex: 75"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-sm text-white/70">Echipament</label>
                                    <div className="mt-2 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateField("equipment", "GYM")}
                                            className={`px-4 py-2 rounded-lg border transition
                        ${
                                                profile.equipment === "GYM"
                                                    ? "bg-violet-600 border-violet-400 text-white"
                                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                            }`}
                                        >
                                            Gym
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateField("equipment", "HOME")}
                                            className={`px-4 py-2 rounded-lg border transition
                        ${
                                                profile.equipment === "HOME"
                                                    ? "bg-violet-600 border-violet-400 text-white"
                                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                            }`}
                                        >
                                            Home
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Zile disponibile */}
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-3">
                                    Zile disponibile pe săptămână
                                </h2>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {DAYS.map((d) => (
                                        <button
                                            type="button"
                                            key={d.key}
                                            onClick={() => toggleDay(d.key)}
                                            className={`px-3 py-2 rounded-lg border text-sm transition
                        ${
                                                selectedDays.has(d.key)
                                                    ? "bg-emerald-600/80 border-emerald-400 text-white"
                                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Restricții */}
                            <section>
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <h2 className="text-lg font-semibold text-white">
                                        Restricții / accidentări
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={addRestriction}
                                        className="px-4 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800
                               text-white font-medium transition border border-white/10"
                                    >
                                        + Adaugă
                                    </button>
                                </div>

                                {(profile.restrictions ?? []).length === 0 ? (
                                    <div className="text-white/60">
                                        Nu ai adăugat restricții.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {profile.restrictions.map((r, idx) => (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl
                                   border border-white/10 bg-white/5 p-4"
                                            >
                                                <div>
                                                    <label className="text-sm text-white/70">Tip</label>
                                                    <select
                                                        className="mt-1 w-full rounded-lg bg-black/30 border border-white/10
                                       px-3 py-2 text-white outline-none focus:border-violet-500"
                                                        value={r.restrictionType ?? ""}
                                                        onChange={(e) =>
                                                            updateRestriction(idx, "restrictionType", e.target.value)
                                                        }
                                                    >
                                                        <option className="bg-zinc-900" value="">
                                                            Selectează...
                                                        </option>
                                                        <option className="bg-zinc-900" value="SHOULDER">
                                                            Umăr
                                                        </option>
                                                        <option className="bg-zinc-900" value="KNEE">
                                                            Genunchi
                                                        </option>
                                                        <option className="bg-zinc-900" value="BACK">
                                                            Spate
                                                        </option>
                                                        <option className="bg-zinc-900" value="WRIST">
                                                            Încheietură
                                                        </option>
                                                        <option className="bg-zinc-900" value="ELBOW">
                                                            Cot
                                                        </option>
                                                        <option className="bg-zinc-900" value="OTHER">
                                                            Altceva
                                                        </option>
                                                    </select>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="text-sm text-white/70">Descriere</label>
                                                    <input
                                                        className="mt-1 w-full rounded-lg bg-black/30 border border-white/10
                                       px-3 py-2 text-white outline-none focus:border-violet-500"
                                                        value={r.description ?? ""}
                                                        onChange={(e) =>
                                                            updateRestriction(idx, "description", e.target.value)
                                                        }
                                                        placeholder='ex: "Evită overhead press"'
                                                    />
                                                </div>

                                                <div className="md:col-span-3 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRestriction(idx)}
                                                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                                       text-red-100 border border-red-500/30 transition"
                                                    >
                                                        Șterge
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={onSave}
                                    disabled={saveProfile.isPending}
                                    className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700
                             text-white font-semibold transition disabled:opacity-60"
                                >
                                    {saveProfile.isPending ? "Se salvează..." : "Salvează profilul"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
