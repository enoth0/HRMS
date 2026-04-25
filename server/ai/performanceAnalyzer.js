import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an AI-powered performance review summary using Gemini.
 *
 * @param {{ name: string, designation: string, department: string }} employeeData
 * @param {Array<{ title: string, target: string, achieved: string, score: number }>} goals
 * @param {number} overallScore - Overall score out of 100.
 * @returns {Promise<{executiveSummary: string, strengths: string[], areasForImprovement: string[], developmentRecommendations: string[], rating: string}>}
 */
export async function generatePerformanceSummary(employeeData, goals, overallScore) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Analyze this employee performance data and generate a professional review summary.
Return JSON with exactly these fields:
{
  "executiveSummary": "<3-4 sentences>",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2"],
  "developmentRecommendations": ["recommendation1", "recommendation2"],
  "rating": "Exceptional" | "Exceeds Expectations" | "Meets Expectations" | "Needs Improvement"
}

Employee: ${employeeData.name}, ${employeeData.designation} (${employeeData.department})
Overall Score: ${overallScore}/100

Goals:
${goals
  .map(
    (g) =>
      `- ${g.title}: Target "${g.target}", Achieved "${g.achieved || "N/A"}", Score ${g.score}/10`
  )
  .join("\n")}

Return ONLY valid JSON. No markdown, no explanation.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
}
