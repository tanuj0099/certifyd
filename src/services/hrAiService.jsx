export const parseOfferLetter = async (offerLetterText, userProfileData) => {
  const prompt = `You are an expert Compensation Analyst and Data Extraction Engine specializing ONLY in the Indian IT sector. Your job is to analyze an uploaded Job Offer Letter alongside the candidate's self-reported Resume/Profile data.

=== INPUT DATA ===
1. USER PROFILE DATA: ${userProfileData}
2. OFFER LETTER TEXT: ${offerLetterText.substring(0, 8000)}

=== RULE 1: THE GEOGRAPHIC GATEKEEPER (CRITICAL) ===
Check the locations mentioned in the Resume and the Offer Letter. If EITHER document indicates a primary location outside of India (e.g., "Los Angeles, CA", "USA", "London", "Dubai"), you must ABORT the analysis. 
Note: Cities like Navi Mumbai, Mumbai, Bangalore, Pune, NCR, etc., ARE in India. Do not incorrectly flag Indian cities as unsupported.
Output ONLY this JSON:
{
  "Analysis_Metadata": {
    "Unsupported_Region": true,
    "Mismatch_Warning_Message": "Certifyd MVP currently only supports salary intelligence for the Indian IT market. Global support is coming soon."
  }
}

=== RULE 2: THE HIERARCHY OF TRUTH (Conflict Resolution) ===
- LOCATION: If the Offer Letter explicitly states an Indian job location (e.g., "Hyderabad"), this OVERRIDES the Resume's city (e.g., "Bangalore"). 
- JOB TITLE: The \`Target_Job_Title\` must be the exact title on the Offer Letter. 
- EXPERIENCE MISMATCH: Compare the Resume's YoE with the Offer Job Title. If the user claims 3+ years of experience but the offer is for a "Trainee" or "Fresher", set "Profile_Mismatch_Flag" to TRUE and generate a warning.

=== RULE 3: INDIAN PAYROLL MATH & BUCKETING ===
Group the CTC components EXACTLY as follows:
- "Fixed_Base": Basic Salary + HRA + Conveyance + LTA + Special/Guaranteed monthly allowances.
- "Variable_Bonus": Annual Bonus + Performance Pay + Relocation.
- "Retirals_And_Hidden": Provident Fund (Employer & Employee) + Gratuity + ESI. 
- "ESOP_Stocks": Value of vested stock options for year 1.
- "Estimated_Monthly_In_Hand": (Fixed_Base / 12) MINUS (Employee PF + ESI monthly deductions).
All numerical outputs in the \`CTC_Breakdown\` object MUST be rounded to the nearest whole integer. Do not output any decimals.

=== RULE 4: CONTEXTUAL AWARENESS ===
- Extract the Date/Year of the Offer Letter. If from a past year (e.g., 2017), set "Historical_Data_Flag" to TRUE.

=== OUTPUT FORMAT ===
If the region is supported (India), output a valid JSON object matching this exact schema:
{
  "Analysis_Metadata": {
    "Unsupported_Region": false,
    "Target_Location": "[Resolved Location]",
    "Target_Job_Title": "[Exact title from offer]",
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
    "Calculated_Experience_Level_For_Offer": "[e.g., 0 years / Fresher]",
    "UI_Status_Message": "[Generate a precise UI message explaining the evaluation]"
  }
}

CRITICAL: You must output ONLY raw, valid JSON. DO NOT wrap the JSON in markdown code blocks (e.g., no \`\`\`json). DO NOT include any conversational text before or after the JSON.`

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
