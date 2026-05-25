export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-5xl md:text-7xl mb-6">About Us</h1>
        <p className="text-foreground/70 text-lg md:text-xl font-sans tracking-wide">
          Nothingness is not a hotel chain. It is a curated emotional experience brand.
        </p>
      </div>

      <article className="prose prose-invert max-w-none prose-lg font-sans font-light leading-relaxed text-foreground/80">
        <p>
          Founded by Arsalan Azad, Nothingness was built for people who never belonged anywhere. 
          We believe that true luxury is found in privacy, aesthetics, intimacy, and alternative culture.
        </p>
        <p>
          Every property in our collection is more than just a place to sleep; it has a personality, 
          atmosphere, story, mood, and energy. We curate spaces that feel like a mix of an underground 
          art residency, an intimate members club, and an experimental hospitality brand.
        </p>
        <h2 className="font-serif text-3xl text-accent-gold mt-12 mb-6">Our Philosophy</h2>
        <p>
          We strip away the corporate, the templated, and the expected. There are no fake dashboards, 
          no artificial scarcity, and no generic layouts. Just raw, immersive environments designed for 
          creators, rebels, lovers, and visionaries.
        </p>
        <p>
          Step out of the noise. Enter a state of mind.
        </p>
      </article>
    </main>
  );
}
