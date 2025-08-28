// Script detalhado para testar Server Actions
console.log('=== Teste Detalhado de Server Action ===');

// Interceptar todas as requisições
const originalFetch = window.fetch;
const requests = [];

window.fetch = function(...args) {
  const [url, options] = args;
  const request = {
    url,
    method: options?.method || 'GET',
    headers: options?.headers || {},
    body: options?.body,
    timestamp: new Date().toISOString()
  };
  
  requests.push(request);
  
  // Log detalhado para Server Actions
  if (url.includes('/_next/static/chunks/') || url.includes('action')) {
    console.log('🚀 [SERVER ACTION] Possível Server Action detectada:', {
      url: request.url,
      method: request.method,
      headers: request.headers,
      bodyType: typeof request.body,
      bodyLength: request.body ? request.body.length : 0
    });
  }
  
  return originalFetch.apply(this, args).then(response => {
    console.log('📥 [RESPONSE]', {
      url: request.url,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    // Se for uma resposta de erro, vamos capturar o conteúdo
    if (!response.ok) {
      response.clone().text().then(text => {
        console.error('❌ [ERROR RESPONSE]', {
          url: request.url,
          status: response.status,
          body: text.substring(0, 500) // Primeiros 500 caracteres
        });
      }).catch(() => {});
    }
    
    return response;
  }).catch(error => {
    console.error('❌ [FETCH ERROR]', {
      url: request.url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  });
};

// Interceptar erros globais
window.addEventListener('error', function(event) {
  console.error('❌ [GLOBAL ERROR]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('❌ [UNHANDLED REJECTION]', {
    reason: event.reason,
    promise: event.promise
  });
});

// Interceptar console.error para capturar erros do React/Next.js
const originalConsoleError = console.error;
console.error = function(...args) {
  console.log('🔴 [CONSOLE ERROR]', args);
  return originalConsoleError.apply(this, args);
};

// Verificar se há formulários com action
function checkServerActions() {
  const forms = document.querySelectorAll('form[action]');
  console.log('📋 [SERVER ACTIONS] Formulários com action encontrados:', forms.length);
  
  forms.forEach((form, index) => {
    console.log(`Formulário ${index + 1}:`, {
      action: form.action,
      method: form.method,
      enctype: form.enctype,
      elements: Array.from(form.elements).map(el => ({
        name: el.name,
        type: el.type,
        value: el.value
      }))
    });
  });
  
  return forms;
}

// Verificar se há elementos com formAction
function checkFormActions() {
  const elements = document.querySelectorAll('[formaction]');
  console.log('🎯 [FORM ACTIONS] Elementos com formAction encontrados:', elements.length);
  
  elements.forEach((el, index) => {
    console.log(`Elemento ${index + 1}:`, {
      tagName: el.tagName,
      formAction: el.formAction,
      type: el.type,
      textContent: el.textContent.trim()
    });
  });
  
  return elements;
}

// Verificar autenticação
function checkAuth() {
  console.log('🔐 [AUTH] Verificando autenticação...');
  
  // Cookies
  const cookies = document.cookie.split(';').map(c => c.trim());
  const authCookies = cookies.filter(cookie => 
    cookie.includes('supabase') || 
    cookie.includes('auth') || 
    cookie.includes('sb-')
  );
  
  console.log('🍪 [AUTH] Cookies de autenticação:', authCookies.length);
  authCookies.forEach(cookie => {
    const [name] = cookie.split('=');
    console.log(`  - ${name}`);
  });
  
  // LocalStorage
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth')
  );
  
  console.log('💾 [AUTH] LocalStorage keys:', localStorageKeys);
  
  // SessionStorage
  const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('supabase') || key.includes('auth')
  );
  
  console.log('📝 [AUTH] SessionStorage keys:', sessionStorageKeys);
  
  return {
    cookies: authCookies,
    localStorage: localStorageKeys,
    sessionStorage: sessionStorageKeys
  };
}

// Função para testar exclusão manualmente
function testDeleteAction(testId) {
  console.log('🧪 [TEST] Testando exclusão manual para ID:', testId);
  
  // Limpar requisições anteriores
  requests.length = 0;
  
  // Tentar encontrar a função deleteTest no escopo global
  if (typeof window.deleteTest === 'function') {
    console.log('✅ [TEST] Função deleteTest encontrada no escopo global');
    
    window.deleteTest(testId)
      .then(result => {
        console.log('✅ [TEST] deleteTest executado com sucesso:', result);
      })
      .catch(error => {
        console.error('❌ [TEST] Erro ao executar deleteTest:', error);
      });
  } else {
    console.log('❌ [TEST] Função deleteTest não encontrada no escopo global');
    
    // Tentar criar uma requisição manual
    const formData = new FormData();
    formData.append('id', testId);
    
    fetch('/api/tests/delete', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      console.log('📥 [TEST] Resposta da requisição manual:', response.status);
      return response.text();
    })
    .then(text => {
      console.log('📄 [TEST] Conteúdo da resposta:', text.substring(0, 200));
    })
    .catch(error => {
      console.error('❌ [TEST] Erro na requisição manual:', error);
    });
  }
}

// Executar verificações iniciais
console.log('🔍 [INIT] Executando verificações iniciais...');
checkServerActions();
checkFormActions();
checkAuth();

// Monitorar cliques em botões
document.addEventListener('click', function(event) {
  const target = event.target;
  
  if (target.tagName === 'BUTTON' && 
      (target.textContent.toLowerCase().includes('excluir') || 
       target.textContent.toLowerCase().includes('delete'))) {
    
    console.log('🖱️ [CLICK] Clique em botão de exclusão detectado:', {
      text: target.textContent.trim(),
      className: target.className,
      disabled: target.disabled,
      form: target.form?.action || 'N/A',
      formAction: target.formAction || 'N/A'
    });
    
    // Limpar requisições para monitorar apenas as do clique
    requests.length = 0;
  }
});

console.log('\n=== Instruções ===');
console.log('1. Para testar exclusão manual: testDeleteAction("ID_DO_TESTE")');
console.log('2. Para verificar Server Actions: checkServerActions()');
console.log('3. Para verificar Form Actions: checkFormActions()');
console.log('4. Para verificar autenticação: checkAuth()');
console.log('5. Clique em qualquer botão de exclusão para monitorar requisições');

// Disponibilizar funções globalmente
window.testDeleteAction = testDeleteAction;
window.checkServerActions = checkServerActions;
window.checkFormActions = checkFormActions;
window.checkAuth = checkAuth;
window.getRequests = () => requests;

console.log('✅ [INIT] Script de teste detalhado carregado com sucesso!');