import ConstructionCalculator from '@/components/calculator/ConstructionCalculator';

export default function Home() {
  return (
    <main className="flex-1 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-2">
            Duo Tax
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Free Construction Cost Calculator
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-500 max-w-2xl">
            Estimate the construction cost of your investment property using verified regional cost indices across all Australian states and territories.
          </p>
        </header>
        <ConstructionCalculator />
      </div>
    </main>
  );
}
