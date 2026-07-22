const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Hackathon Trick: Fallback to the hardcoded key if Docker fails to load the .env file
// REPLACE the fallback string below with your actual API key!
const API_KEY = process.env.GEMINI_API_KEY || "PASTE_YOUR_GEMINI_KEY_HERE"; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

router.post('/analyze', async (req, res) => {
  try {
    const { ward_name, aqi, pm25, pm10, land_use_type, population } = req.body;

    const systemInstruction = `
      You are 'Vayu', an AI Urban Air Quality Intelligence agent for Indian Smart Cities.
      Analyze the current environmental data for the given ward and output a concise, 3-bullet-point intervention plan for municipal officers.
      
      Rules:
      1. Be highly specific to the land use type (e.g., if industrial, mention factories/emissions).
      2. Keep it under 100 words.
      3. Tone: Urgent, objective, and authoritative.
    `;

    const userPrompt = `
      Ward: ${ward_name || 'Unknown'}
      AQI: ${aqi || 0}
      PM2.5: ${pm25 || 0} µg/m³
      PM10: ${pm10 || 0} µg/m³
      Zone Type: ${land_use_type || 'Mixed'}
      Population At Risk: ${population || 'Unknown'}
      
      Provide the rapid intervention breakdown.
    `;

    // Call the Gemini model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, 
      }
    });

    res.json({ success: true, analysis: response.text });
  } catch (error) {
    // This will print the EXACT reason Gemini failed to your Docker logs
    console.error("=== GEMINI AGENT ERROR ===");
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to generate AI analysis" });
  }
});

module.exports = router;