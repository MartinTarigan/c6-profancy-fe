"use client";

import Image from "next/image";

export default function LoadingIndicator() {
  return (
    <div className="flex justify-center items-center min-h-[95vh]">
      <div className="animate-pulse" style={{ animationDuration: "0.8s" }}>
        <Image
          src="/images/Mascott Tens@300x.png"
          alt="Tens Mascot"
          width={200}
          height={200}
          className="mb-6"
        />
      </div>
    </div>
  );
}
