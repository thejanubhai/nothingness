export default function ContactPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-4 md:px-12 max-w-3xl mx-auto">
      <div className="mb-16 border-b border-border-subtle pb-10">
        <h1 className="font-serif text-5xl md:text-7xl mb-6">Inquiries</h1>
        <p className="text-foreground/70 text-lg md:text-xl font-sans tracking-wide">
          For collaborations, investment, or private access requests.
        </p>
      </div>

      <form className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="name" className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Name</label>
            <input 
              type="text" 
              id="name" 
              className="w-full bg-transparent border-b border-border-subtle text-foreground focus:outline-none focus:border-accent-gold pb-2 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              className="w-full bg-transparent border-b border-border-subtle text-foreground focus:outline-none focus:border-accent-gold pb-2 transition-colors"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Subject</label>
          <select id="subject" className="w-full bg-transparent border-b border-border-subtle text-foreground focus:outline-none focus:border-accent-gold pb-2 transition-colors appearance-none cursor-pointer">
            <option className="bg-background">General Inquiry</option>
            <option className="bg-background">Private Membership</option>
            <option className="bg-background">Press & Collab</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs uppercase tracking-widest text-accent-muted mb-2">Message</label>
          <textarea 
            id="message" 
            rows={5}
            className="w-full bg-transparent border-b border-border-subtle text-foreground focus:outline-none focus:border-accent-gold pb-2 transition-colors resize-none"
          ></textarea>
        </div>

        <button type="button" className="bg-foreground text-background px-10 py-4 rounded-full font-medium tracking-wide hover:bg-accent-muted transition-colors">
          Send Message
        </button>
      </form>
    </main>
  );
}
