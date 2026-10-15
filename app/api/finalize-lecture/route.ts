import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, topicosAcumulados } = await req.json();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const FinalizeSchema = {
      type: Type.OBJECT,
      properties: {
        resumo_executivo: { 
          type: Type.STRING, 
          description: "Síntese executiva densa conectando todos os tópicos vistos na aula." 
        },
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              frente: { 
                type: Type.STRING, 
                description: "Pergunta desafiadora de fixação ativa." 
              },
              verso: { 
                type: Type.STRING, 
                description: "Resposta precisa e técnica." 
              }
            },
            required: ["frente", "verso"]
          }
        }
      },
      required: ["resumo_executivo", "flashcards"]
    };

    const prompt = `
Disciplina: ${disciplina || "Geral"}
Tópicos consolidados:
${JSON.stringify(topicosAcumulados, null, 2)}

Sintetize a aula e crie de 3 a 5 flashcards de alto impacto para memorização ativa.
`;

    const config = {
      systemInstruction: "Você é um especialista em síntese académica e Active Recall. Responda estritamente no JSON Schema fornecido.",
      responseMimeType: "application/json",
      responseSchema: FinalizeSchema,
      temperature: 0.2
    };

    let response = null;
    let ultimoErro = null;

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config
        });
        if (response?.text) break;
      } catch (err: any) {
        ultimoErro = err;
        if (tentativa < 3) {
          await new Promise((resolve) => setTimeout(resolve, tentativa * 1000));
        }
      }
    }

    if (!response?.text) {
      throw ultimoErro || new Error("Erro ao sintetizar aula");
    }

    const data = JSON.parse(response.text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no finalize-lecture:", error);
    return NextResponse.json({ error: error?.message || "Erro ao sintetizar" }, { status: 500 });
  }
}