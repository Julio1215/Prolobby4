import { useState, useCallback, useRef } from 'react'
import * as THREE from 'three'

const DICE = [4, 6, 8, 10, 12, 20, 100]

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

function getGeometry(sides) {
  switch (sides) {
    case 4:  return new THREE.TetrahedronGeometry(1.1, 0)
    case 8:  return new THREE.OctahedronGeometry(1.1, 0)
    case 12: return new THREE.DodecahedronGeometry(1.0, 0)
    case 20: return new THREE.IcosahedronGeometry(1.0, 0)
    default: return new THREE.BoxGeometry(1.4, 1.4, 1.4)
  }
}

function Dice3D({ rollingRef, sidesRef, result, sides, rolling }) {
  const threeRef = useRef(null)

  const mountCallback = useCallback((node) => {
    if (!node || threeRef.current) return

    const W = 140, H = 140
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    node.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 3.8

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const d1 = new THREE.DirectionalLight(0xa855f7, 1.4)
    d1.position.set(2, 3, 2)
    scene.add(d1)
    const d2 = new THREE.DirectionalLight(0x00e5ff, 0.5)
    d2.position.set(-2, -1, 1)
    scene.add(d2)

    const mat = new THREE.MeshPhongMaterial({
      color: 0x1a0a40, emissive: 0x7c3aed,
      emissiveIntensity: 0.18, shininess: 80,
      transparent: true, opacity: 0.93,
    })
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, wireframe: true,
      transparent: true, opacity: 0.22,
    })

    const geo      = getGeometry(sidesRef.current)
    const mesh     = new THREE.Mesh(geo, mat)
    const wireMesh = new THREE.Mesh(geo.clone(), wireMat)
    scene.add(mesh)
    scene.add(wireMesh)

    threeRef.current = { renderer, mesh, wireMesh, mat, node }

    let t = 0
    let frame
    const animate = () => {
      frame = requestAnimationFrame(animate)
      t += 0.016
      if (rollingRef.current) {
        mesh.rotation.x += 0.09
        mesh.rotation.y += 0.13
        mesh.rotation.z += 0.06
        mat.emissiveIntensity = 0.28 + Math.sin(t * 8) * 0.12
      } else {
        mesh.rotation.y += 0.006
        mesh.rotation.x = Math.sin(t * 0.4) * 0.08
        mat.emissiveIntensity = 0.14 + Math.sin(t * 0.8) * 0.04
      }
      wireMesh.rotation.copy(mesh.rotation)
      renderer.render(scene, camera)
    }
    animate()
    threeRef.current.frame = frame
    threeRef.current.cancelFrame = () => cancelAnimationFrame(frame)
  }, [])

  const prevSides = useRef(20)
  if (threeRef.current && sides !== prevSides.current) {
    prevSides.current = sides
    const { mesh, wireMesh } = threeRef.current
    const newGeo = getGeometry(sides)
    mesh.geometry.dispose()
    wireMesh.geometry.dispose()
    mesh.geometry     = newGeo
    wireMesh.geometry = newGeo.clone()
  }

  const isCrit   = !rolling && result === sides
  const isFumble = !rolling && result === 1 && sides >= 20

  // Escolhe a cor do número dependendo do resultado
  let corDoResultado = 'text-white [text-shadow:0_0_10px_rgba(168,85,247,0.7)]'
  if (isCrit) {
    corDoResultado = 'text-amber-400 [text-shadow:0_0_14px_rgba(251,191,36,0.8)]'
  } else if (isFumble) {
    corDoResultado = 'text-red-500'
  }

  // Escolhe o texto que aparece no meio do dado
  let textoDoResultado = ''
  if (rolling) {
    textoDoResultado = '?'
  } else if (result !== null) {
    textoDoResultado = result
  }

  return (
    <div className="relative w-35 h-35 shrink-0">
      <div ref={mountCallback} className="w-35 h-35" />
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <span
          className={`font-mono font-black leading-none ${
            result !== null && result >= 100 ? 'text-lg' : 'text-3xl'
          } ${corDoResultado}`}
        >
          {textoDoResultado}
        </span>
        {!rolling && result !== null && (
          <span className="text-[10px] font-bold tracking-widest uppercase text-purple-100/40 mt-0.5">
            d{sides}
          </span>
        )}
      </div>
    </div>
  )
}

export default function DiceWidget() {
  const [open,    setOpen]    = useState(false)
  const [result,  setResult]  = useState(null)
  const [rolling, setRolling] = useState(false)
  const [lastDie, setLastDie] = useState(20)
  const [history, setHistory] = useState([])

  const rollingRef = useRef(false)
  const sidesRef   = useRef(20)

  const roll = useCallback((sides) => {
    if (rollingRef.current) return
    rollingRef.current = true
    sidesRef.current   = sides
    setRolling(true)
    setLastDie(sides)
    setResult(null)

    setTimeout(() => {
      const final = rollDie(sides)
      setResult(final)
      setHistory(prev => [{ die: sides, value: final }, ...prev].slice(0, 8))
      setRolling(false)
      rollingRef.current = false
    }, 1200)
  }, [])

  const isCrit   = !rolling && result === lastDie
  const isFumble = !rolling && result === 1 && lastDie >= 20
  const statusLabel = rolling ? 'Rolando...' : isCrit ? '✨ CRÍTICO!' : isFumble ? '💀 Falha Crítica' : null

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Rolar dados"
        className="fixed bottom-6 right-6 w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-2xl border-none cursor-pointer flex items-center justify-center z-50 shadow-[0_0_16px_rgba(191,0,255,0.3),0_4px_12px_rgba(0,0,0,0.5)] transition duration-200 hover:scale-110"
      >
        🎲
      </button>

      {/* Janela do Dado */}
      <div
        className={`fixed bottom-24 right-6 w-75 bg-dark-card backdrop-blur-2xl border border-dark-border rounded-3xl p-5 z-40 shadow-[0_0_30px_rgba(124,58,237,0.12),0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-200 ease-out ${
          open ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-2.5'
        }`}
      >
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="text-sm font-bold text-dark-text-1">🎲 Rolar Dados</h3>
          <button
            onClick={() => setOpen(false)}
            className="bg-none border-none text-dark-text-3 hover:text-dark-text-1 cursor-pointer text-base p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 mb-4">
          <Dice3D
            rollingRef={rollingRef}
            sidesRef={sidesRef}
            result={result}
            sides={lastDie}
            rolling={rolling}
          />
          {statusLabel && (
            <span
              className={`text-xs font-extrabold tracking-wider ${
                isCrit ? 'text-amber-400' : isFumble ? 'text-red-500' : 'text-purple-300'
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-3.5">
          {DICE.map(d => (
            <button
              key={d}
              onClick={() => roll(d)}
              disabled={rolling}
              className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition duration-150 cursor-pointer disabled:cursor-not-allowed ${
                lastDie === d
                  ? 'border border-purple-600/50 bg-purple-600/15 text-purple-300'
                  : 'border border-dark-border bg-transparent text-dark-text-2 hover:text-dark-text-1'
              }`}
            >
              d{d}
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div>
            <p className="text-[10px] text-dark-text-3 uppercase tracking-widest mb-1.5 font-bold">
              Histórico
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {history.map((h, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-purple-600/10 text-dark-text-2 border border-purple-600/15"
                >
                  {h.value}<span className="opacity-40 text-[9px]">/d{h.die}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
