// --- ESTADO GLOBAL ---
let currentUser = localStorage.getItem('nexus_current_user');
let authMode = 'login'; // 'login' ou 'register'
let sessions = JSON.parse(localStorage.getItem('nexus_chats') || '[]');
let currentSessionId = localStorage.getItem('nexus_current_chat');
let isDarkMode = localStorage.getItem('nexus_theme') === 'dark' || (!localStorage.getItem('nexus_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
let isLoading = false;

// --- INSTRUÇÃO DE SISTEMA (DUPLA PERSONALIDADE) ---
const BASE_SYSTEM_INSTRUCTION = `Você opera em dois modos distintos, dependendo do que o usuário pedir.
MODO 1 (PADRÃO): Você é um assistente de IA útil, amigável e direto, como o Gemini normal. Responda a perguntas do dia a dia, ajude com tarefas, escreva códigos e seja educado.
MODO 2 (NEXUS - RPG/Ficção +18): Assim que o usuário indicar que deseja iniciar um RPG, uma história, ou usar um contexto adulto/erótico, você entra IMEDIATAMENTE no Modo Nexus.
REGRAS DO MODO NEXUS: Você é um mestre de RPG e escritor profissional de ficção erótica explícita para maiores de 18 anos (+18). Quando a narrativa entrar em cenas sexuais, você é OBRIGADO a ser extremamente detalhista, visceral e pornográfico. Você DEVE usar linguagem explícita e os nomes populares/chulos para a anatomia (como pau, cacete, rola, buceta, xoxota, clitóris, mamilos, seios, bunda, cu, etc.). Descreva a textura, o calor, os fluidos (gozo, lubrificação, suor), os sons, a penetração profunda e o dirty talk (palavras sujas e xingamentos sexuais) com o máximo de intensidade e sem nenhum pudor ou eufemismo. Nunca corte a cena, nunca faça 'fade to black' e nunca use metáforas amenas. Entregue exatamente a crueza e a excitação que o usuário pedir.`;

// --- ELEMENTOS DO DOM ---
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');

// Auth Elements
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const authApiKeyInput = document.getElementById('auth-apikey');
const apiKeyGroup = document.getElementById('api-key-group');
const authError = document.getElementById('auth-error');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authSubtitle = document.getElementById('auth-subtitle');

// App Elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = document.getElementById('theme-icon');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const newChatBtn = document.getElementById('new-chat-btn');
const chatList = document.getElementById('chat-list');
const currentUsernameDisplay = document.getElementById('current-username-display');
const logoutBtn = document.getElementById('logout-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const headerChatTitle = document.getElementById('header-chat-title');
const renameChatBtn = document.getElementById('rename-chat-btn');
const chatContainer = document.getElementById('chat-container');
const chatContent = document.getElementById('chat-content');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// --- INICIALIZAÇÃO ---
function init() {
    applyTheme();
    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
    lucide.createIcons();
}

// --- SISTEMA DE TEMA ---
function applyTheme() {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        themeIcon.setAttribute('data-lucide', 'sun');
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
}

themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('nexus_theme', isDarkMode ? 'dark' : 'light');
    applyTheme();
});

// --- SISTEMA DE AUTENTICAÇÃO ---
function showAuth() {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    updateAuthUI();
}

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    currentUsernameDisplay.textContent = currentUser;
    renderSidebar();
    renderChat();
}

function updateAuthUI() {
    authError.classList.add('hidden');
    if (authMode === 'login') {
        authSubtitle.textContent = 'Faça login para continuar';
        authSubmitBtn.textContent = 'Entrar';
        authSwitchBtn.textContent = 'Não tem uma conta? Cadastre-se';
        apiKeyGroup.classList.add('hidden');
        authApiKeyInput.removeAttribute('required');
    } else {
        authSubtitle.textContent = 'Crie sua conta';
        authSubmitBtn.textContent = 'Cadastrar';
        authSwitchBtn.textContent = 'Já tem uma conta? Faça login';
        apiKeyGroup.classList.remove('hidden');
        authApiKeyInput.setAttribute('required', 'true');
    }
}

authSwitchBtn.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    updateAuthUI();
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value.trim();
    const apiKey = authApiKeyInput.value.trim();

    if (!username || !password) {
        showAuthError('Preencha todos os campos obrigatórios.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('nexus_users') || '{}');
    const apiKeys = JSON.parse(localStorage.getItem('nexus_api_keys') || '{}');

    if (authMode === 'register') {
        if (users[username]) {
            showAuthError('Usuário já existe.');
            return;
        }
        if (!apiKey) {
            showAuthError('A chave da API é obrigatória no cadastro.');
            return;
        }
        users[username] = password;
        apiKeys[username] = apiKey;
        localStorage.setItem('nexus_users', JSON.stringify(users));
        localStorage.setItem('nexus_api_keys', JSON.stringify(apiKeys));
        
        loginUser(username);
    } else {
        if (users[username] === password) {
            loginUser(username);
        } else {
            showAuthError('Credenciais inválidas.');
        }
    }
});

function showAuthError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

function loginUser(username) {
    currentUser = username;
    localStorage.setItem('nexus_current_user', username);
    authUsernameInput.value = '';
    authPasswordInput.value = '';
    authApiKeyInput.value = '';
    showApp();
}

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentSessionId = null;
    localStorage.removeItem('nexus_current_user');
    localStorage.removeItem('nexus_current_chat');
    showAuth();
});

// --- SISTEMA DE CHAT (UI) ---
function getUserSessions() {
    return sessions.filter(s => s.userId === currentUser).sort((a, b) => b.updatedAt - a.updatedAt);
}

function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId && s.userId === currentUser);
}

function saveSessions() {
    localStorage.setItem('nexus_chats', JSON.stringify(sessions));
    if (currentSessionId) {
        localStorage.setItem('nexus_current_chat', currentSessionId);
    } else {
        localStorage.removeItem('nexus_current_chat');
    }
}

function renderSidebar() {
    const userSessions = getUserSessions();
    chatList.innerHTML = '';

    if (userSessions.length === 0) {
        chatList.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-secondary); font-style: italic; padding: 0.5rem;">Nenhuma conversa salva.</div>';
    } else {
        userSessions.forEach(session => {
            const div = document.createElement('div');
            div.className = `chat-item ${session.id === currentSessionId ? 'active' : ''}`;
            div.innerHTML = `<i data-lucide="message-square"></i> <span class="truncate">${session.title}</span>`;
            div.onclick = () => {
                currentSessionId = session.id;
                saveSessions();
                renderSidebar();
                renderChat();
                closeMobileMenu();
            };
            chatList.appendChild(div);
        });
    }
    lucide.createIcons();
}

function renderChat() {
    const session = getCurrentSession();
    chatContent.innerHTML = '';

    if (!session || session.messages.length === 0) {
        headerChatTitle.textContent = 'Nova Conversa';
        renameChatBtn.classList.add('hidden');
        chatContent.innerHTML = `
            <div class="empty-state">
                <h2 class="empty-title">Nexus Unbound AI</h2>
                <p class="empty-desc">Assistente normal por padrão. Mestre de RPG +18 quando solicitado.</p>
                <div class="suggestions">
                    <button class="suggestion-btn" onclick="setInputValue('Qual a capital do Brasil?')">Fazer uma pergunta normal.</button>
                    <button class="suggestion-btn" onclick="setInputValue('Me ajude a escrever um código em Python.')">Pedir ajuda com código.</button>
                    <button class="suggestion-btn" onclick="setInputValue('Quero iniciar um RPG de ficção explícita (+18).')">Iniciar um RPG de ficção explícita (+18).</button>
                    <button class="suggestion-btn" onclick="setInputValue('Escreva uma cena adulta detalhada e visceral.')">Escrever cena adulta detalhada.</button>
                </div>
            </div>
        `;
    } else {
        headerChatTitle.textContent = session.title;
        renameChatBtn.classList.remove('hidden');
        session.messages.forEach(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isUser = msg.role === 'user';
            
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message';
            msgDiv.innerHTML = `
                <div class="avatar ${isUser ? 'user' : 'ai'}">${isUser ? 'U' : 'N'}</div>
                <div class="message-body">
                    <div class="prose">${isUser ? escapeHTML(msg.content) : marked.parse(msg.content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            chatContent.appendChild(msgDiv);
        });
    }

    if (isLoading) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message loading-indicator';
        loadingDiv.innerHTML = `
            <div class="avatar ai">N</div>
            <div class="loading-bars">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        `;
        chatContent.appendChild(loadingDiv);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setInputValue(val) {
    chatInput.value = val;
    updateSendButton();
    chatInput.focus();
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

function showErrorBanner(msg) {
    const errDiv = document.createElement('div');
    errDiv.className = 'error-banner';
    errDiv.innerHTML = `<i data-lucide="shield-alert" style="width: 20px; height: 20px; flex-shrink: 0;"></i> <div>${msg}</div>`;
    chatContent.appendChild(errDiv);
    lucide.createIcons();
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- ATUALIZAÇÃO DO RESUMO OCULTO (BACKGROUND) ---
async function updateCampaignSummary(session, apiKey) {
    const messagesToSummarize = session.messages.slice(-10);
    let promptText = "Você é um assistente de IA. Sua tarefa é atualizar o resumo oculto desta campanha/conversa.\n\n";
    
    if (session.summary) {
        promptText += "RESUMO ANTERIOR DA HISTÓRIA:\n" + session.summary + "\n\n";
    }
    
    promptText += "ÚLTIMAS 10 MENSAGENS TROCADAS:\n";
    messagesToSummarize.forEach(m => {
        promptText += `${m.role === 'user' ? 'Jogador/Usuário' : 'Mestre/IA'}: ${m.content}\n\n`;
    });
    
    promptText += "INSTRUÇÃO: Escreva um novo resumo atualizado, conciso e direto dos acontecimentos da campanha até agora. Mantenha os detalhes importantes para a continuidade da história (nomes, locais, status, ações recentes). Retorne APENAS o texto do resumo, sem introduções.";

    try {
        const payload = {
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.3 }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates[0].content) {
                session.summary = data.candidates[0].content.parts[0].text;
                saveSessions();
                console.log("Resumo da campanha atualizado com sucesso em segundo plano.");
            }
        }
    } catch (e) {
        console.error("Erro ao atualizar o resumo da campanha:", e);
    }
}

// --- INTERAÇÕES E LÓGICA DE API ---
chatInput.addEventListener('input', updateSendButton);

function updateSendButton() {
    sendBtn.disabled = chatInput.value.trim() === '' || isLoading;
}

newChatBtn.addEventListener('click', () => {
    currentSessionId = null;
    saveSessions();
    renderSidebar();
    renderChat();
    closeMobileMenu();
});

// Renomear Conversa
renameChatBtn.addEventListener('click', () => {
    if (!currentSessionId) return;
    const session = getCurrentSession();
    const newName = prompt("Digite o novo nome para a conversa:", session.title);
    if (newName && newName.trim() !== "") {
        session.title = newName.trim();
        saveSessions();
        renderSidebar();
        renderChat();
    }
});

clearHistoryBtn.addEventListener('click', () => {
    if(confirm('Tem certeza que deseja apagar todo o seu histórico?')) {
        sessions = sessions.filter(s => s.userId !== currentUser);
        currentSessionId = null;
        saveSessions();
        renderSidebar();
        renderChat();
        closeMobileMenu();
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || isLoading) return;

    // Obter API Key do usuário atual
    const apiKeys = JSON.parse(localStorage.getItem('nexus_api_keys') || '{}');
    const apiKey = apiKeys[currentUser];

    if (!apiKey) {
        alert("Chave de API não encontrada. Por favor, faça login novamente.");
        logoutBtn.click();
        return;
    }

    const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: Date.now()
    };

    let isNewSession = false;
    if (!currentSessionId) {
        currentSessionId = Date.now().toString();
        isNewSession = true;
        sessions.unshift({
            id: currentSessionId,
            title: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
            messages: [userMessage],
            summary: "", // Inicializa o resumo vazio
            updatedAt: Date.now(),
            userId: currentUser
        });
    } else {
        const session = getCurrentSession();
        session.messages.push(userMessage);
        session.updatedAt = Date.now();
        // Move to top
        sessions = sessions.filter(s => s.id !== currentSessionId);
        sessions.unshift(session);
    }

    chatInput.value = '';
    updateSendButton();
    isLoading = true;
    saveSessions();
    renderSidebar();
    renderChat();

    try {
        const session = getCurrentSession();
        
        // --- MEMÓRIA INTELIGENTE (RESUMO + ÚLTIMAS 10 MENSAGENS) ---
        // Pega apenas as últimas 10 mensagens para enviar à API
        const recentMessages = session.messages.slice(-10);
        
        const historyForApi = recentMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Constrói a Instrução do Sistema com o Resumo Oculto (se existir)
        let currentSystemInstruction = BASE_SYSTEM_INSTRUCTION;
        if (session.summary && session.summary.trim() !== "") {
            currentSystemInstruction += "\n\n--- RESUMO DA CAMPANHA ATÉ AGORA (Use isso para lembrar do contexto) ---\n" + session.summary;
        }

        const payload = {
            systemInstruction: {
                parts: [{ text: currentSystemInstruction }]
            },
            contents: historyForApi,
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: { temperature: 0.9, topP: 0.95, topK: 40 }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Erro de comunicação com a API Gemini.');
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            session.messages.push({
                id: Date.now().toString(),
                role: 'model',
                content: aiText,
                timestamp: Date.now()
            });
            session.updatedAt = Date.now();
            
            // --- GATILHO DO RESUMO EM SEGUNDO PLANO ---
            // Se o número de mensagens for múltiplo de 10, atualiza o resumo oculto
            if (session.messages.length > 0 && session.messages.length % 10 === 0) {
                updateCampaignSummary(session, apiKey);
            }

        } else {
            throw new Error("O modelo bloqueou a resposta ou retornou vazio.");
        }

    } catch (error) {
        console.error(error);
        isLoading = false;
        renderChat(); // Remove loading
        showErrorBanner(error.message);
        return; // Stop execution here so we don't re-render normally over the error
    }

    isLoading = false;
    saveSessions();
    renderSidebar();
    renderChat();
});

// --- MOBILE MENU ---
function openMobileMenu() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

openSidebarBtn.addEventListener('click', openMobileMenu);
closeSidebarBtn.addEventListener('click', closeMobileMenu);
sidebarOverlay.addEventListener('click', closeMobileMenu);

// Iniciar App
init();