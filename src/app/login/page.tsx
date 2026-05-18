"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error || !res.ok) {
        setError("Invalid email or password");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Unable to sign in right now. Check the deployed auth environment variables.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gray-900 p-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <Target className="h-12 w-12 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AtomQuest</h1>
          <p className="text-gray-400 mt-2">Goal Setting & Tracking Portal</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="employee@atomquest.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            
            <div className="text-sm text-gray-500 text-center mt-6">
              <p>Demo Accounts:</p>
              <ul className="mt-2 space-y-1">
                <li>employee@test.com / pass123</li>
                <li>manager@test.com / pass123</li>
                <li>admin@test.com / pass123</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
