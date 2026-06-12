import ConstructionCalculator from '@/components/calculator/ConstructionCalculator';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Free Construction Cost Calculator</h1>
      <p>Estimate the construction cost of your investment property.</p>
      <ConstructionCalculator />
    </main>
  );
}
