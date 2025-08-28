// Script final para testar exclusão após correção RLS
// Execute este script no console do navegador na página da aplicação

console.log('=== Teste Final de Exclusão ===');

// Função para testar exclusão de um teste específico
async function testDeleteFunction() {
  try {
    // Verificar se estamos na página correta
    if (!window.location.href.includes('localhost:3000')) {
      console.log('❌ Execute este script na página da aplicação (localhost:3000)');
      return;
    }
    
    // Verificar se há botões de exclusão na página
    const deleteButtons = document.querySelectorAll('button[class*="delete"], button:has(svg), button[aria-label*="delete"], button[title*="delete"]');
    console.log(`Encontrados ${deleteButtons.length} possíveis botões de exclusão`);
    
    // Procurar especificamente por botões com texto "Excluir" ou ícones de lixeira
    const specificDeleteButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
      const text = btn.textContent.toLowerCase();
      const hasDeleteIcon = btn.querySelector('svg') && (text.includes('excluir') || text.includes('delete'));
      const hasDeleteText = text.includes('excluir') || text.includes('delete');
      return hasDeleteIcon || hasDeleteText;
    });
    
    console.log(`Encontrados ${specificDeleteButtons.length} botões de exclusão específicos`);
    
    if (specificDeleteButtons.length === 0) {
      console.log('ℹ️  Nenhum botão de exclusão encontrado. Certifique-se de estar na página com os testes.');
      return;
    }
    
    // Interceptar requisições de rede
    const originalFetch = window.fetch;
    let deleteRequest = null;
    
    window.fetch = function(...args) {
      const [url, options] = args;
      if (options && options.method === 'DELETE') {
        deleteRequest = { url, options };
        console.log('🔍 Requisição DELETE interceptada:', url);
      }
      return originalFetch.apply(this, args);
    };
    
    // Interceptar erros de console
    const originalError = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args);
      originalError.apply(this, args);
    };
    
    console.log('✅ Interceptadores configurados');
    console.log('📝 Agora clique em um botão "Excluir" para testar');
    console.log('⏱️  Aguardando ação do usuário...');
    
    // Aguardar clique em botão de exclusão
    return new Promise((resolve) => {
      specificDeleteButtons.forEach((btn, index) => {
        btn.addEventListener('click', async function() {
          console.log(`🖱️  Clique detectado no botão ${index + 1}`);
          
          // Aguardar um pouco para a requisição ser feita
          setTimeout(() => {
            console.log('\n=== Resultado do Teste ===');
            
            if (deleteRequest) {
              console.log('✅ Requisição DELETE foi feita:', deleteRequest.url);
            } else {
              console.log('❌ Nenhuma requisição DELETE detectada');
            }
            
            if (errors.length > 0) {
              console.log('❌ Erros detectados:');
              errors.forEach((error, i) => {
                console.log(`  ${i + 1}.`, error);
              });
            } else {
              console.log('✅ Nenhum erro detectado no console');
            }
            
            // Restaurar funções originais
            window.fetch = originalFetch;
            console.error = originalError;
            
            resolve();
          }, 2000);
        }, { once: true });
      });
    });
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testDeleteFunction();

// Instruções para o usuário
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Este script está aguardando você clicar em um botão "Excluir"');
console.log('2. Clique em qualquer botão de exclusão de teste');
console.log('3. O script mostrará o resultado do teste');
console.log('4. Se a exclusão funcionar, o problema foi resolvido!');