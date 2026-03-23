import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/services/auth.service';
import logo from '@/assets/2.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    Activity,
    Loader2,
    ArrowRight,
    HeadphonesIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
    username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
    password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await login(data);
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Identifiants invalides. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
            {/* --- LEFT SIDE: HERO / MARKETING --- */}
            <div className="hidden lg:flex relative w-1/2 bg-[#05070A] items-center justify-center p-16 overflow-hidden">
                {/* Visual Depth Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-700" />
                    <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                <div className={cn(
                    "relative z-10 max-w-lg transition-all duration-1000 delay-200",
                    isMounted ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
                )}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] leading-none">Environnement Certifié</span>
                    </div>

                    <h1 className="text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
                        Prenez le contrôle <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">de votre plateforme.</span>
                    </h1>

                    <p className="text-lg text-slate-400 leading-relaxed font-medium mb-12">
                        Optimisez vos opérations, suivez vos performances en temps réel et gérez votre infrastructure avec une interface conçue pour l'excellence.
                    </p>

                    {/* Glassmorphism Feature Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            {
                                label: 'Analytique Temps Réel',
                                icon: Activity,
                                desc: 'Données de vente actualisées en direct',
                                color: 'text-indigo-400',
                                bg: 'bg-indigo-500/10'
                            },
                            {
                                label: 'Sécurité Maximale',
                                icon: ShieldCheck,
                                desc: 'Protection des données de niveau bancaire',
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/10'
                            }
                        ].map((feat, i) => (
                            <div key={i} className="group relative p-6 rounded-[20px] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[20px] pointer-events-none" />
                                <div className="relative flex items-center gap-5">
                                    <div className={cn("p-3 rounded-2xl", feat.bg)}>
                                        <feat.icon className={cn("w-6 h-6", feat.color)} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white mb-1 tracking-tight">{feat.label}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{feat.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Brand Left */}
                <div className="absolute bottom-12 left-12 flex items-center gap-4 group">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[.3em]">© 2026 Vendor</span>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN AREA --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-white lg:bg-[#FDFDFF]">
                <div className={cn(
                    "w-full max-w-md transition-all duration-[400ms] ease-out",
                    isMounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                )}>
                    {/* Brand Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-25 h-25 rounded-full bg-white shadow-xl shadow-indigo-500/5 border border-slate-50 mb-8 p-4">
                            <img src={logo} alt="Logo" className="w-20 h-auto" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Connexion Admin</h2>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">Accès sécurisé réservé</p>
                    </div>

                    {/* Centered Login Card */}
                    <div className="p-10 rounded-[20px] bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                                </div>
                            )}

                            {/* Username Field */}
                            <div className="space-y-2 group/field">
                                <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Utilisateur</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within/field:text-indigo-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Identifiant unique"
                                        className="h-14 pl-12 rounded-xl bg-slate-50 border-slate-200/60 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-300 placeholder:font-medium"
                                        {...register('username')}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.username.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2 group/field">
                                <div className="flex items-center justify-between px-1">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</Label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-indigo-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="h-14 pl-12 pr-12 rounded-xl bg-slate-50 border-slate-200/60 focus:bg-white focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-300 placeholder:font-medium"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-indigo-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Primary Button */}
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all group overflow-hidden relative"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Validation...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>Se connecter</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}

                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] translate-x-[-250%] group-hover:translate-x-[250%] transition-transform duration-[1200ms] linear" />
                            </Button>
                        </form>
                    </div>

                    {/* Bottom Support Section */}
                    <div className="mt-12 text-center">
                        <div className="flex flex-col items-center gap-4 group cursor-pointer">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Besoin d'aide ?</p>
                            <a href="#" className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-100 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:bg-slate-50 hover:border-indigo-100 transition-all">
                                <HeadphonesIcon className="w-3.5 h-3.5" />
                                Contacter le support technique
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s infinite ease-in-out;
                }
            `}</style>
        </div >
    );
}
