import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { hrChat } from "../ai/hrChatbot.js";

const router = Router();

/**
 * POST /api/ai/chat
 * Authenticated: send a message to the HR AI chatbot.
 * Maintains per-session conversation context via sessionId.
 */
router.post("/chat", auth, async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });
    if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

    const userContext = context || {
      name: req.user.name,
      role: req.user.role,
    };

    const reply = await hrChat(sessionId, message, req.user.role, userContext);
    res.json({ reply, sessionId });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({
      reply: "I'm having trouble responding right now. Please try again shortly.",
      error: err.message,
    });
  }
});

export default router;
