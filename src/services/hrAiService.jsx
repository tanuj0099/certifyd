export const parseOfferLetter = async (offerLetterText, userProfileData) => {
  const prompt = `You are an expert Compensation Analyst and Data Extraction Engine specializing ONLY in the Indian IT sector. Your job is to analyze an uploaded Job Offer Letter alongside the candidate's self-reported Resume/Profile data.

=== INPUT DATA ===
1. USER PROFILE DATA: ${userProfileData}
2. OFFER LETTER TEXT: ${offerLetterText.substring(0, 8000)}

=== STRICT SEMANTIC REASONING RULES ===

=== 1. THE GEO-REASONING RULE (Client vs. Residence) ===
- Determine the candidate's ACTUAL PHYSICAL RESIDENCE or base of operations. 
- If a candidate lives in India (e.g., Gorakhpur, Hubballi, Bangalore, NCR) but works remotely for an international client or states a past international stint, the profile IS SUPPORTED. 
- Do not blindly reject a profile if a foreign city (e.g., "London", "USA", "Dubai") is mentioned as a client location or past role.
- ONLY abort/reject if the candidate's primary residence/work location is currently outside of India.
- Output for unsupported: { "Analysis_Metadata": { "Unsupported_Region": true, "Mismatch_Warning_Message": "Certifyd MVP currently only supports salary intelligence for the Indian IT market. Global support is coming soon." } }

=== 2. THE RELEVANT EXPERIENCE RULE (The Time Splitter) ===
- Candidates often list total chronological experience, which includes irrelevant past careers (e.g., farming, retail, physical labor).
- You MUST separate "Total Experience" from "Relevant Tech/Corporate Experience".
- Calculate the \`Calculated_Experience_Level_For_Offer\` ONLY based on the months/years spent in IT, Tech, or standard Corporate roles. Ignore time spent in unrelated fields.
- STRICT EXPERIENCE MATH: You must mathematically calculate the years of experience from the user's provided resume text. Subtract the earliest relevant start year from the current year (2026). If the resume shows work from 2022 to 2026, the experience is 4 years. Output in the format: "X years". Do NOT default to 0 unless no history is provided.

=== 3. THE FUNCTIONAL TITLE OVERRIDE ===
- Ignore HR payroll glitches or nominal titles if they conflict with the actual day-to-day work.
- If a nominal title is "Marketing Executive" or "Data Plumber", but the bullet points explicitly describe writing Python, managing databases, and using AWS, you MUST classify their \`Target_Job_Title\` as the functional equivalent (e.g., "Junior Backend Engineer" or "Cloud Engineer").
- The \`Target_Job_Title\` normally matches the exact title on the Offer Letter, unless overridden by this rule.
- STRICT TITLE NORMALIZATION: NEVER output startup jargon, "ninja", "rockstar", or internal band codes (like "SDE-1" without context) as the final title. You MUST map the job to a clean, standard industry benchmark title (e.g., "Backend Software Engineer", "Data Analyst"). If the letter says "Code Ninja", output "Backend Engineer".

=== 4. NOISE FILTERING & TYPO NORMALIZATION ===
- Resumes contain fluff. Completely ignore hobbies, non-professional certifications (e.g., "Master Scuba Diver"), and physical labor skills.
- Normalize spelling errors in the tech stack (e.g., map "Pythn" to "Python", "devOOps" to "DevOps", "Certifid" to "Certified"). Only extract valid, recognized IT/Corporate skills and certifications.

=== 5. COMPANY TIERING ===
- You must identify the hiring company from the offer letter and classify its tier.
- "Tier_1_Product": Big Tech (Google, Amazon, Microsoft, etc.), global investment banks, or massive unicorns.
- "Tier_2_MidMarket": Growth-stage startups, mid-sized product companies, and established regional tech firms.
- "Tier_3_Services": IT Service/Consulting firms (TCS, Wipro, Infosys, Cognizant, Tech Mahindra), mass recruiters, or extremely small early-stage startups.
- "Unknown": If the company name is not discernible.

=== 6. THE HIERARCHY OF TRUTH (Conflict Resolution) ===
- LOCATION: If the Offer Letter explicitly states an Indian job location (e.g., "Hyderabad"), this OVERRIDES the Resume's city. 
- EXPERIENCE MISMATCH: Compare the Resume's YoE with the Offer Job Title. If the user claims 3+ years of experience but the offer is for a "Trainee" or "Fresher", set "Profile_Mismatch_Flag" to TRUE and generate a warning.

=== 7. INDIAN PAYROLL MATH & BUCKETING ===
Group the CTC components EXACTLY as follows:
- "Fixed_Base": Basic Salary + HRA + Conveyance + LTA + Special/Guaranteed monthly allowances.
- "Variable_Bonus": Annual Bonus + Performance Pay + Relocation.
- "Retirals_And_Hidden": Provident Fund (Employer & Employee) + Gratuity + ESI. 
- "ESOP_Stocks": Value of vested stock options for year 1.
- "Estimated_Monthly_In_Hand": (Fixed_Base / 12) MINUS (Employee PF + ESI monthly deductions).
All numerical outputs in the \`CTC_Breakdown\` object MUST be rounded to the nearest whole integer. Do not output any decimals.

=== 8. CONTEXTUAL AWARENESS ===
- Extract the Date/Year of the Offer Letter. If from a past year (e.g., 2017), set "Historical_Data_Flag" to TRUE.

=== OUTPUT FORMAT ===
If the region is supported (India), output a valid JSON object matching this exact schema:
{
  "Analysis_Metadata": {
    "Unsupported_Region": false,
    "Target_Location": "[Resolved Location]",
    "Target_Job_Title": "[Resolved Functional Title or Exact title from offer]",
    "Company_Tier": "Tier_1_Product" | "Tier_2_MidMarket" | "Tier_3_Services" | "Unknown",
    "Offer_Year": "[YYYY]",
    "Historical_Data_Flag": boolean,
    "Profile_Mismatch_Flag": boolean,
    "Mismatch_Warning_Message": "[Warning string if applicable, else null]"
  },
  "CTC_Breakdown": {
    "Total_CTC_Stated": number,
    "Fixed_Base_Annual": number,
    "Variable_Bonus_Annual": number,
    "Retirals_And_Hidden_Annual": number,
    "ESOP_Stocks_Annual": number,
    "Estimated_Monthly_In_Hand": number
  },
  "Market_Context": {
    "Calculated_Experience_Level_For_Offer": "[e.g., 0 years / Fresher, based ONLY on relevant tech/corporate experience]",
    "UI_Status_Message": "[Generate a precise UI message explaining the evaluation]"
  }
}

CRITICAL: You must output ONLY raw, valid JSON. DO NOT wrap the JSON in markdown code blocks (e.g., no \`\`\`json). DO NOT include any conversational text before or after the JSON.`;

  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error('Failed to parse offer letter via AI');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  try {
    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON parsing error:", content);
    throw new Error('AI returned invalid JSON format');
  }
};
