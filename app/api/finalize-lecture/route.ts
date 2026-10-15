import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { disciplina, topicosAcumulados, idioma } = await req.json();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const idiomaTexto = idioma === 'en' ? 'English' : idioma === 'fr' ? 'Français' : 'Português';

    const systemPrompt = `
Você é um especialista em síntese acadêmica e Active Recall.
Sua resposta DEVE ser estritamente um JSON válido (sem blocos markdown, apenas o JSON puro) no formato:
{
"resumo_executivo": "Síntese densa conectando todos os tópicos vistos na aula.",
"flashcards": [
{ "frente": "Pergunta desafiadora?", "verso": "Resposta precisa." },
{ "frente": "Pergunta desafiadora 2?", "verso": "Resposta precisa 2." },
{ "frente": "Pergunta desafiadora 3?", "verso": "Resposta precisa 3." }
]
}
Idioma obrigatório: ${idiomaTexto}.
`;

    const userPrompt = `
Disciplina: ${disciplina || "Geral"}
Tópicos consolidados:
${JSON.stringify(topicosAcumulados, null, 2)}

Sintetize a aula e crie de 3 a 5 flashcards de alto impacto acadêmico.
`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
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