import { supabase } from '@/lib/supabase'
import SalaryCard from '@/components/SalaryCard'
import EnvTest from '@/components/EnvTest'
import StatBox from '@/components/StatBox'
import AutoRefreshIndicator from '@/components/AutoRefreshIndicator'
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

  // Trending (sort by job_count_naukri)
  const trending = [...items]
    .filter(r => r.job_count_naukri > 0)
    .sort((a, b) => (b.job_count_naukri || 0) - (a.job_count_naukri || 0))
    .slice(0, 5)

  // Salary Movers (requires previous_min_salary)
  const movers = [...items]
    .filter(r => r.previous_min_salary != null && r.previous_min_salary > 0 && r.min_salary !== r.previous_min_salary)
    .map(r => {
      const change = r.min_salary - r.previous_min_salary;
      const percentChange = Math.round((change / r.previous_min_salary) * 100);
      return { ...r, percentChange };
    })
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 5)

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 40, fontFamily: 'system-ui' }}>
      <EnvTest />
      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>💰 CertifyROI Market Intelligence</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Real-time salary data for {items.length} tech roles in India
        </p>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          🔄 Auto-updates every Monday 6 AM IST
        </p>
      </header>

      <div style={{ 
        textAlign: 'center', 
        padding: '12px 24px',
        background: '#f0f0f0',
        borderRadius: 8,
        marginBottom: 24,
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <span style={{ color: '#22c55e', marginRight: 8 }}>●</span>
        Live Market Pulse — Last updated: {new Date().toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}
        <span style={{ marginLeft: 16, color: '#999' }}>
          (Updates every Monday 6 AM IST)
        </span>
      </div>

      <AutoRefreshIndicator />
      
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
        <StatBox label="Roles Tracked" value={items.length} />
        <StatBox label="Avg Salary Range" value="₹8.5L - ₹15L" />
        <StatBox label="Total Jobs" value="45,000+" />
        <StatBox label="Hot Sector" value="AI/ML" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 48 }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>🔥 Trending Roles</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {trending.map(role => (
              <li key={role.id || role.domain_name} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', paddingBottom: 8 }}>
                <span style={{ fontWeight: '500' }}>{role.domain_name}</span>
                <span style={{ color: '#666' }}>{role.job_count_naukri?.toLocaleString()} jobs</span>
              </li>
            ))}
            {trending.length === 0 && <li style={{ color: '#999' }}>Gathering data...</li>}
          </ul>
        </div>
        
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>📈 Salary Movers (WoW)</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {movers.map(role => (
              <li key={role.id || role.domain_name} style={{ marginBottom: 12, borderBottom: '1px solid #f5f5f5', paddingBottom: 8 }}>
                {role.percentChange > 0 ? '🟢' : '🔴'} {role.percentChange > 0 ? 'Up' : 'Down'} {Math.abs(role.percentChange)}%: 
                <span style={{ fontWeight: '500', margin: '0 4px' }}>"{role.domain_name}"</span> 
                <span style={{ color: '#666', fontSize: '0.9rem' }}>
                  (was {role.previous_min_salary}L → now {role.min_salary}L)
                </span>
              </li>
            ))}
            {movers.length === 0 && <li style={{ color: '#999' }}>Tracking changes... (requires next weekly update)</li>}
          </ul>
        </div>
      </div>

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
