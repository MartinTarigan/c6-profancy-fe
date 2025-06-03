"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

const cheerfulQuotes = [
  "Brewing something amazing for you! ☕",
  "Great coffee is worth the wait! ✨",
  "Your perfect cup is almost ready! 🎯",
  "Crafting your coffee with love! ❤️",
  "Good things come to those who wait! 🌟",
  "Almost there... perfection takes time! ⏰",
  "Your barista is working their magic! 🪄",
  "Fresh coffee coming right up! 🔥",
  "Quality over speed - always! 👌",
  "The best brews are worth waiting for! 🏆",
  "Patience makes the coffee taste better! 😊",
  "Your coffee adventure begins soon! 🚀",
  "Handcrafted with care, just for you! 🤲",
  "Every great cup starts with a moment! ⭐",
  "Coffee perfection is in progress! 💫",
]

export default function LoadingIndicator() {
  const [currentQuote, setCurrentQuote] = useState(0)
  const [fadeClass, setFadeClass] = useState("opacity-100")

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("opacity-0")

      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % cheerfulQuotes.length)
        setFadeClass("opacity-100")
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col justify-center items-center min-h-[95vh] bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      {/* Main loading container */}
      <div className="text-center space-y-8">
        {/* Mascot with enhanced animation */}
        <div className="relative">
          <div
            className="animate-pulse rounded-full p-4"
            style={{
              animationDuration: "1.5s",
              backgroundColor: "rgba(60, 103, 255, 0.1)",
            }}
          >
            <Image
              src="/images/Mascott Tens@300x.png"
              alt="Tens Mascot"
              width={200}
              height={200}
              className="drop-shadow-lg"
            />
          </div>

          {/* Floating coffee beans animation */}
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: "0.5s" }}>
            ☕
          </div>
          <div className="absolute -bottom-2 -left-2 text-xl animate-bounce" style={{ animationDelay: "1s" }}>
            ✨
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-wide" style={{ color: "#3c67ff" }}>
            Preparing Your Order
          </h2>

          {/* Animated quote */}
          <div className="h-16 flex items-center justify-center">
            <p
              className={`text-lg font-medium transition-opacity duration-300 max-w-md text-center ${fadeClass}`}
              style={{ color: "#3c67ff" }}
            >
              {cheerfulQuotes[currentQuote]}
            </p>
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full animate-pulse"
              style={{
                backgroundColor: "#3c67ff",
                animation: "loading-bar 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex space-x-2 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-bounce"
              style={{
                backgroundColor: "#3c67ff",
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0%, 100% { width: 0%; }
          50% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
