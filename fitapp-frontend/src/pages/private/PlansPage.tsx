import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/services/stores/usePlanStore";
import { useGeneratePlan, useLoadActivePlan } from "@/services/react-query/plans";

export default function PlansPage() {
    const navigate = useNavigate();

    const activePlan = usePlanStore((s) => s.activePlan);
    const setActivePlan = usePlanStore((s) => s.setActivePlan);
    const loadActive = useLoadActivePlan();
    const gen = useGeneratePlan();
    const [generateError, setGenerateError] = useState<string | null>(null);

    useEffect(() => {
        loadActive.mutate();
    }, []);

    const handleGenerate = async () => {
        if (gen.isPending) return;

        setGenerateError(null);
        setActivePlan(null);

        try {
            await gen.mutateAsync();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to generate plan";
            setGenerateError(message);
            loadActive.mutate();
        }
    };

    return (
        <div
            className="min-h-screen px-4 py-10
            bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            <div className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <button
                        onClick={() => navigate("/home")}
                        className="px-4 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-white font-medium transition border border-white/10"
                    >
                        Home
                    </button>

                    <button
                        onClick={handleGenerate}
                        disabled={gen.isPending}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {gen.isPending ? "Generating..." : "Generate Plan"}
                    </button>
                </div>

                {generateError && <div className="mb-4 text-sm text-red-300">{generateError}</div>}

                {gen.isPending ? (
                    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-8 flex flex-col items-center justify-center gap-4 min-h-[220px]">
                        <div className="h-10 w-10 rounded-full border-4 border-white/25 border-t-violet-400 animate-spin" />
                        <div className="text-white/70">Generating new plan...</div>
                    </div>
                ) : !activePlan ? (
                    <div className="text-white/70">No active plan yet.</div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-6">
                        <h1 className="text-2xl font-bold text-white">Plan</h1>
                        <p className="text-white/60">
                            {activePlan.level} • {activePlan.goal}
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {activePlan.days.map((d) => (
                                <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="font-semibold text-white">{d.dayOfWeek}</div>

                                    <div className="mt-3">
                                        <div className="mb-2 grid grid-cols-[minmax(200px,1.8fr)_auto_auto_auto_auto] items-center gap-3 text-[11px] uppercase tracking-wide text-white/40">
                                            <span>Exercise</span>
                                            <span>Sets x Reps/Sec</span>
                                            <span>Rest</span>
                                            <span>Weight</span>
                                            <span>RPE</span>
                                        </div>

                                        <div className="space-y-2">
                                            {d.exercises.map((ex) => (
                                                <div
                                                    key={ex.id}
                                                    className="grid grid-cols-[minmax(200px,1.8fr)_auto_auto_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
                                                >
                                                    <span className="font-medium text-white break-words">{ex.name}</span>
                                                    <span className="text-white/70 whitespace-nowrap">
                                                        {ex.sets}x{ex.reps}{ex.exerciseType?.toUpperCase() === "CARDIO" ? "s" : ""}
                                                    </span>
                                                    <span className="text-white/70 whitespace-nowrap">{ex.restSeconds}s</span>
                                                    <span className="text-white/70 whitespace-nowrap">
                                                        {ex.recommendedWeightKg != null ? `${ex.recommendedWeightKg}kg` : "-"}
                                                    </span>
                                                    <span className="text-white/70 whitespace-nowrap">
                                                        {ex.rpeTarget ? ex.rpeTarget : "-"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
