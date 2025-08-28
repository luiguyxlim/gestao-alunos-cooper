// Script para testar exclusão de testes na interface web
// Execute este script no console do navegador na página de testes

console.log('=== Teste de Exclusão na Interface Web ===');

// Função para simular clique no botão de exclusão
function testDeleteButton() {
  console.log('Procurando botões de exclusão...');
  
  // Procurar por botões de exclusão (podem ter diferentes seletores)
  const deleteButtons = document.querySelectorAll('button[aria-label*="Excluir"], button[title*="Excluir"], button:has(svg), .delete-btn, [data-testid*="delete"]');
  
  console.log(`Encontrados ${deleteButtons.length} possíveis botões de exclusão`);
  
  deleteButtons.forEach((btn, index) => {
    console.log(`Botão ${index + 1}:`, {
      text: btn.textContent?.trim(),
      className: btn.className,
      ariaLabel: btn.getAttribute('aria-label'),
      title: btn.getAttribute('title'),
      onclick: btn.onclick?.toString(),
      element: btn
    });
  });
  
  return deleteButtons;
}

// Função para interceptar requisições de rede
function interceptNetworkRequests() {
  console.log('Interceptando requisições de rede...');
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('Fetch request:', args);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('Fetch response:', response);
        return response;
      })
      .catch(error => {
        console.error('Fetch error:', error);
        throw error;
      });
  };
  
  // Interceptar XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalSend = xhr.send;
    
    xhr.send = function(...args) {
      console.log('XHR request:', {
        method: xhr.method || 'GET',
        url: xhr.url,
        data: args[0]
      });
      return originalSend.apply(this, args);
    };
    
    xhr.addEventListener('load', function() {
      console.log('XHR response:', {
        status: xhr.status,
        response: xhr.response
      });
    });
    
    xhr.addEventListener('error', function() {
      console.error('XHR error:', xhr);
    });
    
    return xhr;
  };
}

// Função para verificar estado da autenticação
function checkAuthState() {
  console.log('Verificando estado da autenticação...');
  
  // Verificar localStorage
  const supabaseAuth = localStorage.getItem('sb-localhost-auth-token') || localStorage.getItem('supabase.auth.token');
  console.log('Token no localStorage:', supabaseAuth ? 'Presente' : 'Ausente');
  
  // Verificar sessionStorage
  const sessionAuth = sessionStorage.getItem('sb-localhost-auth-token') || sessionStorage.getItem('supabase.auth.token');
  console.log('Token no sessionStorage:', sessionAuth ? 'Presente' : 'Ausente');
  
  // Verificar cookies
  const cookies = document.cookie;
  console.log('Cookies:', cookies);
  
  // Verificar se existe objeto global do Supabase
  if (typeof window.supabase !== 'undefined') {
    console.log('Cliente Supabase encontrado');
    window.supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error('Erro ao obter usuário:', error);
      } else {
        console.log('Usuário autenticado:', user);
      }
    });
  } else {
    console.log('Cliente Supabase não encontrado no window');
  }
}

// Função para verificar erros no console
function setupErrorLogging() {
  console.log('Configurando captura de erros...');
  
  // Capturar erros JavaScript
  window.addEventListener('error', function(event) {
    console.error('Erro JavaScript:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Capturar promises rejeitadas
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise rejeitada:', event.reason);
  });
}

// Executar testes
setupErrorLogging();
interceptNetworkRequests();
checkAuthState();
testDeleteButton();

console.log('=== Instruções ===');
console.log('1. Clique em um botão de exclusão');
console.log('2. Observe os logs no console');
console.log('3. Verifique se há erros de rede ou autenticação');
console.log('4. Para testar um botão específico, use: deleteButtons[0].click()');