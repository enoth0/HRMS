import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.3,
});

/** Per-session conversation memory (sessionId → BufferMemory) */
const sessionMemory = new Map();

// Cleanup old sessions after 1 hour to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, meta] of sessionMemory.entries()) {
    if (now - meta.lastAccessed > 60 * 60 * 1000) {
      sessionMemory.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Process a chat message from an HR system user.
 * Maintains per-session conversation history.
 *
 * @param {string} sessionId - Unique session identifier from the client.
 * @param {string} userMessage - The user's message.
 * @param {string} userRole - The user's HRMS role.
 * @param {Object} userContext - Additional user context (name, department, etc.).
 * @returns {Promise<string>} AI assistant reply.
 */
export async function hrChat(sessionId, userMessage, userRole, userContext) {
  if (!sessionMemory.has(sessionId)) {
    sessionMemory.set(sessionId, {
      memory: new BufferMemory(),
      lastAccessed: Date.now(),
    });
  }

  const session = sessionMemory.get(sessionId);
  session.lastAccessed = Date.now();

  const chain = new ConversationChain({ llm, memory: session.memory });

  const systemContext = `
You are an intelligent HR assistant for a company's HRMS platform.
User role: ${userRole}
User context: ${JSON.stringify(userContext)}
Today's date: ${new Date().toISOString().split("T")[0]}

Capabilities by role:
- employee: answer queries about leave policy, salary, company policies, their own attendance and payroll data.
- hr_recruiter: help with recruitment workflows, shortlisting criteria, HR policies, payroll calculations.
- admin/senior_manager: strategic HR insights, team analytics, compliance queries.

Always be professional and concise. Only discuss data the user is authorized to access.
For questions outside HR scope, politely redirect.
`;

  const response = await chain.call({
    input: `${systemContext}\n\nUser: ${userMessage}`,
  });

  return response.response;
}
