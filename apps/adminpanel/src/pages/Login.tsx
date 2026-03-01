import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppButton } from '../components/ui/AppButton';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login xatosi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-main relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-card p-8 sm:p-10 rounded-3xl shadow-xl shadow-black/5 border border-border/50 relative z-10"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Lock className="text-accent" size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main tracking-tight mb-2">
            Xush kelibsiz
          </h1>
          <p className="text-sm font-medium text-muted">
            Clothes Marketplace boshqaruvi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 border border-border/60 bg-body rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent/50 transition-all duration-200">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Mail size={12} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-main placeholder-muted/50 focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-1.5 border border-border/60 bg-body rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent/50 transition-all duration-200">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Lock size={12} />
              Parol
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-main placeholder-muted/50 focus:outline-none focus:ring-0"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl px-4 py-3 text-sm font-medium flex gap-2 items-start"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          <AppButton
            type="submit"
            fullWidth
            size="lg"
            isLoading={loading}
            className="mt-6 font-semibold"
          >
            Tizimga kirish
          </AppButton>
        </form>
      </motion.div>
    </div>
  );
}
