import { useEffect, useRef } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

export default function PlaybackControls() {
  const { result, isPlaying, playbackSpeed, currentTime, setIsPlaying, setPlaybackSpeed, setCurrentTime } = useSimulationStore()
  const animRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const maxTime = result ? result.time_window_hours * 3600 : 0

  useEffect(() => {
    if (!isPlaying || !result) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }

    lastTickRef.current = performance.now()

    const tick = (now: number) => {
      const state = useSimulationStore.getState()
      const dt = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      const newTime = state.currentTime + dt * state.playbackSpeed
      const max = state.result ? state.result.time_window_hours * 3600 : 0
      if (newTime >= max) {
        setCurrentTime(max)
        setIsPlaying(false)
        return
      }
      setCurrentTime(newTime)
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [isPlaying, result])

  if (!result) return null

  const formatTime = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`
    if (s < 3600) return `${(s / 60).toFixed(1)}m`
    return `${(s / 3600).toFixed(1)}h`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-borderSubtle px-4 py-3"
      style={{ background: 'rgba(3, 7, 18, 0.9)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <button onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primaryPressed transition-colors flex-shrink-0">
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        <button onClick={() => setCurrentTime(0)}
          className="text-xs text-onDark/60 hover:text-onDark transition-colors flex-shrink-0">
          Reset
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs font-mono text-onDark/50 w-12 text-right flex-shrink-0">{formatTime(currentTime)}</span>
          <input type="range" min={0} max={maxTime} step={1} value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="flex-1 h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
          <span className="text-xs font-mono text-onDark/50 w-12 flex-shrink-0">{formatTime(maxTime)}</span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {[1, 2, 5, 10].map((speed) => (
            <button key={speed} onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                playbackSpeed === speed
                  ? 'bg-primary/20 text-primary'
                  : 'text-onDark/40 hover:text-onDark/70'
              }`}>
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}