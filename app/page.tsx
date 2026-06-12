import ConstructionCalculator from '@/components/calculator/ConstructionCalculator';

export default function Home() {
  return (
    <main className="flex-1 bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-2">
            Construction Finance Tools
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Construction Cost Calculator
          </h1>
          <p className="mt-3 text-base text-slate-500 max-w-2xl">
            Generate an indicative cost estimate for your investment property build.
            Estimates are based on current Australian quantity surveying benchmarks.
          </p>
        </header>
        <ConstructionCalculator />
      </div>
    </main>
  );
}
