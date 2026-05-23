import { supabase } from '../lib/supabase'

export const revalidate = 3600

export default async function Home() {
  let items = []
  
  try {
    const { data: marketData, error } = await supabase
      .from('demand_scores')
      .select('*')
      
    if (error) {
      console.error("Failed to fetch demand_scores:", error)
    } else {
      items = marketData || []
    }
  } catch (err) {
    console.error("Critical server exception during data lookup:", err)
    items = [] // Secure default array fallback
  }

  // Format currency helper
  const formatSalary = (value) => {
    if (!value) return 'N/A'
    // To match the "₹73.1L" style mentioned, we can use Indian numbering or a simple compact formatter.
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 1, 
      notation: 'compact' 
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-[#010102] text-white font-sans">
      <main className="pt-[128px] md:pt-[144px] px-6 max-w-7xl mx-auto pb-32">
        
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-white">
            Live Market Pulse
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Real-time salary floors and dynamic demand metrics for elite tech roles.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((role, index) => (
            <div 
              key={role.id || index} 
              className="bg-white/[0.01] border border-white/[0.05] rounded-xl p-6 hover:border-white/[0.1] transition-all flex flex-col justify-between"
            >
              <h2 className="text-xl font-bold mb-6 text-white tracking-tight">
                {role.role_title || role.domain_name || role.title || 'Tech Role'}
              </h2>
              
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase tracking-widest text-[10px] mb-1 font-mono font-bold">Salary Floor</span>
                  <span className="text-[#2db87a] font-bold text-2xl tracking-tight">
                    {formatSalary(role.salary_floor)}
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-white/40 uppercase tracking-widest text-[10px] mb-1 font-mono font-bold">Active Demand</span>
                  <span className="text-white/80 font-medium text-sm">
                    {role.job_count != null ? `${role.job_count} jobs` : 'Analyzing...'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="col-span-full text-center text-white/40 py-20 border border-white/[0.05] rounded-2xl bg-white/[0.01]">
              Gathering live market intelligence...
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
