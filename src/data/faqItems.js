// ─── FAQ items extracted from App.jsx ────────────────────
// 20 questions, no corporate speak.
export const FAQ_ITEMS = [
  {
    category: "Product",
    q: "Is Certify free?",
    a: "Yes. The ROI calculator, city demand heatmap, cert comparison, career simulator, and job-cert map are all free with no account required. You get 3 free AI analyses as a guest. Sign in with Google for unlimited free AI analyses.",
  },
  {
    category: "Product",
    q: "What is the difference between Resume AI and the ROI Calculator?",
    a: "Resume AI (Step 1) is for discovery — you don't know which cert to pursue. You upload your resume and the AI reads your background and recommends the top 3 certifications. ROI Calculator (Step 2) is for validation — you already know which cert and want the exact financial numbers: break-even to the month, 5-year net gain, monthly salary delta, and an AI verdict.",
  },
  {
    category: "Product",
    q: "Why does Student Mode exist?",
    a: "Standard ROI calculators assume you have a salary to compare against. Students don't. Student Mode removes salary sliders entirely and reframes the calculation around time-to-first-offer, fresher benchmarks in your city, and career investment ROI. The cert recommendations also shift — Student Mode prioritises certs with strong fresher hiring signals over certs that maximise salary hikes for experienced professionals.",
  },
  {
    category: "Product",
    q: "What is Pitch Your Boss?",
    a: "Pitch Your Boss generates a professional email for professionals who need to justify a certification to their manager for company sponsorship. You enter the cert name, your current role, and expected ROI, and it produces a data-backed email you can send or adapt. Only available in Professional mode because that's the context where this conversation actually happens.",
  },
  {
    category: "Product",
    q: "What is the Cert to Job Map?",
    a: "The Job-Cert Map shows which certifications are required or preferred for specific roles across government positions (UPSC, SSC, PSU exams) and private sector roles at major Indian employers. Government data is from official recruitment notifications. Private sector data is employee-reported via LinkedIn and AmbitionBox.",
  },
  {
    category: "Product",
    q: "How is Career Simulator different from the ROI Calculator?",
    a: "ROI Calculator analyses one certification: what does THIS cert do to your salary over 5 years. Career Simulator models a multi-cert trajectory: if you do AWS SAA now, then CKA in 18 months, then AWS DevOps Pro after that, what does your salary curve look like at each milestone. It's for planning a 3–5 year path, not evaluating a single decision.",
  },
  {
    category: "Data & Accuracy",
    q: "How accurate are the salary figures?",
    a: "Salary data is sourced from LinkedIn Economic Graph India, NASSCOM 2026 talent survey, Naukri salary insights, and AmbitionBox self-reported data. All figures are medians — half of earners are above, half below. Individual results vary based on company tier, negotiation skill, and market conditions. We update quarterly. We do not guarantee these numbers will match your specific situation.",
  },
  {
    category: "Data & Accuracy",
    q: "Is my resume stored anywhere?",
    a: "No. Resume text is processed in real-time via Groq inference and is not stored, logged, or retained. The text goes in, analysis comes out, and the data is gone. We do not have access to your resume after the analysis completes — this is how the system is architecturally designed, not just a policy statement.",
  },
  {
    category: "Data & Accuracy",
    q: "My city isn't one of the 8. What happens?",
    a: "We have city-specific data for Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai, Kolkata, and Ahmedabad. If your city isn't in our database, we use the Haversine formula — a geographic distance calculation using latitude and longitude — to find the nearest city and show that data with a clear disclosure. India national median is also shown below for comparison.",
  },
  {
    category: "Data & Accuracy",
    q: "How often is the cert database updated?",
    a: "The certification list is reviewed quarterly. New certs are added when they appear in 50+ job postings on Naukri in a 30-day period. Salary hike data updates quarterly. Demand data (job posting counts) updates monthly. The last full update was Q1 2026.",
  },
  {
    category: "Career Questions",
    q: "I have no tech background. Can I still use Certify?",
    a: "Yes. Certify covers finance (CFA, FMVA, CMA, CA, NISM), management (PMP, CSM, Six Sigma), marketing (Google, HubSpot, Meta), HR (SHRM, People Analytics), product management, architecture (LEED), medical (DNB, USMLE, ACRP), law, civil and mechanical engineering, and government exam prep (GATE, UPSC, SSC, IBPS). Tech is one of 17 domains.",
  },
  {
    category: "Career Questions",
    q: "I want to switch careers completely. Where do I start?",
    a: "Upload your resume in Step 1 and select Switcher mode. The AI will identify your transferable skills and suggest the fastest viable certification path to your target domain. The fastest ROI switches we've seen data on: ops/finance → data analytics (IBM Data Science, 5 months), backend dev → cloud (AWS SAA, 3 months), MBBS → clinical research (ACRP CRA, 4 months).",
  },
  {
    category: "Career Questions",
    q: "For switchers and professionals, are long-term certs like CA or CFA shown?",
    a: 'For Switchers and Professionals, fast-track certifications (completable in under 6 months) are shown first by default. Long-term programs (CA, CFA, ACCA) are hidden unless you explicitly toggle "Show long-term options." Someone looking to move in the next 6 months shouldn\'t be pushed toward a 3-year program.',
  },
  {
    category: "Career Questions",
    q: "Can Certify help with government exam planning?",
    a: "We can show you the ROI profile of government exams — starting salaries, allowances, career trajectories, prep costs, and realistic success rates. We can't help with actual exam preparation content. Use us to decide if a government path makes sense for your profile and situation — not to prepare for it.",
  },
  {
    category: "Technical",
    q: "The AI analysis gave me a weird result. What should I do?",
    a: "AI responses vary slightly each time. If the result looks wrong, refresh and re-run. If you're getting consistently poor results, the issue is likely the resume input: very short resumes (under 150 words), PDF extraction errors, or heavily formatted PDFs with tables produce poor analysis. Try pasting your resume text directly into the text area.",
  },
  {
    category: "Technical",
    q: "My PDF isn't being read correctly. Why?",
    a: "PDF text extraction works on standard text-based PDFs. Issues occur with: scanned PDFs (image-based, no text layer), complex table layouts, custom embedded fonts, and password-protected files. If extraction fails, paste your resume text directly — same results, none of the PDF issues.",
  },
  {
    category: "Technical",
    q: "Why does the app ask me to choose Student, Switcher, or Professional?",
    a: "Your mode changes how the tool works fundamentally, not just cosmetically. Student Mode removes salary assumptions and focuses on first-offer benchmarks. Switcher Mode surfaces fast-track certs and filters long programs. Professional Mode enables Pitch Your Boss and shows full hike data. Wrong mode = inaccurate recommendations. Pick the one that honestly describes where you are.",
  },
  {
    category: "Technical",
    q: "Is there a mobile app?",
    a: "Certify is a mobile-optimised web app. Open certifyroi.vercel.app in your mobile browser — all tools work fully on any screen size. You can add it to your home screen from Safari or Chrome for an app-like experience without an App Store install.",
  },
  {
    category: "Technical",
    q: "Why does my session reset when I close the tab?",
    a: "Guest preferences are stored in localStorage and persist across sessions on the same device. Guest AI analysis count resets if you clear browser data. Sign in with Google to save your analysis history, cert preferences, and profile across all devices permanently.",
  },
  {
    category: "Technical",
    q: "I found incorrect salary data. How do I report it?",
    a: "We want to know. Use the Contact page and include: the cert name, your city, the figure you saw on Certify, and a link to a data source you believe is more accurate. We review all reported corrections and update the database quarterly. Your correction may help thousands of other professionals make a better decision.",
  },
]

export const FAQ_CATEGORIES = ["Product", "Data & Accuracy", "Career Questions", "Technical"]
