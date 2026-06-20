export async function generateMetadata({ params }) {
  // Replace all hyphens to handle slugs with multiple words (e.g., 'aws-solutions-architect')
  const certName = params.slug.replaceAll('-', ' ');
  
  return {
    title: `${certName.toUpperCase()} Certification ROI & Salary Hike in India`,
    description: `Calculate the exact ROI, average salary bump, and study time required for the ${certName.toUpperCase()} certification based on verified Indian job market data.`,
  };
}

export default function CertDynamicLayout({ children }) {
  return children;
}
