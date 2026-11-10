export default function EventCard({ logo, title, tag, date }) {
  return (
    <div className="bg-dark-secondary/40 backdrop-blur-sm rounded-xl border border-dark-border/50 p-4 sm:p-5 min-h-[90px] flex items-center gap-3.5 sm:gap-4 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-950/20 w-full">
      <div className="shrink-0 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-dark-card/60 rounded-lg border border-dark-border/30 text-amber-400">
        <img src={logo} alt={title} className="w-full h-full object-contain p-1" />
      </div>

     
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-dark-text-1 font-semibold text-base sm:text-lg leading-tight tracking-wide truncate">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium">
          <span className="bg-dark-hover/50 text-dark-text-1 px-2 py-0.5 rounded border border-dark-border/30 uppercase tracking-wider shrink-0">
            {tag}
          </span>
          <span className="text-dark-text-2 truncate max-w-full">{date}</span>
        </div>
      </div>
    </div>
  );
}
