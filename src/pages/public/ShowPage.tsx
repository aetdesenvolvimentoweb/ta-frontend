import { useParams } from 'react-router-dom'

export default function ShowPage() {
  const { showId } = useParams<{ showId: string }>()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4">
      <p className="text-zinc-400 text-sm">Show: {showId}</p>
    </main>
  )
}
