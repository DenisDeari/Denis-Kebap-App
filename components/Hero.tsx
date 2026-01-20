"use client";

export default function Hero() {
  return (
    <section className="relative h-[46vh] md:h-[53vh] overflow-hidden">
      {/* Hintergrundbild - Holztisch mit Zutaten */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900">
        {/* Simuliertes Holztisch-Design mit CSS - Zutaten als dekorative Elemente */}
        <div className="absolute inset-0 opacity-40">
          {/* Kartoffeln */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-60 blur-sm"></div>
          <div className="absolute top-16 left-16 w-16 h-16 bg-yellow-300 rounded-full opacity-60 blur-sm"></div>
          
          {/* Tomaten */}
          <div className="absolute top-20 right-20 w-16 h-16 bg-red-500 rounded-full opacity-70 blur-sm"></div>
          <div className="absolute top-28 right-28 w-12 h-12 bg-red-600 rounded-full opacity-70 blur-sm"></div>
          
          {/* Basilikum/Grünzeug */}
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-600 rounded-full opacity-50 blur-sm"></div>
          <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-green-500 rounded-full opacity-50 blur-sm"></div>
          
          {/* Paprika */}
          <div className="absolute bottom-10 right-1/3 w-18 h-18 bg-orange-500 rounded-full opacity-60 blur-sm"></div>
          
          {/* Knoblauch */}
          <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-white rounded-full opacity-50 blur-sm"></div>
          <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-white rounded-full opacity-50 blur-sm ml-4"></div>
        </div>
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

