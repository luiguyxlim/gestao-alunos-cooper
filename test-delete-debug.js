// Script para debugar problemas de exclusão de testes
// Execute este script no console do navegador na página de testes

console.log('🔍 [DEBUG] Iniciando debug da exclusão de testes...');

// Interceptar todas as requisições fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 [FETCH] Requisição interceptada:', args[0], args[1]);
  
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('📥 [FETCH] Resposta recebida:', {
        url: args[0],
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Clone a resposta para poder ler o corpo
      const clonedResponse = response.clone();
      
      // Tentar ler o corpo da resposta
      clonedResponse.text().then(text => {
        console.log('📄 [FETCH] Corpo da resposta:', text);
      }).catch(err => {
        console.log('❌ [FETCH] Erro ao ler corpo da resposta:', err);
      });
      
      return response;
    })
    .catch(error => {
      console.error('❌ [FETCH] Erro na requisição:', error);
      throw error;
    });
};

// Interceptar erros globais
window.addEventListener('error', (event) => {
  console.error('❌ [ERROR] Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ [PROMISE] Promise rejeitada não tratada:', event.reason);
});

// Função para verificar autenticação
function checkAuthentication() {
  console.log('🔐 [AUTH] Verificando autenticação...');
  
  // Verificar cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  console.log('🍪 [AUTH] Cookies encontrados:', Object.keys(cookies));
  
  // Procurar por cookies do Supabase
  const supabaseCookies = Object.keys(cookies).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  console.log('🔑 [AUTH] Cookies do Supabase:', supabaseCookies);
  
  // Verificar localStorage
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  console.log('💾 [AUTH] LocalStorage do Supabase:', localStorageKeys);
  
  // Verificar sessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  console.log('📝 [AUTH] SessionStorage do Supabase:', sessionStorageKeys);
}

// Função para testar exclusão manualmente
function testDeleteFunction(testId) {
  console.log(`🧪 [TEST] Testando exclusão do teste: ${testId}`);
  
  // Simular uma requisição DELETE
  fetch(`/api/tests/${testId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    console.log('✅ [TEST] Resposta da exclusão:', response);
    return response.text();
  })
  .then(text => {
    console.log('📄 [TEST] Corpo da resposta:', text);
  })
  .catch(error => {
    console.error('❌ [TEST] Erro na exclusão:', error);
  });
}

// Função para monitorar cliques nos botões de exclusão
function monitorDeleteButtons() {
  console.log('👀 [MONITOR] Monitorando botões de exclusão...');
  
  // Encontrar todos os botões de exclusão
  const deleteButtons = document.querySelectorAll('button[class*="red"]');
  console.log(`🔴 [MONITOR] Encontrados ${deleteButtons.length} botões de exclusão`);
  
  deleteButtons.forEach((button, index) => {
    button.addEventListener('click', (event) => {
      console.log(`🔴 [MONITOR] Botão de exclusão ${index} clicado:`, {
        button: button,
        event: event,
        disabled: button.disabled,
        textContent: button.textContent
      });
    });
  });
}

// Função para verificar se há Server Actions sendo executadas
function monitorServerActions() {
  console.log('⚡ [SERVER] Monitorando Server Actions...');
  
  // Interceptar submissões de formulários
  document.addEventListener('submit', (event) => {
    console.log('📋 [SERVER] Formulário submetido:', {
      form: event.target,
      action: event.target.action,
      method: event.target.method,
      formData: new FormData(event.target)
    });
  });
}

// Executar verificações iniciais
checkAuthentication();
monitorDeleteButtons();
monitorServerActions();

console.log('✅ [DEBUG] Debug configurado! Agora tente excluir um teste.');
console.log('💡 [DEBUG] Comandos disponíveis:');
console.log('  - checkAuthentication(): Verificar autenticação');
console.log('  - testDeleteFunction(testId): Testar exclusão manual');
console.log('  - monitorDeleteButtons(): Re-monitorar botões');

// Exportar funções para uso manual
window.debugDelete = {
  checkAuthentication,
  testDeleteFunction,
  monitorDeleteButtons,
  monitorServerActions
};