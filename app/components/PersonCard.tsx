
export default function PersonCard({ name }: { name: string }) {
  return (
    <div className="
    w-48
    rounded-2x1
    border
    border-zinc-700
    bg-zinc-800
    p-4
    shadow-x1
    transition-all
    hover:scale-105
    hover:border-orange-500
    hover:shadow-lg
    hover:shadow-orange-500/20">
      <div className="h-16 w-16 rounded-full bg-zinc-600"></div>
      <h2 className="mt-4 text-x1 text-white">{name}</h2>
    </div>
  )
}