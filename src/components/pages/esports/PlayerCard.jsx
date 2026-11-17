export default function PlayerCard({ image, name, description }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-dark-secondary/60 border border-dark-border/50 rounded-xl aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110 hover:cursor-pointer"
        />
      </div>
      <div className="bg-dark-secondary/40 border border-dark-border rounded-xl p-3 text-center min-h-[100px] flex flex-col justify-center">
        <span className="font-bold text-purple-300 block text-sm">{name}</span>
        <span className="text-xs text-dark-text-2 mt-1">{description}</span>
      </div>
    </div>
  );
}
