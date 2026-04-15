export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
      <div className="text-6xl mb-4">📶</div>
      <h1 className="text-2xl font-bold mb-2">Sin conexión</h1>
      <p className="text-muted-foreground text-center max-w-md">
        No tenés conexión a internet. Las operaciones pendientes se sincronizarán automáticamente cuando te reconectes.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
      >
        Reintentar
      </button>
    </div>
  )
}
