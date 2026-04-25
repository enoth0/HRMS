import { HfInference } from "@huggingface/inference";
import Employee from "../models/Employee.js";

const hf = new HfInference(process.env.HF_API_TOKEN);

/**
 * Get a text embedding vector from HuggingFace.
 *
 * @param {string} text - Text to embed.
 * @returns {Promise<number[]>} Embedding vector.
 */
export async function getEmbedding(text) {
  const result = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
  });
  return Array.isArray(result[0]) ? result[0] : result;
}

/**
 * Compute cosine similarity between two vectors.
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Similarity score between -1 and 1.
 */
export function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Build a searchable text profile for an employee.
 * @param {Object} employee
 * @returns {string}
 */
function buildEmployeeProfile(employee) {
  return [
    employee.name,
    employee.designation,
    employee.department,
    employee.email,
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * Semantic employee search using sentence embeddings.
 * Compares query embedding to stored (or on-the-fly computed) profile embeddings.
 *
 * @param {string} query - Natural language search query.
 * @param {number} topK - Number of results to return.
 * @returns {Promise<Array<{ employee: Object, score: number }>>}
 */
export async function semanticSearch(query, topK = 5) {
  const queryVec = await getEmbedding(query);

  const employees = await Employee.find({ status: "active" }).lean();

  const scored = await Promise.all(
    employees.map(async (emp) => {
      let empVec = emp.profileEmbedding;
      if (!empVec || empVec.length === 0) {
        // Compute on-the-fly if not pre-computed
        try {
          empVec = await getEmbedding(buildEmployeeProfile(emp));
          // Persist for future queries (fire-and-forget)
          Employee.findByIdAndUpdate(emp._id, { profileEmbedding: empVec }).catch(() => {});
        } catch {
          return { employee: emp, score: 0 };
        }
      }
      const score = cosineSimilarity(queryVec, empVec);
      return { employee: emp, score: Math.round(score * 1000) / 1000 };
    })
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((r) => r.score > 0.1); // Filter out very low relevance
}
