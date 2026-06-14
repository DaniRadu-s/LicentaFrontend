import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { WorkoutProgressMetricDTO, WorkoutProgressResponseDTO } from "@/api/api";
import { usePlanStore } from "@/services/stores/usePlanStore";
import { useWorkoutHistoryStore } from "@/services/stores/useWorkoutHistoryStore";
import { useLoadActivePlan } from "@/services/react-query/plans";
import {
    useCreateWorkoutHistory,
    useLoadWorkoutProgress,
    useLoadWorkoutHistory,
} from "@/services/react-query/workout-history";

type ExerciseOption = {
    exerciseId: number;
    exerciseName: string;
    dayOfWeek: string;
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

function formatDate(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
}

function formatWeekdayEnglish(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Workout";
    return d.toLocaleDateString("en-US", { weekday: "long" });
}

function toIsoDateInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatMetricValue(value?: number | null): string {
    if (value == null || Number.isNaN(value)) return "-";
    return value.toFixed(1);
}

const METRIC_OPTIONS: { value: WorkoutProgressMetricDTO; label: string }[] = [
    { value: "VOLUME", label: "Volume" },
    { value: "WEIGHT", label: "Weight (kg)" },
    { value: "REPS", label: "Reps" },
    { value: "ESTIMATED_1RM", label: "Estimated 1RM" },
];

function ProgressChart({
    progress,
}: {
    progress: WorkoutProgressResponseDTO;
}) {
    if (progress.points.length === 0) {
        return (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                Nu există date pentru combinația selectată (exercițiu/perioadă/metrică).
            </div>
        );
    }

    const paddingX = 24;
    const paddingY = 24;
    const baseWidth = 760;
    const minStepPx = 58;
    const width = Math.max(baseWidth, paddingX * 2 + Math.max(progress.points.length - 1, 1) * minStepPx);
    const height = 260;
    const values = progress.points.map((p) => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(maxValue - minValue, 1);
    const startTimestamp = new Date(`${progress.startDate}T00:00:00`).getTime();
    const endTimestamp = new Date(`${progress.endDate}T23:59:59`).getTime();
    const timeRange = Math.max(endTimestamp - startTimestamp, 1);

    const points = progress.points.map((point) => {
        const x =
            paddingX +
            ((new Date(point.completedAt).getTime() - startTimestamp) / timeRange) * (width - paddingX * 2);
        const y =
            height -
            paddingY -
            ((point.value - minValue) / range) * (height - paddingY * 2);
        return { x, y, point };
    });

    const gradientId = `progressGradient-${progress.exerciseId}-${progress.metricType}`;
    const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPoints = `${linePoints} ${points[points.length - 1].x},${height - paddingY} ${points[0].x},${height - paddingY}`;

    return (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-cyan-500/10 to-emerald-500/5 p-4 md:p-5">
            <div className="text-sm text-white/70 mb-3">Trend în timp</div>
            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-64 min-w-full" style={{ width: `${width}px` }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(16,185,129,0.45)" />
                            <stop offset="100%" stopColor="rgba(16,185,129,0.02)" />
                        </linearGradient>
                    </defs>

                    {[0.25, 0.5, 0.75].map((ratio) => {
                        const y = paddingY + (height - paddingY * 2) * ratio;
                        return (
                            <line
                                key={ratio}
                                x1={paddingX}
                                y1={y}
                                x2={width - paddingX}
                                y2={y}
                                stroke="rgba(255,255,255,0.08)"
                                strokeDasharray="4 6"
                                strokeWidth="1"
                            />
                        );
                    })}

                    <line
                        x1={paddingX}
                        y1={height - paddingY}
                        x2={width - paddingX}
                        y2={height - paddingY}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="1"
                    />
                    <line
                        x1={paddingX}
                        y1={paddingY}
                        x2={paddingX}
                        y2={height - paddingY}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="1"
                    />

                    {points.length > 1 && <polygon points={areaPoints} fill={`url(#${gradientId})`} />}

                    <polyline
                        points={linePoints}
                        fill="none"
                        stroke="rgb(16, 185, 129)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {points.map(({ x, y, point }, idx) => (
                        <circle
                            key={`${point.completedAt}-${idx}`}
                            cx={x}
                            cy={y}
                            r="4.5"
                            fill="rgb(34,211,238)"
                            stroke="rgba(6,11,24,0.9)"
                            strokeWidth="1.5"
                        >
                            <title>{`${new Date(point.completedAt).toLocaleDateString()} • ${point.value.toFixed(2)}`}</title>
                        </circle>
                    ))}
                </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                <span>{new Date(progress.startDate).toLocaleDateString()}</span>
                <span>{new Date(progress.endDate).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

export default function WorkoutHistoryPage() {
    const navigate = useNavigate();
    const [, setSearchParams] = useSearchParams();

    const activePlan = usePlanStore((s) => s.activePlan);
    const history = useWorkoutHistoryStore((s) => s.history);

    const loadActive = useLoadActivePlan();
    const loadHistory = useLoadWorkoutHistory();
    const loadProgress = useLoadWorkoutProgress();
    const createWorkout = useCreateWorkoutHistory();

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const [search, setSearch] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [perceivedEffort, setPerceivedEffort] = useState("");
    const [workoutNotes, setWorkoutNotes] = useState("");
    const [selectedExercises, setSelectedExercises] = useState<WorkoutEntry[]>([]);
    const [selectedProgressExerciseId, setSelectedProgressExerciseId] = useState<string>("");
    const [progressMetric, setProgressMetric] = useState<WorkoutProgressMetricDTO>("VOLUME");
    const [progressStartDate, setProgressStartDate] = useState(toIsoDateInput(thirtyDaysAgo));
    const [progressEndDate, setProgressEndDate] = useState(toIsoDateInput(today));
    const [progressData, setProgressData] = useState<WorkoutProgressResponseDTO | null>(null);

    const setActiveTab = (tab: "start" | "history") => {
        setSearchParams({ tab });
    };

    useEffect(() => {
        loadActive.mutate();
        loadHistory.mutate();
    }, []);

    const availableExercises = useMemo<ExerciseOption[]>(() => {
        if (!activePlan) return [];

        return activePlan.days.flatMap((day) =>
            day.exercises.map((exercise) => ({
                exerciseId: exercise.exerciseId ?? exercise.id,
                exerciseName: exercise.name,
                dayOfWeek: day.dayOfWeek,
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

    const progressExerciseOptions = useMemo(() => {
        const unique = new Map<number, string>();
        for (const workout of history) {
            for (const exercise of workout.exercises) {
                if (!unique.has(exercise.exerciseId)) {
                    unique.set(exercise.exerciseId, exercise.exerciseName);
                }
            }
        }

        return Array.from(unique.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [history]);

    useEffect(() => {
        if (progressExerciseOptions.length === 0) {
            setSelectedProgressExerciseId("");
            setProgressData(null);
            return;
        }

        const isCurrentSelectionValid = progressExerciseOptions.some(
            (option) => String(option.id) === selectedProgressExerciseId
        );

        if (!selectedProgressExerciseId || !isCurrentSelectionValid) {
            setSelectedProgressExerciseId(String(progressExerciseOptions[0].id));
        }
    }, [progressExerciseOptions, selectedProgressExerciseId]);

    useEffect(() => {
        if (true) return;
        if (!selectedProgressExerciseId) return;
        if (!progressStartDate || !progressEndDate) return;

        let cancelled = false;

        loadProgress
            .mutateAsync({
                exerciseId: Number(selectedProgressExerciseId),
                startDate: progressStartDate,
                endDate: progressEndDate,
                metricType: progressMetric,
            })
            .then((response) => {
                if (!cancelled) {
                    setProgressData(response);
                }
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setProgressData(null);
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Nu am putut încărca progresul pentru exercițiul selectat."
                );
            });

        return () => {
            cancelled = true;
        };
    }, [
        selectedProgressExerciseId,
        progressStartDate,
        progressEndDate,
        progressMetric,
    ]);

    const progressPanel = (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Progress chart</h3>
                <span className="text-xs text-white/60">Filtrează pe exercițiu și perioadă</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                    <label className="text-xs text-white/70">Exercise</label>
                    <select
                        value={selectedProgressExerciseId}
                        onChange={(e) => setSelectedProgressExerciseId(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                    >
                        {progressExerciseOptions.length === 0 ? (
                            <option value="">No exercise found</option>
                        ) : (
                            progressExerciseOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-white/70">Metric</label>
                    <select
                        value={progressMetric}
                        onChange={(e) => setProgressMetric(e.target.value as WorkoutProgressMetricDTO)}
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                    >
                        {METRIC_OPTIONS.map((metric) => (
                            <option key={metric.value} value={metric.value}>
                                {metric.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-white/70">Start date</label>
                    <input
                        type="date"
                        value={progressStartDate}
                        onChange={(e) => setProgressStartDate(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                    />
                </div>

                <div>
                    <label className="text-xs text-white/70">End date</label>
                    <input
                        type="date"
                        value={progressEndDate}
                        onChange={(e) => setProgressEndDate(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white"
                    />
                </div>
            </div>

            {loadProgress.isPending ? (
                <div className="text-sm text-white/60">Se încarcă graficul de progres...</div>
            ) : progressData ? (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/60">Initial</div>
                            <div className="text-white font-semibold">
                                {formatMetricValue(progressData.summary.initialValue)}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/60">Final</div>
                            <div className="text-white font-semibold">
                                {formatMetricValue(progressData.summary.finalValue)}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/60">Δ%</div>
                            <div className="text-white font-semibold">
                                {formatMetricValue(progressData.summary.deltaPercent)}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/60">PR</div>
                            <div className="text-white font-semibold">
                                {formatMetricValue(progressData.summary.personalRecord)}
                            </div>
                        </div>
                    </div>

                    <ProgressChart progress={progressData} />
                </>
            ) : (
                <div className="text-sm text-white/60">Selectează un exercițiu pentru a vedea progresul.</div>
            )}
        </div>
    );

    const addExercise = (exercise: ExerciseOption) => {
        setSelectedExercises((prev) => [
            ...prev,
            {
                clientId: `${exercise.exerciseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                dayOfWeek: exercise.dayOfWeek,
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
            setActiveTab("history");
        } catch {
            // toast handles error
        }
    };

    return (
        <div
            className="min-h-screen relative px-4 py-10
      bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            <div className="absolute top-6 left-6 flex gap-3">
                <button
                    onClick={() => navigate("/home")}
                    className="px-4 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800
                     text-white font-medium transition border border-white/10"
                >
                    Home
                </button>
            </div>

            <div className="max-w-6xl mx-auto mt-10">
                <div className="mb-6">
                    <div className="inline-flex px-4 py-2 rounded-lg border bg-cyan-600 border-cyan-500 text-white font-medium">
                        Workout history
                    </div>
                </div>

                {false ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-6">
                    <h1 className="text-2xl font-bold text-white">Start workout</h1>
                    <p className="text-white/60 mt-1">
                        Caută exercițiile, completează datele și apasă pe finish workout.
                    </p>

                    {progressPanel}

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="text-sm text-white/70">Caută exercițiu</label>
                            <input
                                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                px-3 py-2 text-white outline-none focus:border-violet-500"
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
                                        className="w-full text-left px-3 py-2 rounded-lg border border-white/10
                                        bg-black/30 hover:bg-black/50 transition"
                                    >
                                        <div className="text-white font-medium">{ex.exerciseName}</div>
                                        <div className="text-xs text-white/60">
                                            {ex.dayOfWeek} • {ex.plannedSets ?? "-"}x{ex.plannedReps ?? "-"} • rest {ex.restSeconds ?? "-"}s
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
                                    className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                    px-3 py-2 text-white outline-none focus:border-violet-500"
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
                                    className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                    px-3 py-2 text-white outline-none focus:border-violet-500"
                                    value={perceivedEffort}
                                    onChange={(e) => setPerceivedEffort(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-white/70">Notițe workout</label>
                                <input
                                    className="mt-1 w-full rounded-lg bg-white/5 border border-white/10
                                    px-3 py-2 text-white outline-none focus:border-violet-500"
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
                                <div
                                    key={entry.clientId}
                                    className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
                                >
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
                                            <label className="text-xs text-white/70">Planned sets</label>
                                            <input
                                                type="number"
                                                className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                                value={entry.plannedSets ?? ""}
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        plannedSets: toIntOrNull(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/70">Planned reps</label>
                                            <input
                                                type="number"
                                                className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                                value={entry.plannedReps ?? ""}
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        plannedReps: toIntOrNull(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/70">Completed sets</label>
                                            <input
                                                type="number"
                                                className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                                value={entry.completedSets ?? ""}
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        completedSets: toIntOrNull(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/70">Completed reps</label>
                                            <input
                                                type="number"
                                                className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                                value={entry.completedReps ?? ""}
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        completedReps: toIntOrNull(e.target.value),
                                                    })
                                                }
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
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        weightKg: toDoubleOrNull(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/70">Rest (secunde)</label>
                                            <input
                                                type="number"
                                                className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                                value={entry.restSeconds ?? ""}
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        restSeconds: toIntOrNull(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/70">Notițe exercițiu</label>
                                            <input
                                                className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-white"
                                                value={entry.notes ?? ""}
                                                onChange={(e) =>
                                                    updateExercise(entry.clientId, {
                                                        notes: e.target.value,
                                                    })
                                                }
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
                        className="mt-6 w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700
                        text-white font-semibold transition disabled:opacity-60"
                    >
                        {createWorkout.isPending ? "Saving..." : "Finish workout"}
                    </button>
                </div>
                ) : (
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-6">
                    <h2 className="text-2xl font-bold text-white">Istoric workout</h2>
                    <p className="text-white/60 mt-1">Vezi sesiunile tale salvate.</p>

                    <div className="mt-6 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        {loadHistory.isPending && history.length === 0 ? (
                            <div className="text-white/60">Se încarcă istoricul...</div>
                        ) : history.length === 0 ? (
                            <div className="text-white/60">Nu ai antrenamente salvate încă.</div>
                        ) : (
                            history.map((workout) => (
                                <div
                                    key={workout.id}
                                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-white font-semibold">
                                                {formatWeekdayEnglish(workout.completedAt)}
                                            </div>
                                            <div className="text-xs text-white/60">
                                                {formatDate(workout.completedAt)}
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-white/80">
                                            <div>{workout.durationMinutes ?? "-"} min</div>
                                            <div>Effort: {workout.perceivedEffort ?? "-"}/10</div>
                                        </div>
                                    </div>

                                    {workout.notes && (
                                        <div className="mt-2 text-sm text-white/70">{workout.notes}</div>
                                    )}

                                    <div className="mt-3 space-y-2">
                                        {workout.exercises.map((ex) => (
                                            <div
                                                key={ex.id}
                                                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                                            >
                                                <div className="text-white text-sm font-medium">{ex.exerciseName}</div>
                                                <div className="text-xs text-white/60">
                                                    {ex.completedSets ?? "-"}x{ex.completedReps ?? "-"}
                                                    {ex.weightKg != null ? ` • ${ex.weightKg}kg` : ""}
                                                    {ex.restSeconds != null ? ` • rest ${ex.restSeconds}s` : ""}
                                                </div>
                                                {ex.notes && (
                                                    <div className="text-xs text-white/60 mt-1">{ex.notes}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}
