export default function MatchCard({ time, teamA, logoA, teamB, logoB, tournament, format }) {
  return (
    <div className="bg-dark-secondary/40 backdrop-blur-sm rounded-xl border border-dark-border/50 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-950/20 w-full">
      {/* Corpo principal do card */}
      <div className="flex flex-col sm:flex-row items-center p-4 sm:px-6 sm:py-5 text-base sm:text-lg font-semibold gap-3 sm:gap-4">
        
        <div className="flex items-center gap-1.5 text-sm sm:text-base md:text-xl text-purple-400 font-medium shrink-0">
          <i className="bi bi-clock text-xs sm:text-sm opacity-70"></i>
          <span>{time}</span>
        </div>

       
        <div className="w-full h-px bg-dark-hover/40 sm:hidden" />

    
        <div className="flex-1 w-full flex justify-between sm:justify-center items-center gap-2 sm:gap-4 min-w-0">
          
          {/* Time A */}
          <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 min-w-0">
            <span className="tracking-wide text-right truncate text-sm sm:text-base">{teamA}</span>
            <img className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0" src={logoA} alt={teamA} />
          </div>

  
          <div className="text-dark-text-3 font-light text-xs sm:text-sm bg-dark-card px-2 sm:px-2.5 py-0.5 rounded-full border border-dark-border shrink-0">
            VS
          </div>

          {/* Time B */}
          <div className="flex-1 flex items-center justify-start gap-2 sm:gap-3 min-w-0">
            <img className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0" src={logoB} alt={teamB} />
            <span className="tracking-wide text-left truncate text-sm sm:text-base">{teamB}</span>
          </div>

        </div>
      </div>

      <div className="bg-dark-card/60 border-t border-dark-border/30 flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 text-xs text-dark-text-2 uppercase tracking-wider gap-2">
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <i className="bi bi-trophy text-purple-400 shrink-0"></i>
          <span className="truncate">{tournament}</span>
        </div>
        <div className="font-medium text-purple-300 shrink-0">{format}</div>
      </div>
    </div>
  );
}
