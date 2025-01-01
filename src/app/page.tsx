import { MoleculeViewer } from '@/components/viewer/MoleculeViewer'

export default function Home() {
  return (
    <div className="w-full h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-4 bg-white">
        <h1 className="text-lg font-semibold">Molecule Viewer</h1>
      </header>
      <div className="flex-1 relative">
        <MoleculeViewer />
      </div>
    </div>
  )
}
