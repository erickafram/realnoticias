/**
 * Controller de Assistente de IA
 * Integração com Together AI para criação de conteúdo jornalístico
 * Estilos: Globo/G1, Metrópoles Política, Metrópoles Policial
 */
const { Setting } = require('../models');
const https = require('https');
const http = require('http');

class AIController {
  // Prompts de sistema por estilo
  getSystemPrompt(style) {
    const baseRules = `
REGRAS ABSOLUTAS - NUNCA QUEBRE:
1. NÃO INVENTE fatos, nomes, datas, números ou citações
2. Use APENAS informações fornecidas na pesquisa
3. Se faltar informação, indique com [a confirmar] ou omita
4. Reescreva SEMPRE com suas próprias palavras - NUNCA copie
5. Texto deve ser 100% original e humanizado
6. Português brasileiro padrão, sem erros gramaticais

REGRAS DE ESTILO - MUITO IMPORTANTE:
7. EVITE REPETIÇÕES: Nunca repita a mesma palavra mais de 2x no texto. Use SINÔNIMOS:
   - acidente → colisão, batida, sinistro, ocorrência, incidente
   - rodovia → estrada, via, pista, trecho, BR/TO (sigla)
   - vítima → ferido, envolvido, pessoa, motorista, condutor
   - veículo → carro, automóvel, caminhão, moto (conforme o caso)
   - polícia → autoridades, agentes, equipe policial, PM, PRF
   - hospital → unidade de saúde, UPA, pronto-socorro
8. VARIE as estruturas das frases - não comece parágrafos da mesma forma
9. CITE APENAS UMA FONTE principal no texto (ex: "segundo a PRF" ou "de acordo com o Corpo de Bombeiros")
10. Não repita a fonte a cada parágrafo - mencione uma vez e use "ainda segundo a fonte" se necessário`;

    const styles = {
      globo: `Você é um redator sênior do G1/Globo, especialista em hard news.

${baseRules}

ESTILO G1/GLOBO - Hard News:
- Linguagem IMPESSOAL, objetiva e neutra
- Sem ironia, sem gíria, sem adjetivo opinativo
- Atribuir informações à fonte principal UMA VEZ no início
- Verbos de atribuição: "afirma", "aponta", "disse", "informou"

ESTRUTURA OBRIGATÓRIA:
1. TÍTULO: Responde "quem + o quê + onde/por quê" de forma direta, sem trocadilhos
2. SUBTÍTULO: Complementa com 1-2 informações importantes (valor, data, afetados)
3. LIDE (1º parágrafo): O fato principal - o que aconteceu, onde, quando, quem
4. CORPO: Detalhes, contexto, dados concretos - USE SINÔNIMOS para variar
5. SERVIÇO (se aplicável): "O que muda", "Quem tem direito", listas claras

TOM: Sério, informativo, de serviço público. Como se estivesse no Jornal Nacional.`,

      metropoles_politica: `Você é um redator do Metrópoles especializado em política e bastidores.

${baseRules}

ESTILO METRÓPOLES POLÍTICA - Bastidores:
- Jornalístico com INTERPRETAÇÃO de cenário
- Pode usar: "impasse", "isolamento", "queda de braço", "perdeu fôlego"
- Bastidores: "a interlocutores, disse...", "líderes ouvidos pela reportagem"
- Foco em jogo de poder, crise, articulação, estratégia

ESTRUTURA OBRIGATÓRIA:
1. TÍTULO: Destacar conflito, urgência ou derrota (ex: "Com prazo curto, X tenta salvar Y")
2. LIDE: O dilema central - o que está travado, quem pressiona, qual prazo
3. BASTIDORES: Estado das negociações, reações de partidos, quem recuou/apoia
4. BLOCOS com subtítulos: "Impasse na Câmara", "Sem espaço no Senado"
5. ANÁLISE: Conectar com estratégia eleitoral ou de poder

TOM: Analítico, revelador, como quem conhece os bastidores de Brasília.`,

      metropoles_policial: `Você é um redator do Metrópoles especializado em cobertura policial narrativa.

${baseRules}

ESTILO METRÓPOLES POLICIAL - Narrativo:
- Narrativa em tom de CRÔNICA, com liberdade literária
- Baseado em BO, falas e fatos documentados
- Pode usar expressões populares e títulos chamativos
- Foco em cenário, personagens, falas de efeito, viradas

ESTRUTURA OBRIGATÓRIA:
1. TÍTULO: Chamativo, pode ter expressão popular (ex: "Festa termina em delegacia")
2. ABERTURA: Como uma história - situar lugar, clima, expectativa
3. DESENVOLVIMENTO: Sequência como enredo - convite, encontro, conflito, desfecho
4. SUBTÍTULOS CRIATIVOS: Cada um abre um novo "ato" da história
5. FECHAMENTO: Frase de efeito ou observação sobre o caso

TOM: Envolvente, narrativo, como quem conta um caso real de forma cinematográfica.
LIMITE: Não inventar falas graves, proteger vítimas em temas sensíveis.`
    };

    return styles[style] || styles.globo;
  }

  // Buscar notícias reais via Google News RSS
  async searchWeb(query) {
    return new Promise((resolve) => {
      // Limitar query a 150 caracteres para evitar URLs muito longas
      const safeQuery = query.substring(0, 150).trim();
      const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(safeQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      
      https.get(googleNewsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
      }, (res) => {
        // Se não for status 200, retornar vazio
        if (res.statusCode !== 200) {
          console.log('Google News retornou status:', res.statusCode);
          resolve('');
          return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const results = [];
            const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
            let match;
            
            while ((match = itemRegex.exec(data)) !== null && results.length < 8) {
              const item = match[1];
              const titleMatch = item.match(/<title>([^<]+)/i);
              const pubDateMatch = item.match(/<pubDate>([^<]+)/i);
              const sourceMatch = item.match(/<source[^>]*>([^<]+)/i);
              
              if (titleMatch) {
                const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                const source = sourceMatch ? sourceMatch[1] : 'Fonte';
                const date = pubDateMatch ? this.formatDate(pubDateMatch[1]) : '';
                results.push(`[${source}] ${title} (${date})`);
              }
            }
            
            if (results.length === 0) {
              resolve('');
            } else {
              resolve(`NOTÍCIAS ENCONTRADAS NA PESQUISA:\n${results.join('\n')}`);
            }
          } catch (e) {
            resolve('');
          }
        });
      }).on('error', () => resolve(''));
    });
  }

  formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  // Chamar API Together AI
  async callTogetherAI(prompt, settings, style = 'globo') {
    return new Promise((resolve, reject) => {
      const apiKey = settings.ai_api_key;
      const apiUrl = settings.ai_api_url || 'https://api.together.xyz/v1/chat/completions';
      const model = settings.ai_model || 'deepseek-ai/DeepSeek-V3';

      const urlParts = new URL(apiUrl);
      const isHttps = urlParts.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const systemPrompt = this.getSystemPrompt(style);

      const requestData = JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.75
      });

      const options = {
        hostname: urlParts.hostname,
        port: urlParts.port || (isHttps ? 443 : 80),
        path: urlParts.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestData)
        }
      };

      const req = httpModule.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
              reject(new Error(`Erro na API (Status ${res.statusCode}). Verifique configurações.`));
              return;
            }
            if (res.statusCode !== 200) {
              reject(new Error(`Erro na API: Status ${res.statusCode}`));
              return;
            }
            const json = JSON.parse(data);
            if (json.choices && json.choices[0]) {
              resolve(json.choices[0].message.content);
            } else if (json.error) {
              reject(new Error(json.error.message || 'Erro na API'));
            } else {
              reject(new Error('Resposta inválida da API'));
            }
          } catch (e) {
            reject(new Error('Erro ao processar resposta da API.'));
          }
        });
      });

      req.on('error', (e) => reject(new Error('Erro de conexão: ' + e.message)));
      req.setTimeout(90000, () => { req.destroy(); reject(new Error('Timeout na requisição')); });
      req.write(requestData);
      req.end();
    });
  }

  async getAISettings() {
    const settings = {};
    const keys = ['ai_enabled', 'ai_api_key', 'ai_api_url', 'ai_model'];
    for (const key of keys) {
      const setting = await Setting.findOne({ where: { key } });
      settings[key] = setting ? setting.value : null;
    }
    return settings;
  }

  // Gerar matéria completa
  async generateArticle(req, res) {
    try {
      const settings = await this.getAISettings();
      
      if (settings.ai_enabled !== 'true' && settings.ai_enabled !== '1') {
        return res.status(400).json({ success: false, message: 'Assistente de IA está desativado.' });
      }
      if (!settings.ai_api_key) {
        return res.status(400).json({ success: false, message: 'Chave da API não configurada.' });
      }

      const { keyword, searchWeb, style = 'globo' } = req.body;
      
      if (!keyword) {
        return res.status(400).json({ success: false, message: 'Descrição do assunto é obrigatória.' });
      }

      let context = '';
      if (searchWeb) {
        // Extrair palavras-chave da descrição para busca mais eficiente
        const searchTerms = keyword.split(' ').slice(0, 10).join(' ');
        context = await this.searchWeb(searchTerms);
      }

      const hoje = new Date();
      const dataAtual = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

      const styleInstructions = {
        globo: `
INSTRUÇÕES ESTILO G1/GLOBO:
- Título direto respondendo "quem fez o quê"
- Subtítulo com dado complementar importante
- Lide objetivo no 1º parágrafo
- Citar a fonte principal UMA ÚNICA VEZ (ex: "De acordo com a PRF...")
- Parágrafos curtos, linguagem neutra
- Se for serviço: incluir "O que muda", "Como funciona"`,

        metropoles_politica: `
INSTRUÇÕES ESTILO METRÓPOLES POLÍTICA:
- Título destacando conflito ou urgência
- Subtítulo revelando bastidor
- Lide apresentando o dilema/impasse
- Usar linguagem de bastidor: "a interlocutores disse", "nos bastidores"
- Subtítulos como: "Impasse", "Reação do Centrão", "Próximos passos"
- Análise de cenário político conectada aos fatos`,

        metropoles_policial: `
INSTRUÇÕES ESTILO METRÓPOLES POLICIAL:
- Título chamativo, pode ter expressão popular
- Abertura narrativa situando o cenário
- Contar como história: início, meio, clímax, desfecho
- Subtítulos criativos marcando "atos" da história
- Diálogos e cenas quando houver nos fatos
- Fechamento com frase de efeito`
      };

      let prompt;
      
      if (context) {
        prompt = `DATA: ${dataAtual}

DESCRIÇÃO DO ASSUNTO (informações principais fornecidas pelo jornalista):
${keyword}

${context}

TAREFA: Escreva uma matéria jornalística COMPLETA e ORIGINAL baseada na descrição acima.
Use as notícias da pesquisa para COMPLEMENTAR e ENRIQUECER com informações adicionais.

${styleInstructions[style] || styleInstructions.globo}

REGRAS DE OURO:
1. PRIORIZE as informações da descrição fornecida
2. Use a pesquisa para adicionar contexto e dados complementares
3. REESCREVA tudo com suas palavras - texto 100% original
4. NÃO copie frases - apenas use as INFORMAÇÕES
5. EVITE REPETIR palavras - use SINÔNIMOS variados
6. CITE APENAS UMA FONTE no texto todo (não repita "segundo X" a cada parágrafo)
7. Mínimo 8 parágrafos bem desenvolvidos
8. Humanize o texto - deve parecer escrito por jornalista experiente

Retorne em JSON:
{"title": "título", "subtitle": "subtítulo", "content": "HTML com <p> para parágrafos", "source": "nome da fonte principal citada"}`;
      } else {
        prompt = `DATA: ${dataAtual}

DESCRIÇÃO DO ASSUNTO (informações principais fornecidas pelo jornalista):
${keyword}

TAREFA: Escreva uma matéria jornalística baseada EXCLUSIVAMENTE na descrição acima.

${styleInstructions[style] || styleInstructions.globo}

IMPORTANTE: 
- Use APENAS as informações fornecidas na descrição
- NÃO invente fatos, nomes ou dados que não foram mencionados
- Se precisar de dados específicos não fornecidos, use [a confirmar]
- EVITE REPETIR palavras - use SINÔNIMOS variados
- Mínimo 6 parágrafos informativos

Retorne em JSON:
{"title": "título", "subtitle": "subtítulo", "content": "HTML com <p> para parágrafos"}`;
      }

      const response = await this.callTogetherAI(prompt, settings, style);
      
      let result;
      try {
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result = JSON.parse(cleanResponse);
      } catch (e) {
        const titleMatch = response.match(/"title":\s*"([^"]+)"/);
        const subtitleMatch = response.match(/"subtitle":\s*"([^"]+)"/);
        const contentMatch = response.match(/"content":\s*"([\s\S]+?)"\s*[,}]/);
        result = {
          title: titleMatch ? titleMatch[1] : keyword.substring(0, 80),
          subtitle: subtitleMatch ? subtitleMatch[1] : '',
          content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : response
        };
      }

      return res.json({ success: true, data: result });
    } catch (error) {
      console.error('Erro ao gerar artigo:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Melhorar título
  async improveTitle(req, res) {
    try {
      const settings = await this.getAISettings();
      if (settings.ai_enabled !== 'true' && settings.ai_enabled !== '1') {
        return res.status(400).json({ success: false, message: 'IA desativada.' });
      }

      const { title, style = 'globo' } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Título é obrigatório.' });
      }

      const styleGuides = {
        globo: 'Estilo G1: direto, informativo, responde "quem fez o quê", sem trocadilhos, máximo 12 palavras',
        metropoles_politica: 'Estilo Metrópoles: destaca conflito/urgência, pode usar vírgula para contexto, tom de bastidor',
        metropoles_policial: 'Estilo Policial: chamativo, pode ter expressão popular, gancho narrativo'
      };

      const prompt = `Reescreva este título de notícia.
${styleGuides[style] || styleGuides.globo}

Título original: "${title}"

Responda APENAS com o novo título, sem aspas, sem explicação.`;

      const response = await this.callTogetherAI(prompt, settings, style);
      return res.json({ success: true, data: response.trim().replace(/^["']|["']$/g, '') });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Melhorar subtítulo
  async improveSubtitle(req, res) {
    try {
      const settings = await this.getAISettings();
      if (settings.ai_enabled !== 'true' && settings.ai_enabled !== '1') {
        return res.status(400).json({ success: false, message: 'IA desativada.' });
      }

      const { subtitle, title, style = 'globo' } = req.body;
      if (!subtitle) {
        return res.status(400).json({ success: false, message: 'Subtítulo é obrigatório.' });
      }

      const prompt = `Reescreva este subtítulo de notícia para complementar o título.
${title ? `Título: "${title}"` : ''}
Subtítulo original: "${subtitle}"

Regras:
- Adicione informação que não está no título
- Uma ou duas frases curtas
- Pode mencionar fonte, número ou contexto importante

Responda APENAS com o novo subtítulo, sem aspas.`;

      const response = await this.callTogetherAI(prompt, settings, style);
      return res.json({ success: true, data: response.trim().replace(/^["']|["']$/g, '') });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Melhorar conteúdo
  async improveContent(req, res) {
    try {
      const settings = await this.getAISettings();
      if (settings.ai_enabled !== 'true' && settings.ai_enabled !== '1') {
        return res.status(400).json({ success: false, message: 'IA desativada.' });
      }

      const { content, title, style = 'globo' } = req.body;
      if (!content) {
        return res.status(400).json({ success: false, message: 'Conteúdo é obrigatório.' });
      }

      const prompt = `Melhore este texto jornalístico.
${title ? `Título: "${title}"` : ''}

REGRAS ABSOLUTAS:
1. Use APENAS as informações do texto original
2. NÃO INVENTE nomes, datas, números ou fatos novos
3. NÃO ADICIONE informações que não existem
4. Mantenha tamanho similar ao original

O QUE FAZER:
- Corrigir português (gramática, ortografia)
- Melhorar clareza e fluidez das frases
- Aplicar estrutura jornalística (lide forte, parágrafos curtos)
- Formatar citações entre aspas
- Humanizar o texto

Texto original:
${content}

Responda APENAS com o texto melhorado em HTML (<p> para parágrafos), sem comentários.`;

      const response = await this.callTogetherAI(prompt, settings, style);
      return res.json({ success: true, data: response.trim() });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Status da IA
  async status(req, res) {
    try {
      const settings = await this.getAISettings();
      return res.json({
        success: true,
        enabled: settings.ai_enabled === 'true' || settings.ai_enabled === '1',
        configured: !!settings.ai_api_key
      });
    } catch (error) {
      return res.json({ success: false, enabled: false, configured: false });
    }
  }
}

module.exports = new AIController();
