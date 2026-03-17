import { Sparkles, ArrowLeft, Gem, Zap, Lock } from 'lucide-react';
import Link from 'next/link';

export default function FeaturePage() {


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center px-4 relative overflow-hidden">

            {/* Floating background orbs */}
            <div className="absolute top-1/4 -left-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 h-64 w-64 rounded-full bg-purple-100/60 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-50/80 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-lg w-full">

                {/* Back button */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-10 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    Go back
                </Link>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-8 sm:p-10 text-center">

                    {/* Icon cluster */}
                    <div className="relative inline-flex items-center justify-center mb-6">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-200">
                            <Lock className="h-9 w-9 text-white" />
                        </div>
                        <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                        </span>
                        <span className="absolute -bottom-2 -left-2 h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                            <Gem className="h-3 w-3 text-purple-500" />
                        </span>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-purple-600 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                        <Zap className="h-3 w-3" />
                        Coming Soon
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 leading-tight">
                        We&apos;re building<br />
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            something special
                        </span>
                    </h1>

                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        This feature is currently under development. We&apos;re crafting an exceptional experience for you — it&apos;ll be ready soon.
                    </p>

                    {/* CTA back to shop */}
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-semibold text-gray-600 transition-all"
                    >
                        <Gem className="h-4 w-4 text-purple-400" />
                        Continue browsing
                    </Link>
                </div>
            </div>
        </div>
    );
}