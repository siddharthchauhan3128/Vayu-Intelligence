const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.GEMINI_API_KEY || "PASTE_YOUR_GEMINI_KEY_HERE"; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Runs the Gemini AI attribution agent with context from the ward, AQI, land use, wind, and sources.
 */
const runAttributionAgent = async (wardName, city, aqi, sources, landUse, windSpeed) => {
    try {
        const topSources = (sources || [])
                            .slice(0, 3)
                            .map(s => `${s.source} (${s.percentage}%)`)
                            .join(', ');

        const prompt = `You are an urban air quality analyst for Indian cities.

Ward: ${wardName}, ${city ? city.toUpperCase() : 'MUMBAI'}
Current AQI: ${aqi} 
Land Use: ${landUse}
Wind Speed: ${windSpeed || 3.0} m/s
Top pollution sources: ${topSources}

In 2-3 sentences, explain WHY this ward has this AQI level right now. 
Be specific about the sources, mention local context about Indian cities, 
and suggest one immediate intervention. Keep it concise and actionable.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt],
            config: {
                temperature: 0.7,
                maxOutputTokens: 256,
            },
        });

        return response.text;
    } catch (error) {
        console.error("=== GEMINI AGENT ERROR ===");
        console.error(error);
        throw error;    
    }
};

module.exports = { runAttributionAgent };