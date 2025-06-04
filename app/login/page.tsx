/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Toast from "@/components/Toast";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

// Password input component with show/hide toggle
function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        <Lock className="h-5 w-5" />
      </div>
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={`w-full h-14 pl-10 pr-10 border border-[#d9d9d9] rounded-md ${
          props.className || ""
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // Form mode state
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(true);
  const [newUserStep, setNewUserStep] = useState<"initial" | "setPassword">(
    "initial"
  );

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // New user form state
  const [newUsername, setNewUsername] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("");
  const [combination, setCombination] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(false);

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();

      if (res.ok) {
        const token = result.data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);

        const jwtPayload = parseJwt(token);
        if (jwtPayload && jwtPayload.roles) {
          const cleanedRoles = jwtPayload.roles.map((role: string) =>
            role.replace("ROLE_", "")
          );
          if (cleanedRoles.length === 1) {
            localStorage.setItem("roles", cleanedRoles[0]);
          } else {
            localStorage.setItem("roles", JSON.stringify(cleanedRoles));
          }
        }
        router.push("/");
      } else {
        setToast({ type: "error", message: result.message });
      }
    } catch (error) {
      setToast({ type: "error", message: "Failed to connect to server" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle verification of username, default password, and combination
  const handleVerifyCombination = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      // First check if username exists and is not verified
      const checkRes = await fetch(
        "http://localhost:8080/api/auth/check-username",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: newUsername }),
        }
      );
      const checkResult = await checkRes.json();

      if (!checkRes.ok) {
        setToast({ type: "error", message: checkResult.message });
        setIsVerifying(false);
        return;
      }

      // Verify if user is unverified
      if (checkResult.data.isVerified) {
        setToast({
          type: "error",
          message:
            "This account is already verified. Please use the login form.",
        });
        setIsVerifying(false);
        return;
      }

      // Verify default password
      if (defaultPassword !== "newuser123") {
        setToast({
          type: "error",
          message: "Default password is incorrect. Please use 'newuser123'",
        });
        setIsVerifying(false);
        return;
      }

      // If all checks pass, move to the next step
      setNewUserStep("setPassword");
      setToast({
        type: "success",
        message: "Verification successful! Please set your new password.",
      });
    } catch (error) {
      setToast({ type: "error", message: "Failed to connect to server" });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle setting new password
  const handleSetNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      // Change password
      const changeRes = await fetch(
        `http://localhost:8080/api/account/change-password?username=${newUsername}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            combination,
            newPassword,
          }),
        }
      );
      const changeResult = await changeRes.json();

      if (changeRes.ok) {
        setToast({
          type: "success",
          message: "Password changed successfully! You can now login.",
        });
        // Reset form and switch to login mode
        setNewUsername("");
        setDefaultPassword("");
        setCombination("");
        setNewPassword("");
        setNewUserStep("initial");
        setIsLoginMode(true);
      } else {
        setToast({ type: "error", message: changeResult.message });
      }
    } catch (error) {
      setToast({ type: "error", message: "Failed to connect to server" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleMode = () => {
    if (animationComplete) {
      setAnimationComplete(false);
      setIsLoginMode(!isLoginMode);
      // Reset new user form state when switching modes
      if (!isLoginMode) {
        setNewUserStep("initial");
        setNewUsername("");
        setDefaultPassword("");
        setCombination("");
        setNewPassword("");
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      {/* Logo Section */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-white">
        <Image
          className="dark:invert"
          src="/images/login_logo.png"
          alt="Logo"
          width={500}
          height={500}
          priority
        />
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8f9fa] to-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#3c67ff]">
              Barista Management System
            </h2>
            <p className="text-gray-600 mt-2">
              {isLoginMode
                ? "Welcome back! Please sign in to continue."
                : "New here? Set up your account to get started."}
            </p>
          </div>

          <div className="relative" style={{ minHeight: "380px" }}>
            <AnimatePresence
              initial={false}
              mode="wait"
              onExitComplete={() => setAnimationComplete(true)}
            >
              {isLoginMode ? (
                <motion.div
                  key="login"
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full"
                >
                  <form
                    onSubmit={handleLogin}
                    className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                  >
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-[#3b5694] text-lg mb-2"
                      >
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <User className="h-5 w-5" />
                        </div>
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          required
                          className="w-full h-14 pl-10 border border-[#d9d9d9] rounded-md"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      <p className="text-sm text-blue-500 mt-1">
                        nama_depan.nama_belakang
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-[#3b5694] text-lg mb-2"
                      >
                        Password
                      </label>
                      <PasswordInput
                        id="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-[#3c67ff] focus:ring-[#3c67ff] border-gray-300 rounded"
                        />
                        <label
                          htmlFor="remember-me"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Remember me
                        </label>
                      </div>
                      <div className="text-sm">
                        <Link
                          href="#"
                          className="text-[#3c67ff] hover:text-[#3b5694]"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 bg-[#3c67ff] hover:bg-[#3b5694] text-white text-lg font-medium rounded-md"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <p className="text-gray-600">
                        New here?{" "}
                        <button
                          type="button"
                          onClick={toggleMode}
                          className="text-[#3c67ff] hover:text-[#3b5694] font-medium hover:underline focus:outline-none"
                        >
                          Create an account
                        </button>
                      </p>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full"
                >
                  {newUserStep === "initial" ? (
                    <form
                      onSubmit={handleVerifyCombination}
                      className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    >
                      <div>
                        <label
                          htmlFor="newUsername"
                          className="block text-[#3b5694] text-lg mb-2"
                        >
                          Username
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            <User className="h-5 w-5" />
                          </div>
                          <Input
                            id="newUsername"
                            name="newUsername"
                            type="text"
                            required
                            className="w-full h-14 pl-10 border border-[#d9d9d9] rounded-md"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-blue-500 mt-1">
                          nama_depan.nama_belakang
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="defaultPassword"
                          className="block text-[#3b5694] text-lg mb-2"
                        >
                          Default Password
                        </label>
                        <PasswordInput
                          id="defaultPassword"
                          name="defaultPassword"
                          required
                          value={defaultPassword}
                          onChange={(e) => setDefaultPassword(e.target.value)}
                        />
                        <p className="text-sm text-blue-500 mt-1">
                          Masukkan &quot;newuser123&quot;
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="combination"
                          className="block text-[#3b5694] text-lg mb-2"
                        >
                          Kombinasi (username@noHP)
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            <Mail className="h-5 w-5" />
                          </div>
                          <Input
                            id="combination"
                            name="combination"
                            type="text"
                            required
                            className="w-full h-14 pl-10 border border-[#d9d9d9] rounded-md"
                            value={combination}
                            onChange={(e) => setCombination(e.target.value)}
                            placeholder={`${
                              newUsername ? newUsername : "username"
                            }@... (tanpa +62)`}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 bg-[#3c67ff] hover:bg-[#3b5694] text-white text-lg font-medium rounded-md"
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span>Continue</span>
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </div>
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <p className="text-gray-600">
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={toggleMode}
                            className="text-[#3c67ff] hover:text-[#3b5694] font-medium hover:underline focus:outline-none"
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleSetNewPassword}
                      className="space-y-5 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    >
                      <div>
                        <label
                          htmlFor="newUsername"
                          className="block text-[#3b5694] text-lg mb-2"
                        >
                          Username
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            <User className="h-5 w-5" />
                          </div>
                          <Input
                            id="newUsername"
                            name="newUsername"
                            type="text"
                            required
                            className="w-full h-14 pl-10 border border-[#d9d9d9] rounded-md bg-gray-50"
                            value={newUsername}
                            disabled
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="defaultPassword"
                          className="block text-[#3b5694] text-lg mb-2"
                        >
                          Default Password
                        </label>
                        <PasswordInput
                          id="defaultPassword"
                          name="defaultPassword"
                          required
                          value={defaultPassword}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="newPassword"
                          className="block text-[#3b5694] text-lg mb-2"
                        >
                          Password Baru
                        </label>
                        <PasswordInput
                          id="newPassword"
                          name="newPassword"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 bg-[#3c67ff] hover:bg-[#3b5694] text-white text-lg font-medium rounded-md"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <p className="text-gray-600">
                          Already have an account?{" "}
                          <button
                            type="button"
                            onClick={toggleMode}
                            className="text-[#3c67ff] hover:text-[#3b5694] font-medium hover:underline focus:outline-none"
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center text-sm text-[#3b5694] mt-8">
            ©All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}
