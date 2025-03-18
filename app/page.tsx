"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import General from "@/components/Cards/General";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, []);
  return (
    <div className="grid grid-cols-2">
      <General />
    </div>
  );
}
