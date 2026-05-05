import { motion } from 'framer-motion'
import Hero from '../components/Hero.jsx'
import ToolPageWrapper from '../components/ToolPageWrapper.jsx'

export default function ROIToolPage() {
  return (
    <ToolPageWrapper
      title="ROI"
      subtitle="Calculator"
      description="Get precise financial projections for any certification. Calculate break-even timelines, 5-year gains, and salary impacts with real India data."
    >
      <Hero
        mode="professional"
        prefilledCert=""
        resumeName=""
        resumeCity=""
        resumeDomain=""
      />
    </ToolPageWrapper>
  )
}
