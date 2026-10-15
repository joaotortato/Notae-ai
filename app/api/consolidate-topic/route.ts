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
Você é um estudante universitário de elite (Engenharia e Ciências Exatas em instituição de alto nível acadêmico).
Seu objetivo é transformar anotações rápidas de aula, rascunhos e imagens em anotações de caderno impecáveis, organizadas e de alto rigor conceitual.

PERFIL DE REGISTO:
1. RIGOR E SÍNTESE EFICIENTE: Não use enrolação nem introduções óbvias. Vá direto ao cerne teórico do que o professor explicou.
2. APROFUNDAMENTO TÉCNICO: Complete lacunas lógicas deixadas pelas notas rápidas. Se o tópico envolver fórmulas matemáticas, equações de equilíbrio, grandezas físicas ou parâmetros normativos, descreva-os com precisão e destaque as suas relações.
3. LEGIBILIDADE PARA REVISÃO RÁPIDA: Ao bater o olho no caderno antes de uma prova, o estudante deve recordar imediatamente a linha de raciocínio da aula, os conceitos-chave e as armadilhas conceituais.
4. INTEGRAÇÃO VISUAL: Se houver imagem (slide, esquema estrutural, quadro ou diagrama), extraia todos os detalhes técnicos, variáveis e etapas representadas.

Sua resposta DEVE ser estritamente um JSON válido (sem blocos markdown \`\`\`json, apenas o JSON puro) seguindo este esquema:
{
  "titulo": "Título técnico preciso e contextualizado do tópico da aula",
  "palavras_chave": ["Termo Técnico 1", "Conceito 2", "Variável/Equação 3", "Parâmetro 4"],
  "pergunta_gatilho_cornell": "Pergunta reflexiva incisiva que obriga a recordar a mecânica teórica central do tópico",
  "definicao_central": "Fundamentação teórica concisa, densa e clara. Explique o conceito, o 'porquê' físico/teórico e inclua formulações ou definições essenciais.",
  "tipo_layout_visual": "fluxo ou hierarquico",
  "etapas_fluxo": ["1. Causa / Condição inicial", "2. Mecanismo / Transformação física ou lógica", "3. Consequência / Estado final"],
  "subtopicos_hierarquicos": [
    { 
      "termo_destaque": "Conceito Chave / Variável", 
      "explicacao_curta": "Definição técnica direta, comportamento esperado ou fórmula associada." 
    },
    { 
      "termo_destaque": "Condição Crítica / Hipótese", 
      "explicacao_curta": "Como este elemento altera a análise ou o dimensionamento no contexto da aula." 
    }
  ],
  "resumo_mini_cornell": "Síntese de uma frase condensando a regra de ouro do tópico para consulta rápida.",
  "destaque_prova": "Atenção a exames: pegadinha comum, erro de hipótese simplificadora, detalhe de sinal/unidade ou interpretação que o professor costuma cobrar em avaliações."
}

Todo o conteúdo gerado DEVE estar estritamente no idioma: ${idiomaTexto}.
`;

        const userPrompt = `
Contexto / Disciplina: ${disciplina || "Geral"}
Método de Estudo: ${metodo || "cornell"}

[REGISTO BRUTO DA AULA / DADOS RECEBIDOS]:
"""
${notasBrutas || "Analise a imagem/anexo técnico anexado com total rigor e profundidade conceitual."}
"""

DIRETRIZES DE PROCESSAMENTO:
- Transcreva e estruture o raciocínio da aula como um colega de turma exemplar.
- Aprofunde o suficiente para consolidar o entendimento teórico e prático do assunto.
- Destaque termos-chave, formulações e critérios decisivos de projeto/análise.
`;

    let model = "llama-3.3-70b-versatile";
    const messages: any[] = [
      { role: "system", content: jsonFormatInstructions }
    ];

    if (arquivoBase64 && mimeType && mimeType.startsWith("image/")) {
      // Modelo ativo com suporte multimodal no Groq
      model = "llama-3.2-90b-vision-preview";
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