import { ArrowRight, Lock, TrendingUp, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "Franchise | Nothingness",
  description: "Join the Nothingness ecosystem. A culturally relevant, community-driven, disruptive hospitality brand.",
};

export default function FranchisePage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="mb-24 text-center">
        <span className="text-accent-gold text-sm font-semibold tracking-widest uppercase mb-4 block">
          Partnership Opportunity
        </span>
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight mb-6 text-foreground max-w-4xl mx-auto">
          Not just a franchise. <br className="hidden md:block"/> A cultural movement.
        </h1>
        <p className="text-foreground/70 max-w-2xl text-lg md:text-xl mx-auto leading-relaxed">
          Nothingness is a next-generation hospitality ecosystem built for the digital generation. 
          We are expanding our network of culturally relevant, community-driven, and highly disruptive experiential stays.
        </p>
      </div>

      {/* Why the brand works */}
      <section className="mb-32">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl mb-4 text-white">Why Nothingness Works</h2>
          <p className="text-foreground/70">Nothingness isn't following trends. It's setting them.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-surface-blur border border-border-subtle p-8 rounded-2xl">
            <Lock className="w-8 h-8 text-accent-gold mb-6" />
            <h3 className="text-lg font-medium text-white mb-3 tracking-wide">Privacy & Safety</h3>
            <p className="text-foreground/70 text-sm leading-relaxed">
              Designed for an absolute sense of safety and freedom, especially curated for women travelers.
            </p>
          </div>
          
          <div className="bg-surface-blur border border-border-subtle p-8 rounded-2xl">
            <Users className="w-8 h-8 text-accent-gold mb-6" />
            <h3 className="text-lg font-medium text-white mb-3 tracking-wide">Community Driven</h3>
            <p className="text-foreground/70 text-sm leading-relaxed">
              A deeply loyal, female-first community that chooses Nothingness time and time again.
            </p>
          </div>

          <div className="bg-surface-blur border border-border-subtle p-8 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-accent-gold mb-6" />
            <h3 className="text-lg font-medium text-white mb-3 tracking-wide">Internet-Native DNA</h3>
            <p className="text-foreground/70 text-sm leading-relaxed">
              Built natively for the digital generation with high visual recall and organic, viral reach.
            </p>
          </div>

          <div className="bg-surface-blur border border-border-subtle p-8 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-accent-gold mb-6" />
            <h3 className="text-lg font-medium text-white mb-3 tracking-wide">100% Organic Growth</h3>
            <p className="text-foreground/70 text-sm leading-relaxed">
              Zero paid promotions. Zero gimmicks. Scaled entirely on word-of-mouth and genuine love.
            </p>
          </div>
        </div>
      </section>

      {/* The Traction */}
      <section className="mb-32 border-t border-b border-border-subtle py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-serif text-4xl md:text-5xl text-white mb-2">3+</div>
            <div className="text-xs uppercase tracking-widest text-accent-gold font-semibold">Years Operations</div>
            <div className="text-foreground/60 text-xs mt-2">Consistent & Stable</div>
          </div>
          <div>
            <div className="font-serif text-4xl md:text-5xl text-white mb-2">5.0</div>
            <div className="text-xs uppercase tracking-widest text-accent-gold font-semibold">Airbnb Rating</div>
            <div className="text-foreground/60 text-xs mt-2">Hundreds of Reviews</div>
          </div>
          <div>
            <div className="font-serif text-4xl md:text-5xl text-white mb-2">Top 5%</div>
            <div className="text-xs uppercase tracking-widest text-accent-gold font-semibold">Airbnb Homes</div>
            <div className="text-foreground/60 text-xs mt-2">Elite Ranking</div>
          </div>
          <div>
            <div className="font-serif text-4xl md:text-5xl text-white mb-2">100%</div>
            <div className="text-xs uppercase tracking-widest text-accent-gold font-semibold">Organic Growth</div>
            <div className="text-foreground/60 text-xs mt-2">No Ads. Just Community.</div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center max-w-2xl mx-auto">
        <h2 className="font-serif text-4xl mb-6 text-white">Build the future of hospitality.</h2>
        <p className="text-foreground/70 mb-10 leading-relaxed">
          Nothingness is not for everyone. And that's exactly the point. We partner with visionaries who understand that true luxury is an emotional experience, not just a physical space.
        </p>
        <a 
          href="mailto:franchise@nothingness.asia" 
          className="inline-flex items-center px-10 py-4 bg-white text-black rounded-full font-medium tracking-wide hover:bg-accent-gold hover:text-white transition-colors"
        >
          Inquire About Franchising <ArrowRight className="ml-3 w-5 h-5" />
        </a>
      </section>
    </main>
  );
}
