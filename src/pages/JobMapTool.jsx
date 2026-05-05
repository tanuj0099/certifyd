import JobCertMap from '../components/JobCertMap.jsx'
import ToolPageWrapper from '../components/ToolPageWrapper.jsx'

export default function JobMapToolPage() {
  return (
    <ToolPageWrapper
      title="Certification"
      subtitle="to Job Map"
      description="See which jobs and roles value each certification. Filter by role, salary range, and company type."
    >
      <JobCertMap />
    </ToolPageWrapper>
  )
}
