import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Screen a resume against a job description using Gemini.
 * Returns a structured AI analysis object.
 *
 * @param {string} resumeText - Plain text content of the resume.
 * @param {string} jobDescription - Job description to match against.
 * @returns {Promise<{score: number, summary: string, skillsMatched: string[], skillsMissing: string[], recommendation: string, reasoning: string}>}
 */
export async function screenResume(resumeText, jobDescription) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an expert HR recruiter. Analyze the following resume against the job description.
Return a JSON object with exactly these fields:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence candidate summary>",
  "skillsMatched": ["skill1", "skill2"],
  "skillsMissing": ["skill1", "skill2"],
  "recommendation": "shortlist" | "reject" | "hold",
  "reasoning": "<1-2 sentences explaining the recommendation>"
}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Return ONLY valid JSON. No markdown, no explanation.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  // Strip any accidental markdown code fences
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
}
