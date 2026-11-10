import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

// ── Geometrias dos dados ──────────────────────────────────────────────────────
const createD4 = () => new THREE.TetrahedronGeometry(1.1)
const createD6 = () => new THREE.BoxGeometry(1.6, 1.6, 1.6)
const createD8 = () => new THREE.OctahedronGeometry(1.1)
const createD10 = () => new THREE.CylinderGeometry(0, 1.1, 1.8, 10, 1)
const createD12 = () => new THREE.DodecahedronGeometry(1.1)
const createD20 = () => new THREE.IcosahedronGeometry(1.1)

const DICE_CONFIG = {
  d4:  { create: createD4,  sides: 4,  color: '#e74c3c', emissive: '#7b0000', bgBtn: 'bg-red-600', borderBtn: 'border-red-600', shadowBtn: 'shadow-red-600/50', textColor: 'text-red-500', glowClass: 'drop-shadow-[0_0_20px_#e74c3c]' },
  d6:  { create: createD6,  sides: 6,  color: '#3498db', emissive: '#0a3d6b', bgBtn: 'bg-sky-500', borderBtn: 'border-sky-500', shadowBtn: 'shadow-sky-500/50', textColor: 'text-sky-400', glowClass: 'drop-shadow-[0_0_20px_#3498db]' },
  d8:  { create: createD8,  sides: 8,  color: '#2ecc71', emissive: '#0a5c32', bgBtn: 'bg-emerald-500', borderBtn: 'border-emerald-500', shadowBtn: 'shadow-emerald-500/50', textColor: 'text-emerald-400', glowClass: 'drop-shadow-[0_0_20px_#2ecc71]' },
  d10: { create: createD10, sides: 10, color: '#f39c12', emissive: '#7a4f00', bgBtn: 'bg-amber-500', borderBtn: 'border-amber-500', shadowBtn: 'shadow-amber-500/50', textColor: 'text-amber-400', glowClass: 'drop-shadow-[0_0_20px_#f39c12]' },
  d12: { create: createD12, sides: 12, color: '#9b59b6', emissive: '#4a0e6e', bgBtn: 'bg-purple-500', borderBtn: 'border-purple-500', shadowBtn: 'shadow-purple-500/50', textColor: 'text-purple-400', glowClass: 'drop-shadow-[0_0_20px_#9b59b6]' },
  d20: { create: createD20, sides: 20, color: '#7c3aed', emissive: '#3b0d87', bgBtn: 'bg-violet-600', borderBtn: 'border-violet-600', shadowBtn: 'shadow-violet-600/50', textColor: 'text-violet-400', glowClass: 'drop-shadow-[0_0_20px_#7c3aed]' },
}

export default function DiceRoller({ onClose }) {
  const canvasRef   = useRef(null)
  const sceneRef    = useRef({})
  const [diceType,  setDiceType]  = useState('d20')
  const [result,    setResult]    = useState(null)
  const [rolling,   setRolling]   = useState(false)
  const [history,   setHistory]   = useState([])

  const cfg = DICE_CONFIG[diceType]

  // ── Three.js setup ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas  = canvasRef.current
    if (!canvas) return
    const W = Math.min(320, window.innerWidth - 48)
    const H = W

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 4.5)

    // Iluminação
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dLight.position.set(5, 5, 5)
    scene.add(dLight)
    const pLight = new THREE.PointLight(0x7c3aed, 2, 10)
    pLight.position.set(-2, 2, 2)
    scene.add(pLight)

    // Dado
    const geo  = cfg.create()
    const mat  = new THREE.MeshPhongMaterial({
      color:    new THREE.Color(cfg.color),
      emissive: new THREE.Color(cfg.emissive),
      shininess: 80,
      specular:  new THREE.Color('#ffffff'),
    })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Aresta wireframe sutil
    const edges    = new THREE.EdgesGeometry(geo)
    const lineMat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
    const wireframe = new THREE.LineSegments(edges, lineMat)
    mesh.add(wireframe)

    sceneRef.current = { renderer, scene, camera, mesh, animId: null, spinning: true, vx: 0.01, vy: 0.02 }

    const animate = () => {
      const s = sceneRef.current
      s.animId = requestAnimationFrame(animate)
      if (s.spinning) {
        s.mesh.rotation.x += s.vx
        s.mesh.rotation.y += s.vy
      }
      s.renderer.render(s.scene, s.camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(sceneRef.current.animId)
      renderer.dispose()
    }
  }, [diceType])

  // ── Roll ─────────────────────────────────────────────────────────────────
  const roll = useCallback(() => {
    if (rolling) return
    setRolling(true)
    setResult(null)

    const s = sceneRef.current
    s.vx = 0.15
    s.vy = 0.22

    let ticks = 0
    const decel = setInterval(() => {
      ticks++
      s.vx *= 0.93
      s.vy *= 0.93
      if (ticks > 60) {
        clearInterval(decel)
        s.vx = 0.005
        s.vy = 0.008
        const r = Math.floor(Math.random() * cfg.sides) + 1
        setResult(r)
        setHistory(h => [{ type: diceType, value: r, color: cfg.color, textColor: cfg.textColor }, ...h].slice(0, 12))
        setRolling(false)
      }
    }, 16)
  }, [rolling, diceType, cfg])

  // Fechar com Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-black/85 z-[9999] flex flex-col items-center justify-center gap-6 p-5"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 border border-white/20 rounded-lg text-white px-3 py-1.5 cursor-pointer text-sm hover:bg-white/20 transition"
      >
        ✕ Fechar
      </button>

      <h2 className="text-2xl font-bold text-slate-100 tracking-wider m-0">
        🎲 ROLAR DADOS
      </h2>

      {/* Seletor de dados */}
      <div className="flex gap-2 flex-wrap justify-center">
        {Object.keys(DICE_CONFIG).map(dt => {
          const item = DICE_CONFIG[dt]
          const isActive = diceType === dt
          return (
            <button
              key={dt}
              onClick={() => { setDiceType(dt); setResult(null) }}
              className={`px-4 py-2 rounded-lg text-white font-bold text-base cursor-pointer transition ${
                isActive
                  ? `${item.bgBtn} ${item.borderBtn} border`
                  : 'bg-white/8 border border-white/15 hover:bg-white/15'
              }`}
            >
              {dt.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Canvas 3D */}
      <canvas
        ref={canvasRef}
        onClick={roll}
        title="Clique para rolar!"
        className="rounded-2xl border border-purple-600/40 shadow-[0_0_40px_rgba(124,58,237,0.3)] cursor-pointer max-w-full"
      />

      {/* Resultado */}
      <div className="text-center min-h-[80px]">
        {rolling && <p className="text-white/50 text-lg">Rolando...</p>}
        {result !== null && !rolling && (
          <>
            <div
              className={`text-6xl font-extrabold leading-none ${cfg.textColor} ${cfg.glowClass}`}
            >
              {result}
            </div>
            <div className="text-sm text-white/50 mt-1">
              {result === cfg.sides ? '🎉 CRÍTICO!' : result === 1 ? '💀 FALHA CRÍTICA!' : `${diceType.toUpperCase()} rolado`}
            </div>
          </>
        )}
        {result === null && !rolling && (
          <p className="text-white/30 text-sm">Clique no dado ou no botão</p>
        )}
      </div>

      {/* Botão rolar */}
      <button
        onClick={roll}
        disabled={rolling}
        className={`px-9 py-3 ${cfg.bgBtn} border-none rounded-xl text-white text-lg font-bold cursor-pointer tracking-wider transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg ${cfg.shadowBtn}`}
      >
        {rolling ? 'Rolando...' : `Rolar ${diceType.toUpperCase()}`}
      </button>

      {/* Histórico */}
      {history.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center max-w-60">
          {history.map((h, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-white/5 border border-white/15 rounded-full text-xs text-white"
            >
              {h.type}: <strong className={h.textColor}>{h.value}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}