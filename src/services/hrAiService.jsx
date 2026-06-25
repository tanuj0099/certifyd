export const parseOfferLetter = async (offerLetterText, userProfileData) => {
  if (!offerLetterText || offerLetterText.trim().length < 500) {
    return { error: "INVALID_DOCUMENT", message: "Document too short to be a valid offer letter." };
  }

  const prompt = `Role: You are an elite, brutally honest salary negotiation and contract analyst specialized in the 2026 Indian job market.
Task: Analyze the provided raw Offer Letter text alongside the User Profile context (City, Years of Experience, and Current Certifications) and generate a mathematically precise negotiation breakdown in JSON format.

=== INPUT DATA ===
1. USER PROFILE DATA: ${userProfileData}
2. OFFER LETTER TEXT: ${offerLetterText.substring(0, 8000)}

Extraction & Math Rules:

The Bouncer Rule: First evaluate if the text is an actual corporate job offer or appointment letter. If it is a resume, invoice, or irrelevant document, immediately stop and return an object with {"is_valid_offer": false, "rejection_reason": "Clear explanation of what was uploaded instead"}.

PII ANONYMIZATION: Do not extract, leak, or mention the candidate's real name, email, or phone number anywhere in your response (including the email script). Use placeholders like [Candidate Name] if needed.

Financial Formatting: All monetary figures MUST be calculated as ANNUAL values. If the letter provides monthly figures (e.g., Govt Pay Matrix), multiply by 12. Return as integers (e.g., 1450000). DO NOT use strings, Lakhs, or decimals for money.

The Trap Check: Actively scan the text for hidden corporate deductions like included Employer PF or Gratuity padding, clawbacks, and notice periods. NOTE: In the Indian IT sector, a 60 to 90-day notice period is the industry standard and should NOT be considered a red flag. Only flag notice periods exceeding 90 days.

Math Rules: 
- Total Fixed Base = Basic + HRA + Allowances (excluding Variable, Bonus, ESOP).
- Basic_Salary = If the offer lists a single "Fixed Component" or "Fixed Pay" without a breakdown, put the entire fixed amount here.
- HRA = Extract House Rent Allowance explicitly if present.
- Other_Allowances = Sum of remaining allowances (LTA, Special, Medical, etc., excluding HRA).
- Offered_CTC = If the letter does NOT explicitly state a Total CTC (common in Govt/PSU), calculate it yourself (Total Fixed Base + Bonus + Variable + PF + Gratuity).
- Estimated_Monthly_In_Hand_Absolute_INR = (Total Fixed Base * 0.70) / 12 (Assuming ~30% tax deduction).

Expected JSON Output Format (respond ONLY with JSON, use actual calculated integers for money):
{
  "is_valid_offer": true,
  "Offer_Metadata": {
    "Company_Name": "string",
    "Designation": "string",
    "Work_Model": "string (Remote / Hybrid / On-site)",
    "Notice_Period_Days": 0,
    "Bond_or_Clawback_Detected": false
  },
  "Compensation_Analysis": {
    "Offered_CTC": 0,
    "Offered_Fixed_Base": 0,
    "Offered_Variable": 0,
    "Breakdown": {
      "Basic_Salary": 0,
      "HRA": 0,
      "Other_Allowances": 0,
      "Joining_or_Performance_Bonus": 0,
      "Stocks_or_ESOPs_Annual_Value": 0,
      "Employer_PF_Included_In_CTC": true,
      "Gratuity_Included_In_CTC": false,
      "Estimated_Monthly_In_Hand_Absolute_INR": 0
    }
  },
  "Market_Intelligence_2026": {
    "Market_Median_Salary": 0,
    "Market_75th_Percentile": 0,
    "Percent_Difference_To_Median": 0,
    "Market_Trend_Sentence": "string (Current hiring demand velocity for this specific stack/city)",
    "Calculated_Experience_Level_For_Offer": "string (e.g. '5 years' extracted from resume context or offer letter)"
  },
  "Strategic_Negotiation_Output": {
    "Blunt_Assessment": "string (One direct sentence stating if they are being lowballed, paid fairly, or hitting above market rate)",
    "Red_Flags": ["string (List of toxic clauses, bad fixed-to-variable ratios, or padding tricks found)"],
    "Strengths": ["string (Genuine positives like high fixed base or solid equity scales)"],
    "Counter_Offer_Email_Script": "string (A copy-pasteable 2-3 sentence negotiation email script that leverages the user's certifications, experience level, and the calculated market median to request a specific, justifiable financial increase)"
  }
}`;

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
    const errData = await response.json().catch(() => ({}));
    console.error('AI API Error Details:', errData);
    throw new Error(`Failed to parse offer letter via AI: ${errData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  try {
    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.is_valid_offer === false || parsed.error === 'INVALID_DOCUMENT') {
      throw new Error(parsed.rejection_reason || 'This document does not appear to be a valid offer letter.');
    }

    // Numbers are now expected to be absolute INR
    const toAbsolute = (val) => Math.round(parseFloat(val) || 0);

    if (parsed.Compensation_Analysis) {
      const ctcRaw = parsed.Compensation_Analysis?.Offered_CTC || 0;
      const ctcAbsolute = toAbsolute(ctcRaw);
      
      const mapped = {
        // Fallback metadata so UI doesn't crash
        Analysis_Metadata: {
          Target_Location: 'India', 
          Target_Job_Title: parsed.Offer_Metadata?.Designation || 'Unknown',
          Company_Tier: 'Unknown',
          Profile_Mismatch_Flag: false,
        },
        CTC_Breakdown: {
          Total_CTC_Stated: ctcAbsolute,
          Basic_Salary: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.Basic_Salary) || toAbsolute(parsed.Compensation_Analysis?.Offered_Fixed_Base),
          HRA: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.HRA),
          Other_Allowances: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.Other_Allowances),
          Joining_Bonus: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.Joining_or_Performance_Bonus),
          Variable_PLVP: toAbsolute(parsed.Compensation_Analysis?.Offered_Variable),
          ESOP_Annual_Vesting_Value: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.Stocks_or_ESOPs_Annual_Value),
          Estimated_Monthly_In_Hand: parsed.Compensation_Analysis?.Breakdown?.Estimated_Monthly_In_Hand_Absolute_INR || 0,
        },
        Market_Context: {
          Calculated_Experience_Level_For_Offer: parsed.Market_Intelligence_2026?.Calculated_Experience_Level_For_Offer || "0 years"
        },
        Database_Payload: {
          fixed_base: toAbsolute(parsed.Compensation_Analysis?.Offered_Fixed_Base),
          variable_pay: toAbsolute(parsed.Compensation_Analysis?.Offered_Variable),
          company_tier: "Unknown",
          role: parsed.Offer_Metadata?.Designation || "Unknown",
          notice_period_days: parsed.Offer_Metadata?.Notice_Period_Days || 0,
          company_name: parsed.Offer_Metadata?.Company_Name || null,
          work_model: parsed.Offer_Metadata?.Work_Model || null,
          bond_or_clawback_detected: parsed.Offer_Metadata?.Bond_or_Clawback_Detected || false,
          employer_pf_included: parsed.Compensation_Analysis?.Breakdown?.Employer_PF_Included_In_CTC || false,
          gratuity_included: parsed.Compensation_Analysis?.Breakdown?.Gratuity_Included_In_CTC || false,
          joining_bonus: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.Joining_or_Performance_Bonus),
          allowances_and_perks: toAbsolute(parsed.Compensation_Analysis?.Breakdown?.Allowances_and_Perks)
        },
        // Preserve all the new elite data for the UI
        ...parsed
      };
      return mapped;
    }

    return parsed;
  } catch (error) {
    console.error("JSON parsing error:", content);
    throw new Error(error.message || 'AI returned invalid JSON format');
  }
};
