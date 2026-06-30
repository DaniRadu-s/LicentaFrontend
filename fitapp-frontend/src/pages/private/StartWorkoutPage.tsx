import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePlanStore } from "@/services/stores/usePlanStore";
import { useLoadActivePlan } from "@/services/react-query/plans";
import { useCreateWorkoutHistory } from "@/services/react-query/workout-history";

type ExerciseOption = {
    exerciseId: number;
    exerciseName: string;
    dayOfWeek: string;
    exerciseType?: string | null;
    plannedSets?: number | null;
    plannedReps?: number | null;
    restSeconds?: number | null;
    recommendedWeightKg?: number | null;
};

type WorkoutEntry = {
    clientId: string;
    exerciseId: number;
    exerciseName: string;
    dayOfWeek: string;
    exerciseType?: string | null;
    plannedSets?: number | null;
    plannedReps?: number | null;
    restSeconds?: number | null;
    completedSets?: number | null;
    completedReps?: number | null;
    weightKg?: number | null;
    notes?: string;
};

function toIntOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const nr = Number(trimmed);
    if (!Number.isFinite(nr)) return null;
    return Math.trunc(nr);
}

function toDoubleOrNull(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const nr = Number(trimmed);
    if (!Number.isFinite(nr)) return null;
    return nr;
}

export default function StartWorkoutPage() {
    const navigate = useNavigate();

    const activePlan = usePlanStore((s) => s.activePlan);
    const loadActive = useLoadActivePlan();
    const createWorkout = useCreateWorkoutHistory();

    const [search, setSearch] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [perceivedEffort, setPerceivedEffort] = useState("");
    const [workoutNotes, setWorkoutNotes] = useState("");
    const [selectedExercises, setSelectedExercises] = useState<WorkoutEntry[]>([]);

    useEffect(() => {
        loadActive.mutate();
    }, []);

    const availableExercises = useMemo<ExerciseOption[]>(() => {
        if (!activePlan) return [];

        return activePlan.days.flatMap((day) =>
            day.exercises.map((exercise) => ({
                exerciseId: exercise.exerciseId ?? exercise.id,
                exerciseName: exercise.name,
                dayOfWeek: day.dayOfWeek,
                exerciseType: exercise.exerciseType,
                plannedSets: exercise.sets,
                plannedReps: exercise.reps,
                restSeconds: exercise.restSeconds,
                recommendedWeightKg: exercise.recommendedWeightKg,
            }))
        );
    }, [activePlan]);

    const filteredExercises = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return availableExercises;
        return availableExercises.filter((ex) => ex.exerciseName.toLowerCase().includes(term));
    }, [availableExercises, search]);

    const addExercise = (exercise: ExerciseOption) => {
        setSelectedExercises((prev) => [
            ...prev,
            {
                clientId: `${exercise.exerciseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                dayOfWeek: exercise.dayOfWeek,
                exerciseType: exercise.exerciseType,
                plannedSets: exercise.plannedSets,
                plannedReps: exercise.plannedReps,
                restSeconds: exercise.restSeconds,
                completedSets: exercise.plannedSets ?? null,
                completedReps: exercise.plannedReps ?? null,
                weightKg: exercise.recommendedWeightKg ?? null,
                notes: "",
            },
        ]);
    };

    const updateExercise = (clientId: string, patch: Partial<WorkoutEntry>) => {
        setSelectedExercises((prev) =>
            prev.map((entry) => (entry.clientId === clientId ? { ...entry, ...patch } : entry))
        );
    };

    const removeExercise = (clientId: string) => {
        setSelectedExercises((prev) => prev.filter((entry) => entry.clientId !== clientId));
    };

    const finishWorkout = async () => {
        if (selectedExercises.length === 0) {
            toast.error("Adaugă cel puțin un exercițiu.");
            return;
        }

        const duration = toIntOrNull(durationMinutes);
        if (duration == null || duration <= 0) {
            toast.error("Completează durata antrenamentului (minute).", { id: "duration-error" });
            return;
        }

        const effort = toIntOrNull(perceivedEffort);
        if (effort == null || effort < 1 || effort > 10) {
            toast.error("Efortul perceput trebuie să fie între 1 și 10.");
            return;
        }

        const payload = {
            planId: activePlan?.id ?? null,
            durationMinutes: duration,
            perceivedEffort: effort,
            notes: workoutNotes.trim() || null,
            exercises: selectedExercises.map((entry) => ({
                exerciseId: entry.exerciseId,
                plannedSets: entry.plannedSets ?? null,
                plannedReps: entry.plannedReps ?? null,
                completedSets: entry.completedSets ?? null,
                completedReps: entry.completedReps ?? null,
                weightKg: entry.weightKg ?? null,
                restSeconds: entry.restSeconds ?? null,
                notes: entry.notes?.trim() || null,
            })),
        };

        try {
            await toast.promise(createWorkout.mutateAsync(payload), {
                loading: "Se salvează antrenamentul...",
                success: "Workout finalizat!",
                error: (err: unknown) =>
                    err instanceof Error ? err.message : "Nu am putut salva antrenamentul.",
            });

            setDurationMinutes("");
            setPerceivedEffort("");
            setWorkoutNotes("");
            setSelectedExercises([]);
            navigate("/workout-history");
        } catch {
            // toast handles error
        }
    };

    return (
        <div
            className="min-h-screen relative px-4 py-10
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            <div className="absolute top-6 left-6">
                <button
                    onClick={() => navigate("/home")}
                    className="px-4 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-white font-medium transition border border-white/10"
                >
                    Home
                </button>
            </div>

            <div className="max-w-6xl mx-auto mt-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-6">
                <h1 className="text-2xl font-bold text-white">Start workout</h1>
                <p className="text-white/60 mt-1">Caută exercițiile, completează datele și apasă pe finish workout.</p>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="text-sm text-white/70">Caută exercițiu</label>
                        <input
                            className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:border-violet-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ex: bench press"
                        />
                    </div>

                    <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                        {loadActive.isPending ? (
                            <div className="text-white/60">Se încarcă exercițiile din plan...</div>
                        ) : filteredExercises.length === 0 ? (
                            <div className="text-white/60">Nu există exerciții disponibile.</div>
                        ) : (
                            filteredExercises.map((ex, index) => (
                                <button
                                    key={`${ex.exerciseId}-${ex.dayOfWeek}-${index}`}
                                    type="button"
                                    onClick={() => addExercise(ex)}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-white/10 bg-black/30 hover:bg-black/50 transition"
                                >
                                    <div className="text-white font-medium">{ex.exerciseName}</div>
                                    <div className="text-xs text-white/60">
                                        {ex.dayOfWeek} • {ex.plannedSets ?? "-"}x{ex.plannedReps ?? "-"}{ex.exerciseType?.toUpperCase() === "CARDIO" ? "s" : ""} • rest {ex.restSeconds ?? "-"}s
                                        {ex.recommendedWeightKg != null ? ` • ${ex.recommendedWeightKg}kg` : ""}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-sm text-white/70">Durată (minute)</label>
                            <input
                                type="number"
                                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:border-violet-500"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-white/70">Efort perceput (1-10)</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:border-violet-500"
                                value={perceivedEffort}
                                onChange={(e) => setPerceivedEffort(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-white/70">Notițe workout</label>
                            <input
                                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white outline-none focus:border-violet-500"
                                value={workoutNotes}
                                onChange={(e) => setWorkoutNotes(e.target.value)}
                                placeholder="optional"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    <h2 className="text-lg font-semibold text-white">Exerciții selectate</h2>

                    {selectedExercises.length === 0 ? (
                        <div className="text-white/60">Nu ai adăugat încă exerciții.</div>
                    ) : (
                        selectedExercises.map((entry) => (
                            <div key={entry.clientId} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-white font-medium">{entry.exerciseName}</div>
                                        <div className="text-xs text-white/60">{entry.dayOfWeek}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeExercise(entry.clientId)}
                                        className="px-3 py-1 rounded-md bg-red-600/80 hover:bg-red-700 text-white text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                            <label className="text-xs text-white/70">
                                                {entry.exerciseType?.toUpperCase() === "CARDIO" ? "Planned seconds" : "Planned sets"}
                                            </label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.plannedSets ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { plannedSets: toIntOrNull(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/70">Planned reps</label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.plannedReps ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { plannedReps: toIntOrNull(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                            <label className="text-xs text-white/70">
                                                {entry.exerciseType?.toUpperCase() === "CARDIO" ? "Completed seconds" : "Completed sets"}
                                            </label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.completedSets ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { completedSets: toIntOrNull(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/70">Completed reps</label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.completedReps ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { completedReps: toIntOrNull(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-white/70">Greutate (kg)</label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.weightKg ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { weightKg: toDoubleOrNull(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/70">Rest (secunde)</label>
                                        <input
                                            type="number"
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.restSeconds ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { restSeconds: toIntOrNull(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/70">Notițe exercițiu</label>
                                        <input
                                            className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                            value={entry.notes ?? ""}
                                            onChange={(e) => updateExercise(entry.clientId, { notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    type="button"
                    onClick={finishWorkout}
                    disabled={createWorkout.isPending}
                    className="mt-6 w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition disabled:opacity-60"
                >
                    {createWorkout.isPending ? "Saving..." : "Finish workout"}
                </button>
            </div>
        </div>
    );
}
