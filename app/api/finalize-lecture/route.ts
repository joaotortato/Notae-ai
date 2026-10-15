import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, topicosAcumulados, idioma } = await req.json();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const idiomaTexto = idioma === 'en' ? 'English' : idioma === 'fr' ? 'Français' : 'Português';

    const systemPrompt = `
Você é um estudante de alto rendimento acadêmico especialista em síntese técnica e Active Recall.
Sua resposta DEVE ser estritamente um JSON válido (sem blocos de código markdown, apenas o JSON puro) no formato:
{
  "resumo_executivo": "Síntese densa conectando todos os tópicos vistos na aula de forma lógica e articulada.",
  "flashcards": [
    { "frente": "Pergunta reflexiva de alto impacto para fixação?", "verso": "Resposta técnica direta e fundamentada." },
    { "frente": "Segunda pergunta crítica sobre critérios ou fórmulas?", "verso": "Resposta precisa com definições claras." },
    { "frente": "Terceira pergunta sobre armadilhas conceituais de exame?", "verso": "Explicação do cuidado prático necessário." }
  ]
}
Idioma obrigatório: ${idiomaTexto}.
`;

    const userPrompt = `
Disciplina: ${disciplina || "Geral"}
Tópicos consolidados:
${JSON.stringify(topicosAcumulados, null, 2)}

Sintetize a aula e elabore de 3 a 5 flashcards de alto impacto acadêmico.
`;

    const modelosParaTentar = ["llama-3.1-8b-instant", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
    let rawContent = "";
    let ultimoErro = null;

    for (const model of modelosParaTentar) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
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
      throw ultimoErro || new Error("Erro ao sintetizar aula com Groq");
    }

    const data = JSON.parse(rawContent);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no Groq finalize-lecture:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao sintetizar aula com Groq" },
      { status: 500 }
    );
  }
}