import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, notasBrutas, metodo, arquivoBase64, mimeType } = await req.json();

    if (!notasBrutas && !arquivoBase64) {
      return NextResponse.json({ error: "Envie anotações ou anexe um arquivo" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const TopicSchema = {
      type: Type.OBJECT,
      properties: {
        titulo: { 
          type: Type.STRING, 
          description: "Título formal e completo do tema tratado" 
        },
        palavras_chave: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "4 a 6 termos essenciais ou variáveis-chave" 
        },
        pergunta_gatilho_cornell: {
          type: Type.STRING,
          description: "Pergunta reflexiva conceitual para estudo ativo e autorrevisão."
        },
        definicao_central: {
          type: Type.STRING,
          description: "Fundamentação teórica rica e detalhada. Explique causas, consequências, mecanismos físicos/econômicos e definições formais sem abreviações."
        },
        tipo_layout_visual: {
          type: Type.STRING,
          description: "Escolha: 'fluxo' ou 'hierarquico'."
        },
        etapas_fluxo: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Se houver relação de causa e efeito, de 3 a 5 passos encadeados."
        },
        subtopicos_hierarquicos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              termo_destaque: { type: Type.STRING, description: "Conceito destacado para marca-texto" },
              explicacao_curta: { type: Type.STRING, description: "Explicação aprofundada dissecando a ideia." }
            },
            required: ["termo_destaque", "explicacao_curta"]
          },
          description: "Subtópicos detalhados cobrindo integralmente as notas do aluno."
        },
        resumo_mini_cornell: {
          type: Type.STRING,
          description: "Síntese conclusiva clara no rodapé do bloco."
        },
        destaque_prova: { 
          type: Type.STRING, 
          description: "Alerta de pegadinha de exame, condições de contorno e pontos críticos de prova." 
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

    const promptText = `
Contexto / Disciplina: ${disciplina || "Geral"}
Método Pedagógico: ${metodo || "cornell"}

[ANOTAÇÕES DO ESTUDANTE]:
"""
${notasBrutas || "Analise o anexo com profundidade conceitual completa."}
"""

DIRETRIZES DE QUALIDADE ACADÊMICA:
1. NÃO resuma de forma superficial. Desenvolva explicações didáticas, aprofundadas e claras.
2. Discuta mecanismos teóricos, fórmulas associadas, causas e impactos práticos.
3. Se houver imagem ou PDF anexado, integre os elementos visuais diretamente às anotações do estudante.
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
      systemInstruction: "Você é um tutor acadêmico rigoroso e didático. Sua meta é gerar explicações claras, profundas e completas sem limitar arbitrariamente o tamanho. Responda estritamente no JSON Schema fornecido.",
      responseMimeType: "application/json",
      responseSchema: TopicSchema,
      temperature: 0.25
    };

    // Modelo leve de alta disponibilidade e baixa latência
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents,
      config
    });

    const data = JSON.parse(response.text || "{}");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no consolidate-topic:", error);
    return NextResponse.json({ error: error?.message || "Erro ao processar" }, { status: 500 });
  }
}