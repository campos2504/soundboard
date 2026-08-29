# Arcade Soundboard Steam Deck — Chrome Extension & Web Store Guide

**Last Updated:** 2026-08-29  
**Version:** 1.0.0  
**Manifest Version:** 3  

---

## 1. Store Listing Information

- **Extension Name:** Arcade Soundboard Steam Deck
- **Short Name:** Arcade Soundboard
- **Category:** Entertainment / Productivity
- **Primary Language:** Portuguese (Brazil) / English
- **Summary / Short Description:** Soundboard retrô com memes da TV brasileira, MyInstants, SoundButtonsWorld, áudio estéreo e painel lateral integrado ao Chrome.

### Detailed Description (Markdown for Store Listing)
```markdown
Arcade Soundboard Steam Deck é o aplicativo definitivo de soundboard retrô com estética dos anos 90, totalmente integrado ao Google Chrome.

🔊 RECURSOS PRINCIPAIS:
• Painel Lateral (Side Panel): Abra seu soundboard na lateral do navegador enquanto assiste lives na Twitch, vídeos no YouTube, chamadas no Google Meet ou Discord Web.
• Catálogo Completo: Integrado ao MyInstants e SoundButtonsWorld para pesquisar e tocar milhões de memes e efeitos sonoros instantaneamente.
• Clássicos Brasileiros: Sons e vinhetas da TV brasileira (Rodrigo Faro, Faustão, Ratinho, La Ele, Gaming e Memes).
• Roteamento Estéreo com Pílula de Teste: Suporte a saída primária (Stream/Auto-falantes) e saída secundária (Fones de Ouvido) com limiter anti-estouro automático.
• Totalmente Standalone: Funciona 100% offline e local no navegador, sem necessidade de servidores externos.
• Atalhos Globais: Controle a reprodução e pare todos os sons com atalhos de teclado (Ctrl+Shift+X / Cmd+Shift+X).
• Menu de Contexto: Clique com o botão direito em qualquer link ou áudio na web para adicioná-lo à sua biblioteca.
• PWA / Instalação no Desktop: Pode ser instalado como aplicativo de desktop no Chrome com janela independente.
```

---

## 2. Permissions Justification

| Permission | Technical Reason | Plain-English Reviewer Justification |
| :--- | :--- | :--- |
| `storage` | `chrome.storage.local` | Armazena a biblioteca de sons, abas personalizadas, configurações de áudio e tags localmente no dispositivo do usuário. |
| `sidePanel` | `chrome.sidePanel` | Permite abrir a interface do soundboard no painel lateral nativo do Chrome para uso concomitante com outras abas. |
| `contextMenus` | `chrome.contextMenus` | Adiciona opções de clique com botão direito para importar links de áudio ou abrir o soundboard em tela cheia. |
| `tabs` | `chrome.tabs` | Permite abrir a interface completa do soundboard em uma nova aba dedicada quando solicitado pelo usuário. |
| `commands` | `chrome.commands` | Permite acionar atalhos de teclado configuráveis no navegador para parar o áudio ou acionar o painel. |

### Host Permissions Justification

| Host Pattern | Justification |
| :--- | :--- |
| `https://*.myinstants.com/*` | Necessário para buscar, pré-visualizar e carregar áudios de memes da plataforma MyInstants diretamente pelo navegador. |
| `https://*.soundbuttonsworld.com/*` | Necessário para buscar e carregar botões de som e efeitos da plataforma SoundButtonsWorld. |

---

## 3. Privacy & Data Use Disclosures

- **Single Purpose:** Fornecer um reprodutor e organizador de sons e memes estilo soundboard no navegador.
- **Data Collection:** O aplicativo NÃO coleta, não armazena e não transmite nenhum dado pessoal, credencial, histórico de navegação ou informação identificável para servidores de terceiros.
- **Local Storage Only:** Todos os sons salvos, configurações e preferências ficam salvos estritamente no armazenamento local do navegador do usuário (`chrome.storage.local` / `IndexedDB`).
- **Data Sale & Analytics:** Não há ferramentas de rastreamento (tracking), telemetria ou venda de dados.

---

## 4. Como Carregar no Google Chrome (Modo Desenvolvedor / Unpacked)

1. Abra o Google Chrome e acerte a URL: `chrome://extensions`
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"** (Developer mode).
3. Clique no botão **"Carregar sem compactação"** (Load unpacked).
4. Selecione a pasta `client/dist` deste projeto.
5. Pronto! O ícone do **Arcade Soundboard** aparecerá na barra de ferramentas do Chrome.
6. Clique no ícone para abrir instantaneamente o Soundboard no **Painel Lateral (Side Panel)** do Chrome!

---

## 5. Como Instalar como PWA (App de Desktop do Chrome)

1. Abra o Soundboard em qualquer aba do Chrome (`npm run dev:client` ou pela extensão em tela cheia).
2. Clique no botão **"Instalar App"** no cabeçalho ou no ícone de instalação (computador com seta para baixo) na barra de endereços do Chrome.
3. O Soundboard será instalado como aplicativo nativo do seu sistema operacional (macOS, Windows ou Linux/Steam Deck).
