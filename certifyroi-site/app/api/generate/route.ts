import { VertexAI } from '@google-cloud/vertexai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // The SDK initializes using your active cloud project context
    const vertexAI = new VertexAI({
      project: 'skills-developer-496409', // Pulled directly from your active GCP header
      location: 'us-central1'
    });

    // Enforcing Gemini 3.1 Pro Preview for dense analytical processing
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-3.1-pro-preview',
      generationConfig: {
        responseMimeType: 'application/json', // Guarantees structural layout integrity
        temperature: 0.2,                     // Keeps outputs predictable and deterministic
      }
    });

    const responseStream = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await responseStream.response;
    const cleanOutput = response.candidates?.[0].content.parts[0].text;

    return new Response(cleanOutput, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Core Pipeline Disruption' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}