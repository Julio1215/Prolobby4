export default function TeamUpcomingGame({ teamA, logoA, teamB, logoB, date }) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3 bg-dark-secondary/30 rounded-lg border border-dark-border/40">
      
      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1 w-full min-w-0">
        {/* Time A */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          {teamA && (
            <span className="text-dark-text-1 text-xs sm:text-sm font-medium truncate text-right">
              {teamA}
            </span>
          )}
          <img 
            className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0" 
            src={logoA} 
            alt={teamA || "Time A"} 
          />
        </div>
        <div className="text-dark-text-3 font-light text-xs bg-dark-card px-2.5 py-0.5 rounded-full border border-dark-border/80 shrink-0">
          VS
        </div>

        {/* Time B */}
        <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
          <img 
            className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0" 
            src={logoB} 
            alt={teamB || "Time B"} 
          />
          {teamB && (
            <span className="text-dark-text-1 text-xs sm:text-sm font-medium truncate text-left">
              {teamB}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center shrink-0">
        <span className="text-xs sm:text-sm text-dark-text-2 bg-dark-card/50 px-2.5 py-1 rounded-md border border-dark-border whitespace-nowrap">
          {date}
        </span>
      </div>

    </div>
  );
}
