import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WorkoutProgressMetricDTO, WorkoutProgressResponseDTO } from "@/api/api";
import { useWorkoutHistoryStore } from "@/services/stores/useWorkoutHistoryStore";
import { useLoadWorkoutHistory, useLoadWorkoutProgress } from "@/services/react-query/workout-history";
import { toast } from "sonner";

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

export default function ProgressPage() {
    const navigate = useNavigate();

    const history = useWorkoutHistoryStore((s) => s.history);
    const loadHistory = useLoadWorkoutHistory();
    const loadProgress = useLoadWorkoutProgress();

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 29);

    const [selectedProgressExerciseId, setSelectedProgressExerciseId] = useState<string>("");
    const [progressMetric, setProgressMetric] = useState<WorkoutProgressMetricDTO>("VOLUME");
    const [progressStartDate, setProgressStartDate] = useState(toIsoDateInput(thirtyDaysAgo));
    const [progressEndDate, setProgressEndDate] = useState(toIsoDateInput(today));
    const [progressData, setProgressData] = useState<WorkoutProgressResponseDTO | null>(null);

    useEffect(() => {
        loadHistory.mutate();
    }, []);

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
    }, [selectedProgressExerciseId, progressStartDate, progressEndDate, progressMetric]);

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

            <div className="max-w-6xl mx-auto mt-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-white">Progress chart</h1>
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
                                <div className="text-white font-semibold">{formatMetricValue(progressData.summary.initialValue)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-xs text-white/60">Final</div>
                                <div className="text-white font-semibold">{formatMetricValue(progressData.summary.finalValue)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-xs text-white/60">Δ%</div>
                                <div className="text-white font-semibold">{formatMetricValue(progressData.summary.deltaPercent)}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <div className="text-xs text-white/60">PR</div>
                                <div className="text-white font-semibold">{formatMetricValue(progressData.summary.personalRecord)}</div>
                            </div>
                        </div>

                        <ProgressChart progress={progressData} />
                    </>
                ) : (
                    <div className="text-sm text-white/60">Selectează un exercițiu pentru a vedea progresul.</div>
                )}
            </div>
        </div>
    );
}
