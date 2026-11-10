export default function NewsArticle({ image, title, paragraphs }) {
  return (
    <article className="max-w-5xl mx-auto flex flex-col md:flex-row py-6 md:py-10 gap-6 border-b border-dark-border last:border-b-0 px-4 md:px-0">
      
      <div className="w-full md:w-1/2 shrink-0">
        <img 
          src={image} 
          alt={title} 
          className="rounded-xl border border-dark-border/50 w-full h-56 sm:h-72 md:h-full max-h-80 object-cover" 
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-text-1 leading-tight">
            {title}
          </h2>
          
          <div className="text-dark-text-2 text-sm sm:text-base space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i}>
                {p}
              </p>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <button className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 px-5 py-2.5 rounded-lg transition-colors cursor-pointer text-sm font-medium text-white text-center">
            Saiba mais
          </button>
        </div>
      </div>
    </article>
  );
}
