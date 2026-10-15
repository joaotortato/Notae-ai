import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, notasBrutas, metodo, arquivoBase64, mimeType, idioma } = await req.json();

    if (!notasBrutas && !arquivoBase64) {
      return NextResponse.json({ error: "Envie anotações ou anexe um ficheiro" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const TopicSchema = {
      type: Type.OBJECT,
      properties: {
        titulo: { 
          type: Type.STRING, 
          description: "Título formal do tema tratado" 
        },
        palavras_chave: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "4 a 6 termos técnicos essenciais" 
        },
        pergunta_gatilho_cornell: {
          type: Type.STRING,
          description: "Pergunta reflexiva para o método Cornell."
        },
        definicao_central: {
          type: Type.STRING,
          description: "Fundamentação teórica rigorosa e detalhada integrando texto e anexo."
        },
        tipo_layout_visual: {
          type: Type.STRING,
          description: "Escolha: 'fluxo' ou 'hierarquico'."
        },
        etapas_fluxo: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Sequência detalhada de causa e efeito (3 a 5 etapas)."
        },
        subtopicos_hierarquicos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              termo_destaque: { type: Type.STRING, description: "Termo de destaque para marcador" },
              explicacao_curta: { type: Type.STRING, description: "Explicação clara e aprofundada." }
            },
            required: ["termo_destaque", "explicacao_curta"]
          },
          description: "Subtópicos aprofundados."
        },
        resumo_mini_cornell: {
          type: Type.STRING,
          description: "Síntese em uma frase no rodapé do bloco."
        },
        destaque_prova: { 
          type: Type.STRING, 
          description: "Pegadinha de exame ou detalhe crítico relevante." 
        }
      },
      required: [
        "titulo", 
        "palavras_chave", 
        "definicao_central", 
        "tipo_layout_visual", 
        "subtopicos_hierarquicos", 
        "destaque_prova"
      ]
    };

    const idiomaTexto = idioma === 'en' ? 'Inglês' : idioma === 'fr' ? 'Francês' : 'Português';

    const promptText = `
Contexto / Disciplina: ${disciplina || "Geral"}
Método de Estudo: ${metodo || "cornell"}
IDIOMA OBRIGATÓRIO DE RESPOSTA: Responda TODO o conteúdo estritamente em ${idiomaTexto}.

[ANOTAÇÕES DO ESTUDANTE]:
"""
${notasBrutas || "Analise o anexo com profundidade conceitual completa."}
"""

DIRETRIZES:
1. Analise os tópicos enviados de forma completa e profunda, sem cortes.
2. Integre os conceitos visuais do anexo, caso exista.
3. Todo o vocabulário, títulos e termos no JSON Schema devem estar em ${idiomaTexto}.
`;

    const contents: any[] = [promptText];

    if (arquivoBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: arquivoBase64,
          mimeType: mimeType
        }
      });
    }

    const config = {
      systemInstruction: `Você é um professor e investigador académico de alto nível. Responda estritamente no formato JSON Schema fornecido e no idioma ${idiomaTexto}.`,
      responseMimeType: "application/json",
      responseSchema: TopicSchema,
      temperature: 0.2
    };

    let response = null;
    let ultimoErro = null;
    const maxTentativas = 3;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config
        });
        if (response?.text) break;
      } catch (err: any) {
        ultimoErro = err;
        if (tentativa < maxTentativas) {
          await new Promise((resolve) => setTimeout(resolve, tentativa * 1200));
        }
      }
    }

    if (!response?.text) {
      throw ultimoErro || new Error("Serviço temporariamente ocupado. Tente novamente em instantes.");
    }

    const data = JSON.parse(response.text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no consolidate-topic:", error);
    return NextResponse.json({ error: error?.message || "Erro ao processar conteúdo" }, { status: 500 });
  }
}