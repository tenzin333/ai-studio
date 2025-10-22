import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
    onLogin: (token: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [state, setState] = useState<"signup" | "login">("signup");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                email: email,
                password: password
            };

            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/auth/${state}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `${state === 'signup' ? 'Signup' : 'Login'} failed`);
            }

            if (data.token) {
                // Call onLogin to update parent state AND localStorage
                onLogin(data.token);
                toast.success(state === 'signup' ? 'Account created successfully!' : 'Welcome back!');
                navigate('/');
            }

        } catch (err) {
            toast.error(err instanceof Error ? err.message : `Error occurred while ${state === 'signup' ? 'signing up' : 'logging in'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {state === 'signup' ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-600">
                        {state === 'signup' ? 'Sign up to get started' : 'Sign in to your account'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Email Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Email Address
                            </label>
                            <input
                                className="border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl py-3.5 font-semibold transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {state === 'signup' ? 'Creating Account...' : 'Signing In...'}
                                </>
                            ) : (
                                state === 'signup' ? 'Sign Up' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer Link */}
                    <div className="mt-6 text-center text-sm text-gray-600">
                        {state === 'signup' ? (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={() => setState("login")}
                                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
                                    type="button"
                                >
                                    Sign In
                                </button>
                            </>
                        ) : (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => setState("signup")}
                                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
                                    type="button"
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Terms - Only show for signup */}
                {state === 'signup' && (
                    <p className="mt-6 text-center text-xs text-gray-500">
                        By signing up, you agree to our{' '}
                        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;