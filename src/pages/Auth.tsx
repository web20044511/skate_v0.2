import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        if (formData.password !== formData.passwordConfirmation) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }
        await register(formData.email, formData.password, formData.name);
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      toast.error(isLogin ? `Login failed: ${errorMsg}` : `Registration failed: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-accent-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground tracking-tight">
            <span className="text-accent">Skating</span>
          </span>
        </Link>

        {/* Auth Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? 'Sign in to access your account'
                : 'Join the Skating community'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="pl-10"
                required
                minLength={8}
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  name="passwordConfirmation"
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.passwordConfirmation}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-accent font-medium hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-primary-foreground/60 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
