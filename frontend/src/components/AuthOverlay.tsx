import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const AuthOverlay: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const setAuthenticated = useStore(state => state.setAuthenticated);
    const pushNotification = useStore(state => state.pushNotification);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const cleanUser = username.trim();
            const cleanPass = password.trim();

            console.log(`🔑 Attempting session establishment for: ${cleanUser}`);
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cleanUser, password: cleanPass }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                await useStore.getState().fetchSystemStatus();
                setAuthenticated(true);
                pushNotification('SUCCESS', `${data.mode} Session Active`);
            } else {
                setError(data.error || 'Identity rejection');
                pushNotification('ERROR', 'Access Denied');
            }
        } catch (err) {
            console.error('Terminal error:', err);
            setError('System unreachable (Check Link)');
            pushNotification('ERROR', 'Link Failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl">
            {/* Animated Background Artifacts */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[150px] animate-pulse delay-700" />

            <div className="relative w-full max-w-md p-8 glass-panel border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                {/* 3D Reflection Effect */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3 animate-float">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        IDENTITY VERIFICATION
                    </h1>
                    <p className="text-[10px] text-gray-400 mt-1 tracking-widest opacity-60">PROPRIETARY TERMINAL ACCESS</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-semibold text-cyan-400/80 mb-1 uppercase tracking-tighter">Operator Handle</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-600 text-sm"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-cyan-400/80 mb-1 uppercase tracking-tighter">Cryptographic Sequence</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-600 text-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative group overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 p-[1px] rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-2"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="bg-[#0a0c10] rounded-[7px] py-3 flex items-center justify-center space-x-2 transition-all group-hover:bg-transparent">
                            <span className="text-white font-bold tracking-widest text-xs">
                                {loading ? 'DECRYPTING...' : 'ESTABLISH SESSION'}
                            </span>
                        </div>
                    </button>
                </form>

                <div className="mt-6 flex justify-between items-center opacity-30">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
                    <span className="text-[8px] text-white px-3 font-mono">FRIDAY-X OS</span>
                </div>
            </div>

            <style>{`
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div >
    );
};
