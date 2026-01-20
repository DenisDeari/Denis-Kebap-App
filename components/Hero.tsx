"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-[46vh] md:h-[53vh] overflow-hidden">
      {/* Hintergrundbild - Kebap Bild */}
      <div className="absolute inset-0">
        <Image
          src="/pics/Kebapbild.jpeg"
          alt="Denis Kebap"
          fill
          className="object-cover"
          priority
        />
        {/* Dunkler Overlay für bessere Logo-Lesbarkeit */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Logo zentriert */}
      <div className="relative h-full flex items-center justify-center">
        <div className="bg-black rounded-full p-8 md:p-12 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <h1 className="text-white text-3xl md:text-5xl font-bold text-center whitespace-nowrap tracking-tight">
            DENIS
            <br />
            KEBAP
          </h1>
        </div>
      </div>
    </section>
  );
}

