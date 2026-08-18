import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('agustinfidalgo200@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError('Contraseña incorrecta o usuario no registrado.');
        setLoading(false);
        return;
      }

      if (data?.user?.email !== 'agustinfidalgo200@gmail.com') {
        await supabase.auth.signOut();
        setError('Acceso denegado. Este panel es exclusivo para agustinfidalgo200@gmail.com.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.session);
    } catch (err) {
      setError('Ocurrió un error inesperado al iniciar sesión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-canvas p-4 sm:p-6 font-body">
      <div className="w-full max-w-[420px] bg-white border border-border-light rounded-3xl p-6 sm:p-10 shadow-xl transition-all duration-300">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="font-display text-2xl font-black tracking-tight inline-flex items-center gap-2 mb-2 text-primary">
            <span>AF</span> SELECT
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md">CRM</span>
          </div>
          <p className="text-xs font-semibold tracking-wider text-primary/40 uppercase">
            Panel de control exclusivo
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-accent-red/20 text-accent-red p-4 rounded-xl text-sm mb-6 animate-pulse">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
              <input
                type="email"
                className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm text-primary rounded-xl py-3 pl-11 pr-4 outline-none transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold tracking-widest text-primary/40 uppercase block">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
              <input
                type="password"
                className="w-full bg-bg-canvas/50 border border-border-light focus:border-primary focus:bg-white text-sm text-primary rounded-xl py-3 pl-11 pr-4 outline-none transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-border-light text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-accent-emerald uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Acceso Encriptado Supabase</span>
          </div>
          <p className="text-[11px] text-primary/30 leading-relaxed max-w-[280px] mx-auto">
            Este panel cuenta con políticas de seguridad estrictas. Solo el administrador principal está habilitado.
          </p>
        </div>

      </div>
    </div>
  );
}
