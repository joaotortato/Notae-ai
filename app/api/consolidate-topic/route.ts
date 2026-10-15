import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, notasBrutas, metodo, arquivoBase64, mimeType, idioma } = await req.json();

    if (!notasBrutas && !arquivoBase64) {
      return NextResponse.json({ error: "Envie anotações ou anexe um ficheiro" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const idiomaTexto = idioma === 'en' ? 'English' : idioma === 'fr' ? 'Français' : 'Português';

    const jsonFormatInstructions = `
Você é um professor e pesquisador de alto nível.
Sua resposta DEVE ser estritamente um JSON válido (sem tags markdown de código \`\`\`json, apenas o JSON puro) seguindo este esquema:
{
"titulo": "Título formal do tema tratado",
"palavras_chave": ["termo1", "termo2", "termo3", "termo4"],
"pergunta_gatilho_cornell": "Pergunta reflexiva de alto nível",
"definicao_central": "Fundamentação teórica rigorosa e detalhada integrando texto e anexo.",
"tipo_layout_visual": "fluxo ou hierarquico",
"etapas_fluxo": ["Etapa 1", "Etapa 2", "Etapa 3"],
"subtopicos_hierarquicos": [
{ "termo_destaque": "Conceito 1", "explicacao_curta": "Explicação profunda." },
{ "termo_destaque": "Conceito 2", "explicacao_curta": "Explicação profunda." }
],
"resumo_mini_cornell": "Síntese de uma frase no rodapé do bloco.",
"destaque_prova": "Pegadinha de exame ou detalhe crítico relevante."
}
Todo o conteúdo DEVE estar estritamente no idioma: ${idiomaTexto}.
`;

    const userPrompt = `
Contexto / Disciplina: ${disciplina || "Geral"}
Método de Estudo: ${metodo || "cornell"}

[ANOTAÇÕES DO ESTUDANTE]:
"""
${notasBrutas || "Analise o anexo com profundidade conceitual completa."}
"""

DIRETRIZES:
1. Analise de forma completa e profunda, sem cortes.
2. Integre os conceitos visuais do anexo, caso exista.
`;

    // Se houver imagem anexada, usa o modelo de visão; se for só texto, usa o Llama 3.3 70B
    let model = "llama-3.3-70b-versatile";
    const messages: any[] = [
      { role: "system", content: jsonFormatInstructions }
    ];

    if (arquivoBase64 && mimeType && mimeType.startsWith("image/")) {
      model = "llama-3.2-11b-vision-preview";
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${arquivoBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: userPrompt
      });
    }

    const chatCompletion = await groq.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(rawContent);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no Groq consolidate-topic:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao processar conteúdo com Groq" },
      { status: 500 }
    );
  }
}