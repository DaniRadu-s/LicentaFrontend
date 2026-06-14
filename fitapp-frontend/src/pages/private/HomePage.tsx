import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@/services/react-query/auth.ts";
import { useAuthStore } from "@/services/stores/useAuthStore.ts";
import { toast } from "sonner";

export default function HomePage() {
    const navigate = useNavigate();
    const { mutateAsync: logout, isPending } = useLogout();
    const user = useAuthStore((s) => s.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const LOGOUT_FAILED_MESSAGE = "Logout failed";

    useEffect(() => {
        const onClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const handleLogout = async () => {
        await toast.promise(logout(), {
            loading: "Logging out...",
            success: () => {
                navigate("/login");
                return "Logged out successfully!";
            },
            error: (err: unknown) => {
                if (err instanceof Error) return err.message || LOGOUT_FAILED_MESSAGE;
                return LOGOUT_FAILED_MESSAGE;
            },
        });
    };

    const cards = [
        { title: "Profile", description: "Date personale și preferințe", path: "/profile", color: "from-violet-500/20 to-violet-800/20", image: "/images/cards/profile.svg" },
        { title: "Plans", description: "Planul curent + generare plan", path: "/plans", color: "from-emerald-500/20 to-emerald-800/20", image: "/images/cards/plans.svg" },
        { title: "Start Workout", description: "Începe un antrenament nou", path: "/start-workout", color: "from-cyan-500/20 to-cyan-800/20", image: "/images/cards/start-workout.svg" },
        { title: "History", description: "Istoricul antrenamentelor", path: "/workout-history?tab=history", color: "from-blue-500/20 to-blue-800/20", image: "/images/cards/history.svg" },
        { title: "Progress", description: "Grafic evoluție pe exerciții", path: "/progress", color: "from-fuchsia-500/20 to-fuchsia-800/20", image: "/images/cards/progress.svg" },
    ];

    const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim().toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || "U";

    return (
        <div
            className="min-h-screen px-4 py-6
            bg-[radial-gradient(900px_circle_at_15%_20%,rgba(139,92,246,0.20),transparent_60%),radial-gradient(900px_circle_at_85%_70%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,#07060f,#0a0a12_45%,#050a08)]"
        >
            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-4 flex justify-start" ref={menuRef}>
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen((v) => !v)}
                            className="h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-white/10 hover:border-white/40 transition"
                            aria-label="Deschide meniul de profil"
                        >
                            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                                {initials}
                            </span>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute left-0 mt-2 w-44 rounded-xl border border-white/10 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-md z-20">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        navigate("/profile");
                                    }}
                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 transition"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={isPending}
                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-200 hover:bg-red-500/20 transition disabled:opacity-60"
                                >
                                    {isPending ? "Logging out..." : "Logout"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl px-6 py-5 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">SmartFit Home</h1>
                        <p className="text-white/60 mt-1">Alege secțiunea în care vrei să intri.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card) => (
                        <button
                            key={card.path}
                            onClick={() => navigate(card.path)}
                            className={`text-left rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} p-4 hover:border-white/30 hover:-translate-y-0.5 transition aspect-square flex flex-col`}
                        >
                            <img
                                src={card.image}
                                alt={card.title}
                                className="w-full h-[62%] object-cover rounded-xl border border-white/15"
                            />
                            <div className="mt-3">
                                <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                                <p className="text-sm text-white/70 mt-1">{card.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
