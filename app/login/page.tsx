"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DecodedToken {
  sub: string;
  userId: string;
  username: string;
  roles: string[];
  email?: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        console.error("Login failed");
        return;
      }

      const result = await response.json();
      const token = result?.data?.token;
      if (!token) {
        console.error("Token not found in response");
        return;
      }

      localStorage.setItem("token", token);

      const decoded: DecodedToken = jwtDecode(token);
      localStorage.setItem("userid", decoded.userId);
      localStorage.setItem("username", decoded.username);
      localStorage.setItem("email", decoded.sub);
      localStorage.setItem("role", decoded.roles?.[0].replace("ROLE_", "") || "USER");

      router.push("/");
    } catch (err) {
      console.error("Error during login:", err);
    }
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
          height={0}
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
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-[#3b5694] text-lg mb-2">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md focus:border-[#3c67ff] focus:ring-[#3c67ff]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[#3b5694] text-lg mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-14 px-4 border border-[#d9d9d9] rounded-md focus:border-[#3c67ff] focus:ring-[#3c67ff]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full h-14 bg-[#3c67ff] hover:bg-[#3b5694] text-white text-lg font-medium rounded-md"
              >
                Login
              </Button>
            </div>

            <div className="text-center">
              <Link href="#" className="text-[#3b5694] hover:text-[#3c67ff] text-base">
                Forgot Password?
              </Link>
            </div>
          </form>

          <div className="text-center text-sm text-[#3b5694] mt-8">©All rights reserved</div>
        </div>
      </div>
    </div>
  );
}
