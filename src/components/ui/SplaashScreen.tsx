'use client';

import React, { useState, useEffect } from "react";

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 px-4 ">
      {/* Logo */}
      <img
        src="/images/final2-Photoroom.png"
        alt="KSC Logo"
        className="w-40 sm:w-56 md:w-72 object-contain animate-fade-in"
      />

      {/* Typing Heading */}
      <h1 className="text-4xl md:text-6xl font-extrabold ">
        <TypingText text="Welcome to KSC" />
      </h1>

      {/* Loading Spinner */}
      <div className="mt-6">
        <LoadingSpinner />
      </div>
    </div>
  );
}

function TypingText({ text, speed = 150 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index === text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      <span className="ml-1  animate-pulse">|</span>
    </span>
  );
}

// Loading spinner component
function LoadingSpinner() {
  return (
<div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-interactiveSpin hover-grow" />
  );
}
