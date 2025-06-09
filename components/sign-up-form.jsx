// components/sign-up-form.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const supabase = createClient();

  export function SignUpForm({ className, ...props }) {
    const [formData, setFormData] = useState({
      email: "",
      password: "",
      repeatPassword: "",
      username: "",
      role: ""
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (error) setError(null);
    };
  
    const validateForm = () => {
      const { username, email, password, repeatPassword, role } = formData;
      if (!username || !email || !password || !repeatPassword || !role) {
        return "All fields are required";
      }
      if (password !== repeatPassword) {
        return "Passwords do not match";
      }
      return null;
    };
    
    const handleSignUp = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
    
      try {
        const validationError = validateForm();
        if (validationError) throw new Error(validationError);
    
        const { email, password, username, role } = formData;
    
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/protected`,
            data: { username },
          },
        });
    
        if (signUpError) {
          console.error("Supabase signUpError:", signUpError, signUpError.details);
          throw signUpError;
        }
    
        if (!authData || !authData.user) {
          throw new Error("User signup data is missing.");
        }
    
        const { error: insertError } = await supabase
          .from("USER")
          .insert({ 
            auth_user_id: authData.user.id, 
            username, 
            role,
            password
          })
    
        if (insertError) {
          console.error("Supabase insert error:", insertError);
          throw insertError;
        }
    
        router.push("/auth/sign-up-success");
      } catch (err) {
        console.error("Signup error:", err);
        setError(err.message || "Signup failed");
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} noValidate className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Your username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters with 1 uppercase letter and 1 number
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="repeatPassword">Repeat Password</Label>
              <Input
                id="repeatPassword"
                name="repeatPassword"
                type="password"
                value={formData.repeatPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="CHEF"
                    checked={formData.role === "CHEF"}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-4 w-4"
                  />
                  <span>Chef</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="role"
                    value="STUDENT"
                    checked={formData.role === "STUDENT"}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-4 w-4"
                  />
                  <span>Student</span>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
