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
          description: "Síntese executiva articulando a conexão entre todos os tópicos vistos." 
        },
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              frente: { 
                type: Type.STRING, 
                description: "Pergunta desafiadora de Active Recall estilo exame." 
              },
              verso: { 
                type: Type.STRING, 
                description: "Resposta precisa, técnica e concisa." 
              }
            },
            required: ["frente", "verso"]
          }
        }
      },
      required: ["resumo_executivo", "flashcards"]
    };

    const prompt = `
Disciplina: ${disciplina}
Tópicos abordados:
${JSON.stringify(topicosAcumulados, null, 2)}

Sintetize a aula e crie de 3 a 5 flashcards de alto impacto acadêmico.
`;

    const config = {
      systemInstruction: "Você é um tutor acadêmico de Active Recall. Responda estritamente no JSON Schema.",
      responseMimeType: "application/json",
      responseSchema: FinalizeSchema,
      temperature: 0.2,
      thinkingConfig: {
        thinkingLevel: "low" as const
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config
      });
    } catch {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config
      });
    }

    const data = JSON.parse(response.text || "{}");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no finalize-lecture:", error);
    return NextResponse.json({ error: error?.message || "Erro ao sintetizar" }, { status: 500 });
  }
}