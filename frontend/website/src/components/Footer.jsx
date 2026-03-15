export default function Footer(){
    return(
        <>
        <footer className="bg-[#0a0a0a] text-[#f0ede8] px-8 pb-12  mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-[rgba(240,237,232,0.06)] mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full border border-[#d4af82] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4af82]" />
              </div>
              <span className="df text-lg tracking-widest">SALON</span>
            </div>
            <p className="text-[rgba(240,237,232,0.3)] text-xs leading-relaxed">Premium salon services crafted with care, creativity, and intention.</p>
          </div>
          {[
            { title: "Services", links: ["Haircut", "Color", "Bridal", "Keratin", "Scalp Ritual"] },
            { title: "Studio", links: ["About Us", "Meet the Team", "Gallery", "Press"] },
            { title: "Contact", links: ["+91 98765 43210", "hello@lumiere.in", "Aurangabad, MH", "Mon–Sat 10–8 PM"] },
          ].map((col, i) => (
            <div key={i}>
              <div className="text-[10px] tracking-[0.2em] text-[#d4af82] uppercase mb-5 font-semibold">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={j} className="text-[rgba(240,237,232,0.35)] text-xs hover:text-[#d4af82] cursor-pointer transition-colors">{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-[rgba(240,237,232,0.05)]">
          <span className="text-[rgba(240,237,232,0.2)] text-xs">© 2025 Lumière Salon. All rights reserved.</span>
          <div className="flex gap-6">
            {["Instagram", "Facebook", "YouTube"].map(s => (
              <span key={s} className="text-[rgba(240,237,232,0.2)] text-xs hover:text-[#d4af82] cursor-pointer transition-colors">{s}</span>
            ))}
          </div>
        </div>
      </footer>
        </>
    )
}