export default function ToolStatusMatrix() {
  return (
    <section id="status-matrix" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">Tool Status Matrix</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">Tracking the availability and data freshness of Certifyd features.</p>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-6 py-4 font-medium">Tool</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">What it does</th>
              <th className="px-6 py-4 font-medium">Data Refresh Cadence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-400">
            <tr>
              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">ROI Calculator</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-semantic-positive/10 text-semantic-positive border border-semantic-positive/20">Live</span>
              </td>
              <td className="px-6 py-4">Analyzes expected salary bump vs certification costs</td>
              <td className="px-6 py-4 font-mono">Weekly</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">Offer Letter Analyzer</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">Beta</span>
              </td>
              <td className="px-6 py-4">Compares your offer against verified market benchmarks</td>
              <td className="px-6 py-4 font-mono">Bi-weekly</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">Market Pulse</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Coming Soon</span>
              </td>
              <td className="px-6 py-4">Macro trends in IT hiring and mandatory cert requirements</td>
              <td className="px-6 py-4 font-mono">Monthly</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">Cert Radar</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Coming Soon</span>
              </td>
              <td className="px-6 py-4">Tracks newly launched and deprecated certifications</td>
              <td className="px-6 py-4 font-mono">Real-time</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
