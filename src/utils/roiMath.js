export const ROI_DEFAULTS = {
  years: 5,
  annualIncrementRate: 0.08,
  discountRate: 0.06,
}

export function calculateAdvancedROI({
  salaryLPA = 0,
  certCostINR = 0,
  certCostL = null,
  hikePercent = 0,
  years = ROI_DEFAULTS.years,
  annualIncrementRate = ROI_DEFAULTS.annualIncrementRate,
  discountRate = ROI_DEFAULTS.discountRate,
}) {
  const salaryINR = Math.max(0, Number(salaryLPA) || 0) * 100000
  const costINR = Math.max(0, Number(certCostL ?? 0) || 0) * 100000 || Math.max(0, Number(certCostINR) || 0)
  const hike = Math.max(0, Number(hikePercent) || 0) / 100

  if (!salaryINR || !hike) {
    return {
      breakEven: 0,
      breakEvenMonths: 0,
      fiveYearNet: (-costINR / 100000).toFixed(1),
      fiveYearGainL: (-costINR / 100000).toFixed(1),
      fiveYearGainINR: -costINR,
      roiPct: costINR > 0 ? -100 : 0,
      roiPercent: costINR > 0 ? -100 : 0,
      annualGain: '0.0',
      annualGainL: '0.0',
      monthlyGainK: 0,
      newSalaryL: (salaryINR / 100000).toFixed(1),
      projections: [],
    }
  }

  // Year 0 cash flow is the certification cost. Years 1-5 compare two salary
  // timelines: the normal corporate raise path vs certification-hike path.
  let discountedGainINR = 0
  let undiscountedGainINR = 0
  let breakEvenMonths = 0
  const projections = []

  for (let year = 1; year <= years; year += 1) {
    const baselineSalary = salaryINR * Math.pow(1 + annualIncrementRate, year)
    const certSalary = salaryINR * (1 + hike) * Math.pow(1 + annualIncrementRate, year)
    const incrementalGain = certSalary - baselineSalary
    const presentValueGain = incrementalGain / Math.pow(1 + discountRate, year)

    discountedGainINR += presentValueGain
    undiscountedGainINR += incrementalGain

    if (!breakEvenMonths && undiscountedGainINR >= costINR) {
      const previousGain = undiscountedGainINR - incrementalGain
      const monthlyGain = incrementalGain / 12
      breakEvenMonths = Math.ceil((year - 1) * 12 + ((costINR - previousGain) / monthlyGain))
    }

    projections.push({
      year,
      baselineSalary,
      certSalary,
      incrementalGain,
      presentValueGain,
    })
  }

  const netPresentValueINR = discountedGainINR - costINR
  const firstYearGainINR = (salaryINR * (1 + hike) * (1 + annualIncrementRate)) - (salaryINR * (1 + annualIncrementRate))
  const monthlyGainINR = firstYearGainINR / 12
  const fallbackBreakEven = monthlyGainINR > 0 ? Math.ceil(costINR / monthlyGainINR) : 0
  const finalBreakEven = breakEvenMonths || fallbackBreakEven
  const roiPercent = costINR > 0 ? Math.round((netPresentValueINR / costINR) * 100) : 0

  return {
    breakEven: finalBreakEven,
    breakEvenMonths: finalBreakEven,
    fiveYearNet: (netPresentValueINR / 100000).toFixed(1),
    fiveYearGainL: (netPresentValueINR / 100000).toFixed(1),
    fiveYearGainINR: netPresentValueINR,
    roiPct: roiPercent,
    roiPercent,
    annualGain: (firstYearGainINR / 100000).toFixed(1),
    annualGainL: (firstYearGainINR / 100000).toFixed(1),
    monthlyGainK: Math.round(monthlyGainINR / 1000),
    newSalaryL: ((salaryINR * (1 + hike)) / 100000).toFixed(1),
    projections,
  }
}
