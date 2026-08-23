'use client';

import CollegeVsCorporate from '@/components/CollegeVsCorporate.jsx'
import ToolPageWrapper from '@/components/ToolPageWrapper.jsx'

export default function CollegeTool() {
  return (
    <ToolPageWrapper
      title="College vs Corporate Path"
      description="Compare the financial and career outcomes of traditional 4-year degrees vs corporate certification programs."
    >
      <CollegeVsCorporate />
    </ToolPageWrapper>
  )
}
