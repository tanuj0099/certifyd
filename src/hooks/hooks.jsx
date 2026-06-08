import { useState, useEffect, useCallback, useRef } from 'react'
import { calculateAdvancedROI, ROI_DEFAULTS } from '../utils/roiMath.js'

// ── localStorage hook ─────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })
  const setStoredValue = useCallback((val) => {
    try {
      const v = val instanceof Function ? val(value) : val
      setValue(v)
      localStorage.setItem(key, JSON.stringify(v))
    } catch (e) { console.warn('localStorage error:', e) }
  }, [key, value])
  const clear = useCallback(() => {
    setValue(initialValue)
    try { localStorage.removeItem(key) } catch {}
  }, [key, initialValue])
  return [value, setStoredValue, clear]
}

// ── Guest counter ─────────────────────────────────────────
export const useGuestCounter = (limit = 3) => {
  const [count, setCount, clearCount] = useLocalStorage('croi_guest_count', 0)
  const increment = useCallback(() => setCount(c => c + 1), [setCount])
  const reset = useCallback(() => clearCount(), [clearCount])
  return {
    count,
    remaining: Math.max(0, limit - count),
    exceeded: count >= limit,
    increment,
    reset,
  }
}

// ── Life anchor helper ────────────────────────────────────
export const getLifeAnchor = (amountINR, isStudent = false) => {
  return '';
}

// ── ROI calculator ────────────────────────────────────────
export const useROICalc = ({ currentSalary: initialSalary, certCost, hikePercent, isStudent, targetOfferLakhs }) => {
  // Sane fallback if missing or 0 (defaults to 4 LPA / 400000 INR)
  const currentSalary = (initialSalary && initialSalary > 0) ? initialSalary : 0;
  const STUDENT_BASELINE = targetOfferLakhs ? targetOfferLakhs * 100000 : 400000 // fallback

  const annualSalaryINR = isStudent ? 0 : currentSalary * 100000
  const baselineINR     = isStudent ? STUDENT_BASELINE : annualSalaryINR
  const certCostINR     = certCost * 100000
  const inflationRate   = ROI_DEFAULTS.discountRate
  const roi = calculateAdvancedROI({
    salaryLPA: isStudent ? STUDENT_BASELINE / 100000 : currentSalary,
    certCostINR,
    hikePercent: isStudent ? 0 : hikePercent,
  })

  const newSalaryINR  = isStudent ? STUDENT_BASELINE : parseFloat(roi.newSalaryL) * 100000
  const annualGainINR = isStudent ? 0 : parseFloat(roi.annualGainL) * 100000
  const monthlyGain   = annualGainINR / 12
  const breakEvenMonths = isStudent ? 0 : roi.breakEvenMonths
  const fiveYearGainINR = isStudent ? STUDENT_BASELINE * 5 - certCostINR : roi.fiveYearGainINR
  
  // Math safeguard for ROI Calculation
  const rawRoi = currentSalary > 0 ? (((fiveYearGainINR - certCostINR) / certCostINR) * 100) : 0;
  const roiPercent = Math.min(Math.round(rawRoi), 1000);

  // Career multiplier for students
  const careerMultiplier = isStudent && certCost > 0
    ? parseFloat(((STUDENT_BASELINE - certCostINR) / certCostINR).toFixed(1))
    : null

  // Chart: action vs inaction (inflation-adjusted flat)
  const chartData = Array.from({ length: 25 }, (_, month) => {
    let inactionCumulative = 0;
    let actionCumulative = 0;

    if (currentSalary === 0 || isStudent) {
      inactionCumulative = 0;
      if (month <= 6) {
        actionCumulative = -certCostINR;
      } else {
        const targetOfferINR = targetOfferLakhs * 100000;
        actionCumulative = -certCostINR + ((targetOfferINR / 12) * (month - 6));
      }
    } else {
      inactionCumulative = baselineINR / 12 * month * Math.pow(1 + inflationRate / 12, month) - baselineINR / 12 * month;
      actionCumulative = month === 0 ? -certCostINR : -certCostINR + monthlyGain * month;
    }

    return {
      month,
      action:   Math.round(actionCumulative / 1000),
      inaction: Math.round(inactionCumulative / 1000),
      label:    month === 0 ? 'Now' : `M${month}`,
    }
  })

  return {
    isStudent,
    newSalaryL:      (newSalaryINR / 100000).toFixed(1),
    annualGainL:     (annualGainINR / 100000).toFixed(1),
    monthlyGainK:    Math.round(monthlyGain / 1000),
    breakEvenMonths,
    fiveYearGainL:   (fiveYearGainINR / 100000).toFixed(1),
    fiveYearGainINR,
    roiPercent,
    careerMultiplier,
    chartData,
    anchor: getLifeAnchor(fiveYearGainINR, isStudent),
  }
}

// ── Window size ───────────────────────────────────────────
export const useWindowSize = () => {
  const [size, setSize] = useState({
    width:  typeof window !== 'undefined' ? window.innerWidth  : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })
  useEffect(() => {
    const h = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return size
}

export const useWindowWidth = () => useWindowSize().width

// ── Debounce ──────────────────────────────────────────────
export const useDebounce = (value, delay = 300) => {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

// ── InView ────────────────────────────────────────────────
export const useInView = (threshold = 0.1) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ── Animated counter ──────────────────────────────────────
export const useCounter = (target, duration = 800, start = false) => {
  const [val, setVal] = useState(0)
  const frame = useRef(null)
  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration, start])
  return val
}

export const useMediaQuery = (query) => {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = (e) => setM(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [query])
  return m
}

export const usePrevious = (value) => {
  const ref = useRef(undefined)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}
