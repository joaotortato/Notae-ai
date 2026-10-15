'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Sparkles, Download, CheckCircle2, Trash2, 
  Palette, Lightbulb, ArrowRight, FolderPlus, Folder, RotateCcw,
  Workflow, HelpCircle, Columns, ListTree, Upload, X, Image as ImageIcon, FileText,
  Bold, Italic, Underline, Type as TypeIcon, Globe, Clipboard
} from 'lucide-react';

interface Subtopico {
  termo_destaque: string;
  explicacao_curta: string;
}

interface Topico {
  id: string;
  titulo: string;
  palavrasChave: string[];
  perguntaGatilho?: string;
  definicaoCentral: string;
  tipoLayout: 'fluxo' | 'hierarquico' | string;
  etapasFluxo?: string[];
  subtopicos: Subtopico[];
  resumoMini?: string;
  destaqueProva: string;
  modoExibicao: 'cornell' | 'topicos' | 'visual';
  imagemAnexa?: string;
}

export default function Home() {
  const [disciplina, setDisciplina] = useState('');
  const [tituloAula, setTituloAula] = useState('');
  const [dataAula, setDataAula] = useState('');

  // Pastas em memória local
  const [pastas, setPastas] = useState<string[]>([]);
  const [novaPasta, setNovaPasta] = useState('');
  const [mostrarCriarPasta, setMostrarCriarPasta] = useState(false);

  // Idioma selecionado
  const [idioma, setIdioma] = useState<'pt' | 'en' | 'fr'>('pt');

  useEffect(() => {
    setDataAula(
      new Date().toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    );

    const pastasSalvas = localStorage.getItem('notae_pastas');
    if (pastasSalvas) {
      try {
        setPastas(JSON.parse(pastasSalvas));
      } catch (e) {
        console.error("Erro ao carregar pastas:", e);
      }
    }
  }, []);

  const salvarPastas = (novas: string[]) => {
    setPastas(novas);
    localStorage.setItem('notae_pastas', JSON.stringify(novas));
  };

  const handleAdicionarPasta = () => {
    if (!novaPasta.trim()) return;
    const nomeLimpo = novaPasta.trim();
    if (!pastas.includes(nomeLimpo)) {
      const atualizadas = [...pastas, nomeLimpo];
      salvarPastas(atualizadas);
      setDisciplina(nomeLimpo);
    }
    setNovaPasta('');
    setMostrarCriarPasta(false);
  };

  const handleRemoverPasta = (nome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const atualizadas = pastas.filter(p => p !== nome);
    salvarPastas(atualizadas);
    if (disciplina === nome) setDisciplina('');
  };

  const [notasAtuais, setNotasAtuais] = useState('');
  const [itensEmProcessamento, setItensEmProcessamento] = useState<number>(0);
  const [finalizandoAula, setFinalizandoAula] = useState(false);
  
  const [arquivo, setArquivo] = useState<{ nome: string; base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tema, setTema] = useState<'azul' | 'verde' | 'indigo'>('azul');
  const [metodoPadrao, setMetodoPadrao] = useState<'cornell' | 'topicos' | 'visual'>('cornell');

  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [resumoExecutivo, setResumoExecutivo] = useState('');
  const [flashcards, setFlashcards] = useState<{ frente: string; verso: string }[]>([]);

  const paletas = {
    azul: {
      accent: 'text-blue-700',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      borderCard: 'border-blue-100 hover:border-blue-300',
      stepBox: 'bg-blue-50/80 border-blue-200 text-blue-900',
      arrow: 'text-blue-500',
    },
    verde: {
      accent: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      borderCard: 'border-emerald-100 hover:border-emerald-300',
      stepBox: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      arrow: 'text-emerald-500',
    },
    indigo: {
      accent: 'text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      borderCard: 'border-indigo-100 hover:border-indigo-300',
      stepBox: 'bg-indigo-50/80 border-indigo-200 text-indigo-900',
      arrow: 'text-indigo-500',
    }
  };

  const estiloAtual = paletas[tema];

  const executarComando = (comando: string, valor: string | undefined = undefined) => {
    document.execCommand(comando, false, valor);
  };

  // Suporte a Arquivo via Seleção Local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(',')[1];
      setArquivo({
        nome: file.name,
        base64: base64Clean,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Suporte a Colar Imagem da Área de Transferência (Ctrl + V / Print)
  const processarItemClipboard = (item: DataTransferItem) => {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Clean = result.split(',')[1];
        setArquivo({
          nome: `Captura_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`,
          base64: base64Clean,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteArea = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        processarItemClipboard(items[i]);
        break;
      }
    }
  };

  const handleRemoverArquivo = () => {
    setArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Limpar Documento para Começar Nova Aula
  const handleLimparDocumento = () => {
    if (topicos.length === 0 && !resumoExecutivo) return;
    const confirmacao = window.confirm("Deseja iniciar um novo documento em branco? Todo o conteúdo gerado nesta aula será limpo.");
    if (confirmacao) {
      setTopicos([]);
      setResumoExecutivo('');
      setFlashcards([]);
      setTituloAula('');
      setNotasAtuais('');
      handleRemoverArquivo();
    }
  };

  const handleConsolidar = async () => {
    if (!notasAtuais.trim() && !arquivo) return;

    const textoParaEnviar = notasAtuais;
    const arquivoParaEnviar = arquivo;
    const metodoEscolhido = metodoPadrao;
    const disciplinaAtual = disciplina;
    const idiomaEscolhido = idioma;

    setNotasAtuais('');
    handleRemoverArquivo();
    setItensEmProcessamento(prev => prev + 1);

    try {
      const res = await fetch('/api/consolidate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          disciplina: disciplinaAtual, 
          notasBrutas: textoParaEnviar,
          metodo: metodoEscolhido,
          arquivoBase64: arquivoParaEnviar?.base64 || null,
          mimeType: arquivoParaEnviar?.mimeType || null,
          idioma: idiomaEscolhido
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar");

      const imagemUrl = arquivoParaEnviar && arquivoParaEnviar.mimeType.startsWith('image/')
        ? `data:${arquivoParaEnviar.mimeType};base64,${arquivoParaEnviar.base64}`
        : undefined;

      const modoInicial = (data.etapas_fluxo && data.etapas_fluxo.length > 0) ? 'visual' : metodoEscolhido;

      setTopicos(prev => [...prev, {
        id: Date.now().toString(),
        titulo: data.titulo || "Tópico Consolidado",
        palavrasChave: data.palavras_chave || [],
        perguntaGatilho: data.pergunta_gatilho_cornell,
        definicaoCentral: data.definicao_central,
        tipoLayout: data.tipo_layout_visual || 'hierarquico',
        etapasFluxo: data.etapas_fluxo || [],
        subtopicos: data.subtopicos_hierarquicos || [],
        resumoMini: data.resumo_mini_cornell,
        destaqueProva: data.destaque_prova,
        modoExibicao: modoInicial,
        imagemAnexa: imagemUrl
      }]);
    } catch (err: any) {
      alert("Aviso: " + err.message);
    } finally {
      setItensEmProcessamento(prev => Math.max(0, prev - 1));
    }
  };

  const handleTrocarModoTopico = (id: string, novoModo: 'cornell' | 'topicos' | 'visual') => {
    setTopicos(prev => prev.map(t => t.id === id ? { ...t, modoExibicao: novoModo } : t));
  };

  const handleAplicarTodos = (modo: 'cornell' | 'topicos' | 'visual') => {
    setMetodoPadrao(modo);
    setTopicos(prev => prev.map(t => ({ ...t, modoExibicao: modo })));
  };

  const handleDeleteTopico = (id: string) => {
    setTopicos(prev => prev.filter(t => t.id !== id));
  };

  const handleFinalizar = async () => {
    if (topicos.length === 0) return;
    setFinalizandoAula(true);

    try {
      const res = await fetch('/api/finalize-lecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplina, topicosAcumulados: topicos, idioma })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao sintetizar");

      setResumoExecutivo(data.resumo_executivo);
      setFlashcards(data.flashcards || []);
    } catch (err: any) {
      alert("Aviso: " + err.message);
    } finally {
      setFinalizandoAula(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden" onPaste={handlePasteArea}>
      
      {/* BARRA SUPERIOR FIXA */}
      <header className="no-print bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
            N
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Notae AI</h1>
            <p className="text-xs text-slate-500">Caderno Inteligente Académico</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Idioma */}
          <div className="flex items-center bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <Globe className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <select 
              value={idioma}
              onChange={(e) => setIdioma(e.target.value as 'pt' | 'en' | 'fr')}
              className="bg-transparent text-slate-700 font-semibold outline-none cursor-pointer"
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          {/* Formato Padrão dos Cards */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mx-2">
              Padronizar:
            </span>
            <button
              type="button"
              onClick={() => handleAplicarTodos('cornell')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                metodoPadrao === 'cornell' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Cornell
            </button>
            <button
              type="button"
              onClick={() => handleAplicarTodos('topicos')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                metodoPadrao === 'topicos' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              Tópicos
            </button>
            <button
              type="button"
              onClick={() => handleAplicarTodos('visual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                metodoPadrao === 'visual' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              Diagrama
            </button>
          </div>

          {/* Seletor de Tema */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <Palette className="w-3.5 h-3.5 mx-1.5 text-slate-500" />
            <button 
              type="button"
              onClick={() => setTema('azul')} 
              className={`px-2 py-1 rounded cursor-pointer ${tema === 'azul' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600'}`}>
              Azul
            </button>
            <button 
              type="button"
              onClick={() => setTema('verde')} 
              className={`px-2 py-1 rounded cursor-pointer ${tema === 'verde' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'text-slate-600'}`}>
              Verde
            </button>
            <button 
              type="button"
              onClick={() => setTema('indigo')} 
              className={`px-2 py-1 rounded cursor-pointer ${tema === 'indigo' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600'}`}>
              Índigo
            </button>
          </div>

          {/* Botão de Limpar Documento (Nova Aula) */}
          <button
            type="button"
            onClick={handleLimparDocumento}
            title="Limpar o caderno para iniciar uma nova aula do zero"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nova Aula
          </button>

          {/* Botão Baixar PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={topicos.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar PDF
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden h-[calc(100vh-57px)]">
        
        {/* COLUNA ESQUERDA: CAPTURA E PASTAS */}
        <section className="no-print lg:col-span-5 bg-white border-r border-slate-200 p-6 flex flex-col justify-between overflow-y-auto h-full">
          <div className="space-y-4">
            
            {/* SISTEMA DE PASTAS / MATÉRIAS */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <Folder className="w-3.5 h-3.5 text-indigo-600" /> Minhas Matérias
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarCriarPasta(!mostrarCriarPasta)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> Nova Matéria
                </button>
              </div>

              {mostrarCriarPasta && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={novaPasta}
                    onChange={(e) => setNovaPasta(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdicionarPasta()}
                    placeholder="Nome da matéria (ex: Cálculo II)..."
                    className="flex-1 text-xs p-2 rounded-lg border border-slate-300 bg-white outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarPasta}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              )}

              {pastas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pastas.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDisciplina(p)}
                      className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
                        disciplina === p 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold' 
                          : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      <span>{p}</span>
                      <span 
                        onClick={(e) => handleRemoverPasta(p, e)}
                        className="hover:text-rose-300 text-slate-400 text-[10px]"
                        title="Remover matéria"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Crie matérias para preencher o cabeçalho automaticamente com um clique.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Captura ao Vivo
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-1">Anotações da Aula</h2>
              </div>
              {itensEmProcessamento > 0 && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Processando {itensEmProcessamento} bloco(s)...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Disciplina</label>
                <input 
                  type="text" 
                  value={disciplina} 
                  onChange={(e) => setDisciplina(e.target.value)}
                  placeholder="Selecione acima ou digite..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-indigo-600 font-medium" 
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Título da Aula</label>
                <input 
                  type="text" 
                  value={tituloAula} 
                  onChange={(e) => setTituloAula(e.target.value)}
                  placeholder="Ex: Análise de Arcos Triarticulados"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-indigo-600 font-medium" 
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Fragmentos do Tópico Atual
              </label>
              <textarea
                rows={6}
                value={notasAtuais}
                onChange={(e) => setNotasAtuais(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleConsolidar();
                  }
                }}
                placeholder="Escreva anotações ou termos-chave. Use Ctrl + Enter para enviar..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-indigo-600 resize-none leading-relaxed font-sans"
              />
            </div>

            {/* ÁREA DE ANEXO E COLAGEM (CTRL + V) */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span>Anexo Multimodal</span>
                <span className="text-[10px] text-indigo-600 font-normal flex items-center gap-1">
                  <Clipboard className="w-3 h-3" /> Pode colar prints diretamente com Ctrl + V
                </span>
              </label>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden" 
              />

              {!arquivo ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 p-3 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer bg-slate-50/50"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Anexar ou Colar Imagem/Slide (Ctrl + V)</span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {arquivo.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold text-indigo-950 truncate">{arquivo.nome}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRemoverArquivo}
                    className="p-1 hover:bg-indigo-200 rounded text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-400 font-medium">Ctrl + Enter para enviar</span>
                <button
                  type="button"
                  onClick={handleConsolidar}
                  disabled={!notasAtuais.trim() && !arquivo}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${estiloAtual.btnPrimary} disabled:opacity-50`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Consolidar Tópico
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={handleFinalizar}
              disabled={finalizandoAula || topicos.length === 0}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {finalizandoAula ? 'Sintetizando...' : `Finalizar Aula & Gerar Flashcards (${topicos.length} tópicos)`}
            </button>
          </div>
        </section>

        {/* COLUNA DIREITA: CADERNO DE ESTUDOS */}
        <section className="lg:col-span-7 bg-slate-100 p-4 lg:p-8 overflow-y-auto h-full flex flex-col items-center pb-28 print:p-0 print:bg-white print:w-full print:h-auto print:overflow-visible print:pb-0">
          
          {/* BARRA DE FERRAMENTAS DOCS STICKY */}
          <div className="no-print w-full max-w-3xl mb-4 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2 sticky top-0 z-20">
            <div className="flex items-center gap-1 text-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                <TypeIcon className="w-3.5 h-3.5 text-indigo-600" /> Editor:
              </span>
              
              <button
                type="button"
                onClick={() => executarComando('bold')}
                title="Negrito"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer font-bold text-xs"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executarComando('italic')}
                title="Itálico"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer text-xs"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => executarComando('underline')}
                title="Sublinhado"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 cursor-pointer text-xs"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-slate-200 mx-1" />

              {/* Marca-textos */}
              <button
                type="button"
                onClick={() => executarComando('hiliteColor', '#fef08a')}
                title="Marca-texto Amarelo"
                className="w-5 h-5 rounded bg-yellow-200 border border-yellow-400 cursor-pointer hover:scale-110 transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => executarComando('hiliteColor', '#bbf7d0')}
                title="Marca-texto Verde"
                className="w-5 h-5 rounded bg-emerald-200 border border-emerald-400 cursor-pointer hover:scale-110 transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => executarComando('hiliteColor', '#bfdbfe')}
                title="Marca-texto Azul"
                className="w-5 h-5 rounded bg-blue-200 border border-blue-400 cursor-pointer hover:scale-110 transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => executarComando('hiliteColor', '#fbcfe8')}
                title="Marca-texto Rosa"
                className="w-5 h-5 rounded bg-pink-200 border border-pink-400 cursor-pointer hover:scale-110 transition shadow-2xs"
              />

              <div className="w-[1px] h-4 bg-slate-200 mx-1" />

              {/* Cores de Texto */}
              <button
                type="button"
                onClick={() => executarComando('foreColor', '#0f172a')}
                title="Texto Preto"
                className="w-4 h-4 rounded-full bg-slate-900 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => executarComando('foreColor', '#1d4ed8')}
                title="Texto Azul"
                className="w-4 h-4 rounded-full bg-blue-700 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => executarComando('foreColor', '#b91c1c')}
                title="Texto Vermelho"
                className="w-4 h-4 rounded-full bg-rose-700 cursor-pointer"
              />
            </div>

            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Edição direta habilitada em todo o documento
            </span>
          </div>

          {/* FOLHA DO CADERNO */}
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-md border border-slate-200 p-8 lg:p-10 mb-16 flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:mb-0 print:min-h-0">
            <div>
              
              {/* CABEÇALHO COM DATA CRONOLÓGICA */}
              <div className="border-b-2 border-slate-200 pb-5 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <span 
                    contentEditable 
                    suppressContentEditableWarning
                    data-placeholder="Nome da Disciplina"
                    className={`text-[11px] font-extrabold uppercase tracking-widest outline-none focus:bg-slate-50 p-1 rounded empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 ${estiloAtual.accent}`}
                  >
                    {disciplina}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span 
                      contentEditable 
                      suppressContentEditableWarning
                      suppressHydrationWarning
                      title="Clique para editar a data"
                      className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 outline-none focus:bg-white"
                    >
                      📅 {dataAula || 'Definir data'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      Caderno de Estudos
                    </span>
                  </div>
                </div>

                <h1 
                  contentEditable 
                  suppressContentEditableWarning
                  data-placeholder="Título da Aula / Assunto Principal"
                  className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-2 leading-tight outline-none focus:bg-slate-50 p-1 rounded empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300"
                >
                  {tituloAula}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {topicos.length} tópico(s) consolidado(s) • Idioma: {idioma.toUpperCase()}
                </p>
              </div>

              {/* SÍNTESE EXECUTIVA */}
              {resumoExecutivo && (
                <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-white border-l-4 border-indigo-600 border border-indigo-100 shadow-xs">
                  <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Síntese Executiva Integrada
                  </h3>
                  <div 
                    contentEditable 
                    suppressContentEditableWarning
                    className="text-xs text-slate-700 leading-relaxed font-normal outline-none focus:bg-white/80 p-1 rounded"
                  >
                    {resumoExecutivo}
                  </div>
                </div>
              )}

              {/* LISTAGEM DOS TÓPICOS */}
              {topicos.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
                  <p className="text-sm font-semibold text-slate-600">Seu caderno está pronto e limpo.</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Insira palavras-chave ou cole capturas com Ctrl + V à esquerda e envie com Ctrl + Enter.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {topicos.map((topico, idx) => (
                    <article 
                      key={topico.id} 
                      className={`group bg-white border rounded-xl shadow-xs transition-all ${estiloAtual.borderCard} overflow-hidden`}
                    >
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h2 
                            contentEditable 
                            suppressContentEditableWarning
                            className="text-sm font-bold text-slate-900 outline-none focus:bg-white p-1 rounded flex-1"
                          >
                            {topico.titulo}
                          </h2>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="no-print flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleTrocarModoTopico(topico.id, 'cornell')}
                              title="Ver como Cornell"
                              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition ${
                                topico.modoExibicao === 'cornell' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Columns className="w-3 h-3" />
                              <span className="hidden sm:inline">Cornell</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTrocarModoTopico(topico.id, 'topicos')}
                              title="Ver como Tópicos"
                              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition ${
                                topico.modoExibicao === 'topicos' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <ListTree className="w-3 h-3" />
                              <span className="hidden sm:inline">Tópicos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTrocarModoTopico(topico.id, 'visual')}
                              title="Ver como Diagrama"
                              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition ${
                                topico.modoExibicao === 'visual' ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Workflow className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Diagrama</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTopico(topico.id)}
                            title="Excluir tópico"
                            className="no-print opacity-50 hover:opacity-100 hover:bg-rose-50 p-1.5 rounded-md text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {topico.imagemAnexa && (
                        <div className="p-5 pb-0">
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={topico.imagemAnexa} 
                              alt="Material de Aula" 
                              className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                            />
                            <span 
                              contentEditable 
                              suppressContentEditableWarning
                              className="text-[10px] text-slate-400 mt-1.5 font-medium outline-none"
                            >
                              Material de suporte anexado
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CORPO DO CARD CONFORME O MODO */}
                      {topico.modoExibicao === 'cornell' && (
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
                              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block mb-2">
                                Pergunta-Gatilho
                              </span>
                              <div 
                                contentEditable 
                                suppressContentEditableWarning
                                className="text-xs font-semibold text-slate-800 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100 leading-snug outline-none focus:bg-white"
                              >
                                {topico.perguntaGatilho || `Como conceituar ${topico.titulo}?`}
                              </div>

                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-4 mb-1.5">
                                Palavras-Chave
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {topico.palavrasChave.map((kw, i) => (
                                  <span 
                                    key={i} 
                                    contentEditable 
                                    suppressContentEditableWarning
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border outline-none ${estiloAtual.badge}`}
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="md:col-span-8 space-y-3">
                              <div 
                                contentEditable 
                                suppressContentEditableWarning
                                className="text-xs text-slate-800 font-medium leading-relaxed bg-amber-50/40 p-3 rounded-lg border border-amber-200/60 outline-none focus:bg-white"
                              >
                                {topico.definicaoCentral}
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {topico.subtopicos.map((st, sIdx) => (
                                  <div key={sIdx} className="text-xs text-slate-700 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                    <div 
                                      contentEditable 
                                      suppressContentEditableWarning
                                      className="outline-none focus:bg-slate-50 p-0.5 rounded flex-1"
                                    >
                                      <mark className="bg-yellow-200 text-slate-900 font-bold px-1 py-0.2 rounded text-[11px] mr-1">
                                        {st.termo_destaque}
                                      </mark>
                                      <span>{st.explicacao_curta}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {topico.resumoMini && (
                            <div className="mt-4 pt-3 border-t border-slate-200/80 bg-slate-50/80 -mx-5 -mb-5 p-4 flex items-start gap-2 text-xs text-slate-700">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0 mt-0.5">
                                Síntese:
                              </span>
                              <div 
                                contentEditable 
                                suppressContentEditableWarning
                                className="italic font-medium outline-none flex-1"
                              >
                                {topico.resumoMini}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {topico.modoExibicao === 'visual' && (
                        <div className="p-5 space-y-4">
                          <div 
                            contentEditable 
                            suppressContentEditableWarning
                            className="text-xs text-slate-800 leading-relaxed font-medium outline-none focus:bg-slate-50 p-1 rounded"
                          >
                            {topico.definicaoCentral}
                          </div>

                          {topico.etapasFluxo && topico.etapasFluxo.length > 0 ? (
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
                                <Workflow className="w-3.5 h-3.5 text-indigo-500" /> Cadeia de Causa e Efeito
                              </span>
                              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                {topico.etapasFluxo.map((passo, pIdx) => (
                                  <React.Fragment key={pIdx}>
                                    <div 
                                      contentEditable 
                                      suppressContentEditableWarning
                                      className={`flex-1 p-2.5 rounded-lg border text-xs font-semibold text-center shadow-2xs outline-none focus:bg-white ${estiloAtual.stepBox}`}
                                    >
                                      {passo}
                                    </div>
                                    {pIdx < (topico.etapasFluxo?.length || 0) - 1 && (
                                      <div className="flex justify-center items-center py-1 md:py-0">
                                        <ArrowRight className={`w-4 h-4 rotate-90 md:rotate-0 ${estiloAtual.arrow}`} />
                                      </div>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {topico.subtopicos.map((st, sIdx) => (
                                <div 
                                  key={sIdx} 
                                  contentEditable 
                                  suppressContentEditableWarning
                                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs outline-none focus:bg-white"
                                >
                                  <mark className="bg-yellow-200 text-slate-900 font-bold px-1.5 py-0.5 rounded text-[11px] block w-fit mb-1">
                                    {st.termo_destaque}
                                  </mark>
                                  <span className="text-slate-700">{st.explicacao_curta}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {topico.modoExibicao === 'topicos' && (
                        <div className="p-5 space-y-3">
                          <div 
                            contentEditable 
                            suppressContentEditableWarning
                            className="text-xs text-slate-800 leading-relaxed font-semibold pb-2 border-b border-slate-100 outline-none focus:bg-slate-50 p-1 rounded"
                          >
                            {topico.definicaoCentral}
                          </div>
                          <div className="space-y-2 pl-2">
                            {topico.subtopicos.map((st, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                                <span className="font-mono font-bold text-slate-400 text-[11px]">
                                  {idx + 1}.{sIdx + 1}
                                </span>
                                <div 
                                  contentEditable 
                                  suppressContentEditableWarning
                                  className="outline-none focus:bg-slate-50 p-0.5 rounded flex-1"
                                >
                                  <mark className="bg-yellow-200 text-slate-900 font-bold px-1 py-0.2 rounded text-[11px] mr-1.5">
                                    {st.termo_destaque}
                                  </mark>
                                  <span>{st.explicacao_curta}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {topico.destaqueProva && (
                        <div className="mx-5 mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <strong className="block text-[11px] font-bold text-rose-950 mb-0.5">
                              Atenção para Provas:
                            </strong>
                            <div 
                              contentEditable 
                              suppressContentEditableWarning
                              className="text-[11px] leading-relaxed text-rose-900 font-normal outline-none focus:bg-white/80 p-0.5 rounded"
                            >
                              {topico.destaqueProva}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {/* SEÇÃO DE FLASHCARDS */}
              {flashcards.length > 0 && (
                <div className="mt-8 pt-6 border-t-2 border-slate-200">
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Fixação Ativa da Aula (Flashcards)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {flashcards.map((fc, i) => (
                      <div 
                        key={i} 
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 hover:border-indigo-300 transition"
                      >
                        <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px]">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Pergunta #{i + 1}</span>
                        </div>
                        <div 
                          contentEditable 
                          suppressContentEditableWarning
                          className="font-semibold text-slate-800 leading-snug outline-none focus:bg-white p-1 rounded"
                        >
                          {fc.frente}
                        </div>
                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Resposta
                          </span>
                          <div 
                            contentEditable 
                            suppressContentEditableWarning
                            className="text-slate-700 text-[11px] leading-relaxed outline-none focus:bg-white p-1 rounded"
                          >
                            {fc.verso}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-[10px] text-slate-400">
              <span>Notae AI • Caderno Académico Dinâmico</span>
              <span>Caderno Oficial de Estudos</span>
            </footer>
          </div>
        </section>

      </main>

      {/* REGRAS DE IMPRESSÃO / PDF MULTI-PÁGINAS CORRIGIDAS */}
      <style jsx global>{`
        @media print {
          /* 1. Oculta tudo o que não deve sair na folha */
          .no-print, 
          header, 
          nav, 
          section:first-of-type {
            display: none !important;
          }

          /* 2. Destrava alturas e rolagens da raiz e dos containers pais */
          html, 
          body, 
          div[class*="h-screen"],
          main, 
          section {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 3. Garante que a coluna direita ocupe a largura completa sem grid/flex */
          main {
            display: block !important;
          }

          section.lg\\:col-span-7 {
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* 4. A folha A4 não pode ter limites de tamanho na impressão */
          div[class*="max-w-3xl"] {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
            display: block !important;
          }

          /* 5. Regras para evitar que tópicos fiquem cortados ao meio entre duas folhas */
          article {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            margin-bottom: 2rem !important;
            display: block !important;
          }

          /* 6. Preserva as cores dos marca-textos e destaques na impressão */
          mark, span, div {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}