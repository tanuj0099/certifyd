import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

const FM = "var(--font-mono)";
const FB = "var(--font-body)";
const FH = "var(--font-head)";

function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  prefix = '',
  suffix = '',
  color = 'var(--linear-blue)',
  note,
  formatDisplay,
  disabled = false,
}) {
  const trackRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [hover, setHover] = useState(false)
  const [tooltipX, setTooltipX] = useState(null)

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))

  const snap = useCallback(function (raw) {
    var stepped = Math.round((raw - min) / step) * step + min
    var clamped = Math.max(min, Math.min(max, stepped))
    return parseFloat(clamped.toFixed(10))
  }, [min, max, step])

  const fromX = useCallback(function (clientX) {
    var el = trackRef.current
    if (!el) return value
    var rect = el.getBoundingClientRect()
    var x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setTooltipX((x / rect.width) * 100)
    return snap(min + (x / rect.width) * (max - min))
  }, [min, max, snap, value])

  const onMouseDown = useCallback(function (e) {
    if (disabled) return
    e.preventDefault()
    setDrag(true)
    onChange(fromX(e.clientX))

    function onMove(e) { onChange(fromX(e.clientX)) }
    function onUp() {
      setDrag(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [disabled, fromX, onChange])

  const onTouchStart = useCallback(function (e) {
    if (disabled) return
    e.preventDefault()
    setDrag(true)
    onChange(fromX(e.touches[0].clientX))

    function onMove(e) {
      e.preventDefault()
      onChange(fromX(e.touches[0].clientX))
    }
    function onEnd() {
      setDrag(false)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }, [disabled, fromX, onChange])

  const onKeyDown = useCallback(function (e) {
    if (disabled) return
    var map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }
    if (map[e.key] !== undefined) {
      e.preventDefault()
      onChange(snap(value + map[e.key]))
    }
    if (e.key === 'Home') { e.preventDefault(); onChange(min) }
    if (e.key === 'End') { e.preventDefault(); onChange(max) }
  }, [disabled, step, snap, value, min, max, onChange])

  var display = formatDisplay
    ? formatDisplay(value)
    : (prefix + (typeof value === 'number' ? value.toLocaleString('en-IN') : value) + suffix)

  return (
    <div style={{ marginBottom: '28px', opacity: disabled ? 0.42 : 1, transition: 'opacity 0.2s' }}>

      {/* Label + animated value */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
        <label style={{
          fontSize: '11px',
          color: 'var(--text-3)',
          fontFamily: FM,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          userSelect: 'none',
          cursor: 'default',
          fontWeight: '600',
        }}>
          {label}
        </label>
        <motion.div
          key={display}
          initial={{ opacity: 0.4, y: -5, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: FH,
            fontSize: '20px',
            fontWeight: '800',
            color: color,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {display}
        </motion.div>
      </div>

      {/* Outer hit zone - tall for easy mobile touch */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onKeyDown={onKeyDown}
        onMouseEnter={function () { setHover(true) }}
        onMouseLeave={function () { setHover(false) }}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        aria-disabled={disabled}
        style={{
          position: 'relative',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : drag ? 'grabbing' : 'pointer',
          outline: 'none',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Track background */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '6px',
          borderRadius: '4px',
          background: 'var(--border-subtle)',
          border: '1px solid var(--border-subtle)',
          pointerEvents: 'none',
          overflow: 'visible',
        }}>
          {/* Filled track */}
          <div style={{
            position: 'absolute',
            left: 0,
            width: pct + '%',
            height: '100%',
            borderRadius: '4px',
            background: color,
            boxShadow: drag ? ('0 0 12px ' + color + '60') : ('0 0 6px ' + color + '30'),
            transition: drag ? 'none' : 'width 0.05s linear, box-shadow 0.2s',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Glow dot at thumb position when dragging */}
        {drag && (
          <div style={{
            position: 'absolute',
            left: pct + '%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: color + '18',
            pointerEvents: 'none',
            zIndex: 1,
          }} />
        )}

        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: pct + '%',
          transform: 'translateX(-50%) scale(' + (drag ? 1.18 : hover ? 1.06 : 1) + ')',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: 'var(--bg)',
          boxShadow: drag
            ? ('0 0 0 8px ' + color + '20, 0 0 0 14px ' + color + '08, 0 4px 20px transparent')
            : ('0 0 0 5px ' + color + '18, 0 2px 10px transparent'),
          cursor: disabled ? 'not-allowed' : drag ? 'grabbing' : 'grab',
          zIndex: 4,
          pointerEvents: 'none',
          transition: drag
            ? 'transform 0.08s, box-shadow 0.08s'
            : 'left 0.04s linear, transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid ' + color,
        }}>
          {/* 22 grip dots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[0, 1].map(function (r) {
              return (
                <div key={r} style={{ display: 'flex', gap: '3px' }}>
                  {[0, 1].map(function (c) {
                    return (
                      <div key={c} style={{
                        width: '2.5px',
                        height: '2.5px',
                        borderRadius: '50%',
                        background: color,
                      }} />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tick marks - subtle visual scale */}
        {[0, 25, 50, 75, 100].map(function (tick) {
          return (
            <div key={tick} style={{
              position: 'absolute',
              left: tick + '%',
              transform: 'translateX(-50%)',
              top: '34px',
              width: tick === 0 || tick === 100 ? '4px' : '3px',
              height: tick === 0 || tick === 100 ? '4px' : '3px',
              borderRadius: '50%',
              background: tick <= pct ? color + '70' : 'transparent',
              pointerEvents: 'none',
              transition: 'background 0.1s',
            }} />
          )
        })}
      </div>

      {/* Note text */}
      {note ? (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-4)',
          marginTop: '8px',
          fontFamily: FM,
          lineHeight: '1.5',
          paddingLeft: '1px',
          letterSpacing: '0.03em',
        }}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

export default Slider