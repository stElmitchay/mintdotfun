export default function Roadmap() {
  const milestones = [
    {
      date: "Q1 2025",
      title: "Platform Launch",
      description: "Launch MintAI beta with AI generation and Solana minting",
    },
    {
      date: "Q2 2025",
      title: "Multi-Model Support",
      description: "Add multiple AI models and advanced style controls",
    },
    {
      date: "Q3 2025",
      title: "Community & Marketplace",
      description: "Launch creator profiles, social features, and NFT marketplace",
    },
    {
      date: "Q4 2025",
      title: "Mobile & Multi-chain",
      description: "Launch mobile app and expand to multiple blockchains",
    },
  ];

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Our <span className="text-gradient">Roadmap</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Building the future of AI-powered NFT creation on Solana.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-primary via-accent-purple to-primary" />

          <div className="space-y-16">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`flex-1 ${
                    index % 2 === 0 ? "text-right" : "text-left"
                  }`}
                >
                  <div className="inline-block bg-dark-700/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition-all card-hover">
                    <div className="text-primary font-semibold mb-2">
                      {milestone.date}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {milestone.description}
                    </p>
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-neon relative z-10" />
                  <div className="absolute inset-0 w-8 h-8 -translate-x-2 -translate-y-2 rounded-full bg-primary/20 animate-ping" />
                </div>

                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
