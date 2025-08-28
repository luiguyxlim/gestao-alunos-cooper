// Script para testar Server Actions no navegador
console.log('=== Teste de Server Action ===');

// Interceptar todas as requisições fetch
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
  console.log('🌐 [FETCH] Requisição interceptada:', {
    url: request.url,
    method: request.method,
    hasBody: !!request.body
  });
  
  return originalFetch.apply(this, args).then(response => {
    console.log('📥 [FETCH] Resposta recebida:', {
      url: request.url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    return response;
  }).catch(error => {
    console.error('❌ [FETCH] Erro na requisição:', {
      url: request.url,
      error: error.message
    });
    throw error;
  });
};

// Interceptar submissões de formulário
const originalSubmit = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function() {
  console.log('📋 [FORM] Formulário submetido:', {
    action: this.action,
    method: this.method,
    elements: this.elements.length
  });
  return originalSubmit.call(this);
};

// Interceptar eventos de submit
document.addEventListener('submit', function(event) {
  console.log('📋 [FORM] Evento submit detectado:', {
    target: event.target.tagName,
    action: event.target.action,
    method: event.target.method,
    preventDefault: event.defaultPrevented
  });
});

// Verificar se há formulários na página
function checkForms() {
  const forms = document.querySelectorAll('form');
  console.log('📋 [FORM] Formulários encontrados:', forms.length);
  
  forms.forEach((form, index) => {
    console.log(`Formulário ${index + 1}:`, {
      action: form.action,
      method: form.method,
      elements: form.elements.length,
      hasAction: !!form.action
    });
  });
  
  return forms;
}

// Verificar se há botões de exclusão
function checkDeleteButtons() {
  const buttons = document.querySelectorAll('button');
  const deleteButtons = Array.from(buttons).filter(btn => 
    btn.textContent.toLowerCase().includes('excluir') ||
    btn.textContent.toLowerCase().includes('delete') ||
    btn.className.includes('delete') ||
    btn.onclick?.toString().includes('delete')
  );
  
  console.log('🗑️ [DELETE] Botões de exclusão encontrados:', deleteButtons.length);
  
  deleteButtons.forEach((btn, index) => {
    console.log(`Botão ${index + 1}:`, {
      text: btn.textContent.trim(),
      type: btn.type,
      className: btn.className,
      hasOnClick: !!btn.onclick,
      form: btn.form?.action || 'N/A'
    });
  });
  
  return deleteButtons;
}

// Verificar cookies de autenticação
function checkAuthCookies() {
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
  
  return authCookies;
}

// Função para simular clique em botão de exclusão
function simulateDelete(buttonIndex = 0) {
  const deleteButtons = checkDeleteButtons();
  
  if (deleteButtons.length === 0) {
    console.log('❌ [TEST] Nenhum botão de exclusão encontrado');
    return;
  }
  
  if (buttonIndex >= deleteButtons.length) {
    console.log(`❌ [TEST] Índice ${buttonIndex} inválido. Máximo: ${deleteButtons.length - 1}`);
    return;
  }
  
  const button = deleteButtons[buttonIndex];
  console.log(`🖱️ [TEST] Simulando clique no botão ${buttonIndex + 1}`);
  
  // Limpar requisições anteriores
  requests.length = 0;
  
  // Simular clique
  button.click();
  
  // Aguardar um pouco e verificar requisições
  setTimeout(() => {
    console.log('📊 [TEST] Requisições após clique:', requests.length);
    requests.forEach((req, index) => {
      console.log(`  ${index + 1}. ${req.method} ${req.url}`);
    });
  }, 1000);
}

// Executar verificações iniciais
console.log('🔍 [INIT] Executando verificações iniciais...');
checkForms();
checkDeleteButtons();
checkAuthCookies();

console.log('\n=== Instruções ===');
console.log('1. Para simular exclusão: simulateDelete(0)');
console.log('2. Para verificar formulários: checkForms()');
console.log('3. Para verificar botões: checkDeleteButtons()');
console.log('4. Para verificar cookies: checkAuthCookies()');
console.log('5. Todas as requisições serão interceptadas automaticamente');

// Disponibilizar funções globalmente
window.simulateDelete = simulateDelete;
window.checkForms = checkForms;
window.checkDeleteButtons = checkDeleteButtons;
window.checkAuthCookies = checkAuthCookies;
window.getRequests = () => requests;

console.log('✅ [INIT] Script de teste carregado com sucesso!');