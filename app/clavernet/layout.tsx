import { ReactNode } from "react"

export default function ClavernetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Claver<span className="text-blue-600">net</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="/clavernet" className="hover:text-blue-600">Inicio</a>
            <a href="/clavernet/docs" className="hover:text-blue-600">Documentación</a>
            <a href="/clavernet/marketplace" className="hover:text-blue-600">Marketplace Interno</a>
            <a href="/clavernet/dashboard" className="hover:text-blue-600">Portal de Afiliados</a>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <p>© {new Date().getFullYear()} Clavernet. La red de distribución de software B2B más grande.</p>
      </footer>
    </div>
  )
}
