"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type StepType = "checkUsername" | "defaultPassword" | "login" | "changePassword";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [combination, setCombination] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [step, setStep] = useState<StepType>("checkUsername");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    switch (step) {
      case "checkUsername":
        try {
          const res = await fetch("http://localhost:8080/api/auth/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
          const result = await res.json();
          if (res.ok) {
            if (result.data.isVerified) {
              
              setStep("login");
            } else {
              
              setStep("defaultPassword");
            }
          } else {
            alert(result.message);
          }
        } catch (err) {
          console.error("Error checking username:", err);
        }
        break;

      case "defaultPassword":
        
        if (password === "newuser123") {
          setStep("changePassword");
          setPassword(""); 
        } else {
          alert("Default password tidak sesuai.");
        }
        break;

      case "login":
        
        try {
          const res = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const result = await res.json();
          if (res.ok) {
            localStorage.setItem("token", result.data.token);
            router.push("/");
          } else {
            alert(result.message);
          }
        } catch (err) {
          console.error("Error during login:", err);
        }
        break;

      case "changePassword":
        
        try {
          const res = await fetch(`http://localhost:8080/api/account/change-password?username=${username}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              combination,
              newPassword,
            }),
          });
          const result = await res.json();
          if (res.ok) {
            alert(result.message);
            setStep("checkUsername");
            setUsername("");
            setPassword("");
            setCombination("");
            setNewPassword("");
          } else {
            alert(result.message);
          }
        } catch (err) {
          console.error("Error changing password:", err);
        }
        break;

      default:
        break;
    }
  };

  
  const handleForgotPassword = () => {
    if (!username) {
      alert("Harap masukkan username terlebih dahulu.");
      return;
    }
    setStep("changePassword");
  };

  return (
    <div className="flex min-h-screen w-full">
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

      {/* Login Form Section */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#3c67ff]">Barista Management System</h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Field Username selalu tampil.
                Jika step "checkUsername", username di-enable. Jika tidak, di-disable */}
            <div>
              <label htmlFor="username" className="block text-[#3b5694] text-lg mb-2">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={step !== "checkUsername"}
              />
              <p className="text-sm text-blue-500">nama_depan.nama_belakang</p>
            </div>

            {/* Field tambahan sesuai step */}
            {step === "defaultPassword" && (
              <div>
                <label htmlFor="password" className="block text-[#3b5694] text-lg mb-2">
                  Default Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-sm text-blue-500">Masukkan "newuser123"</p>
              </div>
            )}

            {step === "login" && (
              <div>
                <label htmlFor="password" className="block text-[#3b5694] text-lg mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {step === "changePassword" && (
              <>
                <div>
                  <label htmlFor="combination" className="block text-[#3b5694] text-lg mb-2">
                    Kombinasi (username@noHP)
                  </label>
                  <Input
                    id="combination"
                    name="combination"
                    type="text"
                    required
                    className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                    value={combination}
                    onChange={(e) => setCombination(e.target.value)}
                    placeholder={`${username}@... (tanpa +62)`}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-[#3b5694] text-lg mb-2">
                    Password Baru
                  </label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Button
                type="submit"
                className="w-full h-14 bg-[#3c67ff] hover:bg-[#3b5694] text-white text-lg font-medium rounded-md"
              >
                {step === "checkUsername"
                  ? "Continue"
                  : step === "defaultPassword"
                  ? "Login"
                  : step === "login"
                  ? "Login"
                  : "Ganti Password"}
              </Button>
            </div>
          </form>

          {/* Tampilkan link "Forgot Password?" hanya jika step bukan "changePassword" */}
          {step !== "changePassword" && (
            <div className="text-center">
              <Link
                href="#"
                className="text-[#3b5694] hover:text-[#3c67ff] text-base"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <div className="text-center text-sm text-[#3b5694] mt-8">©All rights reserved</div>
        </div>
      </div>
    </div>
  );
}
