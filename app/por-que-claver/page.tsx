/**
 * Landing Page: Por qué Claver (Manifiesto & Convicción)
 * Route: /por-que-claver
 *
 * Tono épico, directo, rioplatense, sin humo.
 * Destinado a founders de oficios y comercios con una idea y convicción.
 */
"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Mic, 
  FileText, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Gamepad2,
  Sparkles,
  Users,
  Building2,
  HelpCircle,
  XCircle,
  Clock
} from "lucide-react"

export default function PorQueClaverPage() {
  const [selectedAudio, setSelectedAudio] = useState<number>(0)
  const [simulating, setSimulating] = useState(false)
  const [showResult, setShowResult] = useState(true)

  const audioExamples = [
    {
      title: "Plomería & Gas",
      rubro: "Instalador matriculado",
      audioText: '"Hola Leo, armame presupuesto para cambio de termotanque 80L en Belgrano. Incluye desmonte del viejo, flexibles de acero inoxidable, válvula de seguridad y mano de obra completa."',
      básico: {
        titulo: "Básico — Solo Mano de Obra",
        items: ["Desmonte de termotanque existente", "Instalación y conexión hidráulica básica", "Prueba de hermeticidad y encendido"],
        precio: "$65.000",
        seña: "$20.000",
      },
      recomendado: {
        titulo: "Recomendado — Con Materiales de Primera",
        items: ["Mano de obra completa + desmonte", "Flexibles acero inox mallados 3/4\"", "Válvula de alivio de presión nueva", "Filtro antisarro magnético", "Garantía escrita 6 meses"],
        precio: "$125.000",
        seña: "$45.000",
        destacado: true,
      },
      premium: {
        titulo: "Premium — Llave en Mano + Mantenimiento",
        items: ["Todo lo del plan Recomendado", "Retiro y disposición ecológica del equipo viejo", "Revisión completa de cañerías del departamento", "Service preventivo bonificado a los 12 meses"],
        precio: "$175.000",
        seña: "$60.000",
      },
    },
    {
      title: "Electricidad de Obra",
      rubro: "Electricista industrial",
      audioText: '"Leo, cotizá cableado de nuevo taller en Munro: 4 circuitos monofásicos, térmicas Schneider, disyuntor tetrapolar y puesta a tierra con jabalina."',
      básico: {
        titulo: "Básico — Tablero Principal",
        items: ["Armado de tablero 12 bocas", "Instalación de disyuntor y 4 térmicas", "Prueba de disparo"],
        precio: "$110.000",
        seña: "$40.000",
      },
      recomendado: {
        titulo: "Recomendado — Tablero + Jabalina + Certificado",
        items: ["Mano de obra tablero completo", "Clavado de jabalina con medición de telurímetro", "Térmicas y disyuntor Schneider incluidos", "Certificado de aptitud eléctrica DCI"],
        precio: "$240.000",
        seña: "$90.000",
        destacado: true,
      },
      premium: {
        titulo: "Premium — Instalación Integral Reforzada",
        items: ["Todo lo Recomendado", "Canalización completa en caño galvanizado", "Protector de sobretensión monofásico/trifásico", "Plano unifilar firmado"],
        precio: "$380.000",
        seña: "$150.000",
      },
    },
    {
      title: "Comercio / Kiosco",
      rubro: "Almacén de barrio",
      audioText: '"Anotame que Don Carlos de la esquina se lleva 2 packs de gaseosa, 3 aceites y 1kg de queso. Que le mande el recordatorio con link de pago el viernes."',
      básico: {
        titulo: "Registro en Libreta Digital",
        items: ["Imputación a cuenta corriente Don Carlos", "Stock descontado del inventario", "Saldo acumulado actualizado"],
        precio: "$18.400",
        seña: "Saldo $42.100",
      },
      recomendado: {
        titulo: "Aviso WhatsApp con Link Mercado Pago",
        items: ["Notificación cordial automática por WhatsApp", "Botón directo de pago QR / Transferencia", "Conciliación automática al acreditarse"],
        precio: "$18.400",
        seña: "Link Enviado",
        destacado: true,
      },
      premium: {
        titulo: "Factura AFIP al Pago",
        items: ["Todo lo anterior", "Generación automática de Factura B al pagar", "Envío de comprobante PDF al cliente"],
        precio: "$18.400",
        seña: "Auto-CAE",
      },
    },
  ]

  const currentSample = audioExamples[selectedAudio]

  function handleSimulate() {
    setSimulating(true)
    setShowResult(false)
    setTimeout(() => {
      setSimulating(false)
      setShowResult(true)
    }, 900)
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* ─── Top Bar ─────────────────────────────────────────────────── */}
      <nav className="border-b border-slate-800/80 bg-[#0b0e17]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-cyan-500/20">
                C
              </span>
              <span>CLAVER</span>
            </Link>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              Manifiesto 2026
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/campus"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Campus 2D</span>
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/25 transition"
            >
              Empezar 14 días gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <header className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Para el que tiene una idea y no la suelta</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Dejá de perder trabajos por <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
            cotizar en un audio y cobrar en un cuaderno.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          Claver transforma tus audios de WhatsApp en <strong className="text-white">presupuestos profesionales en 3 niveles</strong>, 
          cobra señas automáticas con <strong className="text-white">Mercado Pago</strong> y factura en <strong className="text-white">AFIP</strong> sin que pierdas el día en la computadora.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-base shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition"
          >
            <span>Probar Claver Gratis por 14 Días</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/campus"
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base flex items-center justify-center gap-2 transition"
          >
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <span>Ver Cuadrilla en Campus 2D</span>
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-4 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sin tarjeta de crédito · Activación en 2 minutos · 100% Argentino
        </p>
      </header>

      {/* ─── Interactive Voice-to-Quote Simulator ──────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Simulador en Vivo</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              De audio de WhatsApp a 3 opciones cobradas
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Elegí un rubro y mirá cómo el agente Leo genera la cotización estructurada con link de seña en segundos:
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {audioExamples.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedAudio(idx)
                  handleSimulate()
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${
                  selectedAudio === idx
                    ? "bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <span>{ex.title}</span>
                <span className="opacity-70 text-[10px]">({ex.rubro})</span>
              </button>
            ))}
          </div>

          {/* Audio player simulator */}
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
              <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Audio de WhatsApp recibido (0:22)</span>
            </div>
            <p className="text-sm text-slate-300 italic bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
              {currentSample.audioText}
            </p>
          </div>

          {/* Result: 3 levels */}
          {simulating ? (
            <div className="py-16 text-center text-cyan-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Leo está calculando materiales, mano de obra y armando el PDF...</p>
            </div>
          ) : showResult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Básico */}
              <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-1">Nivel 1</div>
                  <h3 className="text-base font-bold text-white mb-3">{currentSample.básico.titulo}</h3>
                  <ul className="space-y-2 text-xs text-slate-300 mb-6">
                    {currentSample.básico.items.map((it, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Total</div>
                    <div className="text-lg font-black text-white">{currentSample.básico.precio}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Seña MP</div>
                    <div className="text-xs font-bold text-cyan-400">{currentSample.básico.seña}</div>
                  </div>
                </div>
              </div>

              {/* Recomendado */}
              <div className="bg-gradient-to-b from-cyan-950/40 to-slate-950 rounded-2xl p-5 border-2 border-cyan-500/80 shadow-xl shadow-cyan-500/10 flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                  Más Elegido
                </div>
                <div>
                  <div className="text-xs text-cyan-400 font-semibold mb-1">Nivel 2</div>
                  <h3 className="text-base font-bold text-white mb-3">{currentSample.recomendado.titulo}</h3>
                  <ul className="space-y-2 text-xs text-slate-200 mb-6">
                    {currentSample.recomendado.items.map((it, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-cyan-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                    <div className="text-xl font-black text-white">{currentSample.recomendado.precio}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Seña MP</div>
                    <div className="text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-1 rounded-md border border-cyan-800">
                      {currentSample.recomendado.seña}
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium */}
              <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-1">Nivel 3</div>
                  <h3 className="text-base font-bold text-white mb-3">{currentSample.premium.titulo}</h3>
                  <ul className="space-y-2 text-xs text-slate-300 mb-6">
                    {currentSample.premium.items.map((it, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Total</div>
                    <div className="text-lg font-black text-white">{currentSample.premium.precio}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Seña MP</div>
                    <div className="text-xs font-bold text-blue-400">{currentSample.premium.seña}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ─── The 3 Real Pains ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">La Realidad de la Calle</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
            Tres lugares donde se te escapa la plata todos los meses
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pain 1 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. El agujero negro del audio</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Escuchás el pedido del cliente mientras manejás. Decís &ldquo;después llego y le cotizo&rdquo;. Te olvidaste. Perdiste un laburo de $180.000.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-400">
              <strong>Con Claver:</strong> Reenviás el audio y sale el PDF en 3 niveles con tus precios antes de apagar el motor.
            </div>
          </div>

          {/* Pain 2 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Poner plata de tu bolsillo</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Comprás los materiales de la obra con tus ahorros porque te dio vergüenza pedir seña, o anotás en la libreta y a fin de mes nadie te paga.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-400">
              <strong>Con Claver:</strong> Cada presupuesto incluye botón de seña por Mercado Pago. El trabajo se agenda al cobrar.
            </div>
          </div>

          {/* Pain 3 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 mb-4">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. El dolor de cabeza de AFIP</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              El domingo a la noche peleando con la página caída de AFIP para emitir comprobantes y que el contador no te mate a fin de mes.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-400">
              <strong>Con Claver:</strong> Facturación electrónica nativa (A, B, C) con CAE directo desde cada venta o seña cobrada.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Manifesto Block ─────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#0c1322] border-2 border-cyan-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Manifiesto Claver</div>
          <blockquote className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-6">
            &ldquo;No te damos esclavos de PowerPoint ni robots mágicos. Te damos una cuadrilla digital que cotiza por audio, asegura tus señas y cumple con AFIP — y vos solo firmás lo que no se revierte.&rdquo;
          </blockquote>
          <p className="text-sm text-slate-400 leading-relaxed">
            La convicción no se gamifica. Se protege: con presupuestos que no alucinan, señas que entran a tu banco y facturas legales que te dejan dormir tranquilo.
          </p>
        </div>
      </section>

      {/* ─── Objections / FAQ ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Preguntas Claras</span>
          <h2 className="text-3xl font-black text-white mt-1">Sin vueltas ni humo</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              ¿Qué le digo a mi contador si ve esto?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Que la IA no liquida impuestos a ciegas: le prepara el Libro IVA digital y las facturas con CAE validadas por AFIP/ARCA para que él las audite en un solo clic.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              ¿Por qué no usar simplemente ChatGPT?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ChatGPT te tira texto en una pestaña suelta que después tenés que copiar y pegar. Claver lee tu lista de precios real, arma el PDF, lo manda por WhatsApp, cobra la seña con Mercado Pago y registra la venta en la caja.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              ¿Qué pasa si no tengo tiempo para aprender a usarlo?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No tenés que aprender nada. Le mandás un audio de WhatsApp como le hablarías a un encargado, y el sistema te devuelve el presupuesto armado para que le des OK.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-800/40 rounded-3xl p-10 sm:p-14 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Tu idea sigue siendo tuya. <br />
            Nosotros hacemos que cobre y cumpla.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Empezá a cotizar tus audios y cobrar señas hoy mismo. 14 días de prueba completa sin tarjeta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-base shadow-xl shadow-cyan-500/25 transition"
            >
              Comenzar Prueba Gratis de 14 Días
            </Link>
            <Link
              href="/campus"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition"
            >
              Explorar Campus 2D
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Claver (claver.com.ar) — Hecho en Argentina para oficios y comercios con convicción.</p>
      </footer>
    </div>
  )
}
