import { supabase } from '@/lib/supabase'
import SalaryCard from '@/components/SalaryCard'

export const revalidate = 3600

const categories = {
  '💻 Engineering': [
    'Full Stack Developer', 'Backend Engineer', 'Frontend Developer', 'DevOps Engineer', 'Software Architect',
    'Mobile App Developer', 'iOS Developer', 'Android Developer', 'QA Automation Engineer', 'SRE (Site Reliability Engineer)'
  ],
  '🤖 Data & AI': [
    'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'AI Researcher', 'Data Engineer',
    'NLP Engineer', 'Computer Vision Engineer', 'Big Data Engineer', 'Business Intelligence Developer', 'Statistical Analyst'
  ],
  '🎨 Design': [
    'UI/UX Designer', 'Product Designer', 'Interaction Designer', 'Motion Designer', 'Graphic Designer',
    'Visual Designer', 'Service Designer', 'User Researcher'
  ],
  '🔒 Security': [
    'Cybersecurity Analyst', 'Ethical Hacker', 'Security Architect', 'Penetration Tester',
    'Cloud Security Specialist', 'SOC Analyst', 'Information Security Manager', 'Network Engineer'
  ],
  '💼 Management': [
    'Product Manager', 'Project Manager', 'Scrum Master', 'Agile Coach', 'Program Manager',
    'Operations Manager', 'Management Trainee'
  ],
  '📊 Finance': [
    'Financial Analyst', 'Investment Banking Analyst', 'Risk Manager', 'Actuarial Analyst',
    'Quant Researcher', 'Equity Researcher', 'Tax Consultant', 'Audit Associate', 'Fintech Product Manager'
  ],
  '📈 Marketing': [
    'Digital Marketing Specialist', 'SEO Specialist', 'Performance Marketer', 'Content Strategist',
    'Growth Hacker', 'Social Media Manager', 'Product Marketing Manager', 'Sales Development Representative'
  ],
  '🏗️ Cloud & Infra': [
    'Cloud Architect (AWS)', 'Azure Architect', 'GCP Engineer', 'Database Administrator', 'Cloud Security Specialist'
  ],
  '🔗 Other Tech': [
    'Blockchain Developer', 'Embedded Systems Engineer', 'Game Developer', 'Rust Developer',
    'Golang Developer', 'SAP Consultant'
  ],
  '🎯 Consulting': [
    'Business Analyst', 'Strategy Consultant', 'Management Consultant', 'Supply Chain Analyst'
  ],
}

export default async function Home() {
  const { data: roles, error } = await supabase
    .from('market_intelligence')
    .select('*')
    .gt('min_salary', 0)
    .order('domain_name')

  if (error) {
    throw new Error(error.message)
  }

  const items = roles || []

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 40, fontFamily: 'system-ui' }}>
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>💰 CertifyROI Market Intelligence</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Real-time salary data for {items.length} tech roles in India
        </p>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          🔄 Auto-updates every Monday 6 AM IST
        </p>
      </header>

      {Object.entries(categories).map(([cat, names]) => {
        const catRoles = items.filter(role => names.includes(role.domain_name))
        if (catRoles.length === 0) return null

        return (
          <section key={cat} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 20, borderBottom: '2px solid #667eea', paddingBottom: 8 }}>
              {cat}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {catRoles.map(role => (
                <SalaryCard key={role.domain_name} data={role} />
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
