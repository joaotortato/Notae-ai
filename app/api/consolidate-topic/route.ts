import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, notasBrutas, metodo, arquivoBase64, mimeType, idioma } = await req.json();

    if (!notasBrutas && !arquivoBase64) {
      return NextResponse.json({ error: "Envie anotações ou anexe um arquivo" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const idiomaTexto = idioma === 'en' ? 'English' : idioma === 'fr' ? 'Français' : 'Português';

    const jsonFormatInstructions = `
Você é um estudante universitário de elite (Engenharia e Ciências Exatas em instituição de alto nível acadêmico).
Seu objetivo é transformar anotações rápidas de aula, rascunhos e conceitos em anotações de caderno impecáveis, organizadas e de alto rigor conceitual.

PERFIL DE REGISTO:
1. RIGOR E SÍNTESE EFICIENTE: Sem enrolação nem introduções óbvias. Vá direto ao cerne teórico do que o professor explicou.
2. APROFUNDAMENTO TÉCNICO: Complete lacunas lógicas deixadas pelas notas rápidas. Se o tópico envolver fórmulas matemáticas, equações de equilíbrio, grandezas físicas ou parâmetros normativos, descreva-os com precisão.
3. LEGIBILIDADE PARA REVISÃO RÁPIDA: Ao bater o olho no caderno antes de uma prova, o estudante deve recordar imediatamente a mecânica teórica central e as armadilhas conceituais.
4. INTEGRAÇÃO VISUAL: Se houver detalhes visuais ou dados anexados, extraia as variáveis e etapas essenciais.

Sua resposta DEVE ser estritamente um JSON válido (sem blocos de código markdown \`\`\`json, apenas o JSON puro) seguindo este esquema:
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
  "destaque_prova": "Atenção a exames: pegadinha comum, erro de hipótese simplificadora, detalhe de sinal/unidade ou interpretação crítica que o professor costuma cobrar em avaliações."
}

Todo o conteúdo gerado DEVE estar estritamente no idioma: ${idiomaTexto}.
`;

    const userPrompt = `
Contexto / Disciplina: ${disciplina || "Geral"}
Método de Estudo: ${metodo || "cornell"}

[REGISTO BRUTO DA AULA / DADOS RECEBIDOS]:
"""
${notasBrutas || "Analise as informações técnicas anexadas com total rigor e profundidade conceitual."}
"""

DIRETRIZES DE PROCESSAMENTO:
- Transcreva e estruture o raciocínio da aula como um colega de turma exemplar.
- Aprofunde o suficiente para consolidar o entendimento teórico e prático do assunto.
- Destaque termos-chave, formulações e critérios decisivos de projeto/análise.
`;

    const messages: any[] = [
      { role: "system", content: jsonFormatInstructions },
      { role: "user", content: userPrompt }
    ];

    // Modelos ativos e disponíveis no Groq
    const modelosParaTentar = ["llama-3.1-8b-instant", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
    let rawContent = "";
    let ultimoErro = null;

    for (const model of modelosParaTentar) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          model,
          messages,
          temperature: 0.2,
          response_format: { type: "json_object" }
        });
        rawContent = chatCompletion.choices[0]?.message?.content || "";
        if (rawContent) break;
      } catch (err: any) {
        ultimoErro = err;
      }
    }

    if (!rawContent) {
      throw ultimoErro || new Error("Não foi possível gerar a resposta com o Groq.");
    }

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