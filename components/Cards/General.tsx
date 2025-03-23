'use client';

import Image from "next/image";

export default function DashboardBarista() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
      <Image
        src="/images/Mascott Tens@300x.png"
        alt="Tens Mascot"
        width={300}
        height={300}
        className="mb-6"
      />
      <h1 className="text-4xl font-bold text-gray-700">To Be Developed</h1>
    </div>
  );
}
