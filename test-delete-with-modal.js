// Script para testar a exclusão de testes com o modal de confirmação
// Execute este script no console do navegador após abrir a aplicação

console.log('🧪 [TEST] Iniciando teste de exclusão com modal...');

// Interceptar requisições de exclusão
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (options && options.method === 'DELETE') {
    console.log('🔴 [TEST] Requisição DELETE interceptada:', url, options);
  }
  
  return originalFetch.apply(this, args)
    .then(response => {
      if (options && options.method === 'DELETE') {
        console.log('🔴 [TEST] Resposta da requisição DELETE:', response.status, response.statusText);
        if (!response.ok) {
          console.error('🔴 [TEST] Erro na requisição DELETE:', response);
        }
      }
      return response;
    })
    .catch(error => {
      if (options && options.method === 'DELETE') {
        console.error('🔴 [TEST] Erro na requisição DELETE:', error);
      }
      throw error;
    });
};

// Interceptar erros de console
const originalError = console.error;
console.error = function(...args) {
  if (args.some(arg => typeof arg === 'string' && arg.includes('TestCard'))) {
    console.log('🔴 [TEST] Erro do TestCard capturado:', ...args);
  }
  return originalError.apply(this, args);
};

// Interceptar logs do TestCard
const originalLog = console.log;
console.log = function(...args) {
  if (args.some(arg => typeof arg === 'string' && arg.includes('TestCard'))) {
    console.log('📝 [TEST] Log do TestCard:', ...args);
  }
  return originalLog.apply(this, args);
};

// Função para simular clique no botão de exclusão
function testDeleteButton() {
  console.log('🧪 [TEST] Procurando botões de exclusão...');
  
  const deleteButtons = document.querySelectorAll('button');
  const deleteButton = Array.from(deleteButtons).find(button => 
    button.textContent.includes('Excluir') && 
    !button.textContent.includes('Excluindo')
  );
  
  if (deleteButton) {
    console.log('🧪 [TEST] Botão de exclusão encontrado:', deleteButton);
    console.log('🧪 [TEST] Clicando no botão de exclusão...');
    deleteButton.click();
    
    // Aguardar o modal aparecer
    setTimeout(() => {
      console.log('🧪 [TEST] Procurando modal de confirmação...');
      
      // Procurar pelo modal
      const modal = document.querySelector('[role="dialog"], .fixed.inset-0, .modal');
      if (modal) {
        console.log('🧪 [TEST] Modal encontrado:', modal);
        
        // Procurar botão de confirmar no modal
        const confirmButtons = modal.querySelectorAll('button');
        const confirmButton = Array.from(confirmButtons).find(button => 
          button.textContent.includes('Excluir') || 
          button.textContent.includes('Confirmar')
        );
        
        if (confirmButton) {
          console.log('🧪 [TEST] Botão de confirmação encontrado:', confirmButton);
          console.log('🧪 [TEST] ⚠️  ATENÇÃO: Clique manualmente no botão "Excluir" no modal para testar!');
          
          // Destacar o botão
          confirmButton.style.border = '3px solid red';
          confirmButton.style.boxShadow = '0 0 10px red';
          
        } else {
          console.log('🧪 [TEST] ❌ Botão de confirmação não encontrado no modal');
        }
      } else {
        console.log('🧪 [TEST] ❌ Modal não encontrado');
      }
    }, 500);
    
  } else {
    console.log('🧪 [TEST] ❌ Botão de exclusão não encontrado');
    console.log('🧪 [TEST] Botões disponíveis:', Array.from(deleteButtons).map(b => b.textContent));
  }
}

// Função para verificar se há testes na página
function checkTests() {
  const testCards = document.querySelectorAll('[class*="bg-white"][class*="shadow"]');
  console.log('🧪 [TEST] Número de cards de teste encontrados:', testCards.length);
  
  if (testCards.length === 0) {
    console.log('🧪 [TEST] ❌ Nenhum teste encontrado na página. Certifique-se de estar na página de testes.');
    return false;
  }
  
  return true;
}

// Executar teste
if (checkTests()) {
  console.log('🧪 [TEST] Aguarde 2 segundos e então clique em um botão "Excluir"...');
  setTimeout(testDeleteButton, 2000);
} else {
  console.log('🧪 [TEST] Navegue para a página de testes e execute o script novamente.');
}

console.log('🧪 [TEST] Script de teste carregado. Monitore os logs acima.');