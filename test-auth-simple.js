// Script simples para testar autenticação no navegador
console.log('=== Teste de Autenticação Simples ===');

// Verificar se há dados de autenticação no localStorage
const authData = {
  localStorage: {
    supabaseAuth: localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token'),
    allKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'))
  },
  sessionStorage: {
    supabaseAuth: sessionStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token'),
    allKeys: Object.keys(sessionStorage).filter(key => key.includes('supabase') || key.includes('auth'))
  },
  cookies: document.cookie.split(';').filter(cookie => 
    cookie.includes('supabase') || cookie.includes('auth') || cookie.includes('sb-')
  )
};

console.log('🔍 Dados de autenticação encontrados:', authData);

// Verificar se há um cliente Supabase global
if (window.supabase) {
  console.log('✅ Cliente Supabase encontrado');
  
  // Tentar obter o usuário atual
  window.supabase.auth.getUser().then(({ data: { user }, error }) => {
    if (error) {
      console.error('❌ Erro ao obter usuário:', error);
    } else if (user) {
      console.log('✅ Usuário autenticado:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('❌ Nenhum usuário autenticado');
    }
  });
} else {
  console.log('❌ Cliente Supabase não encontrado no window');
}

// Verificar se há formulários de Server Action na página
const forms = document.querySelectorAll('form[action]');
console.log('📋 Formulários com action encontrados:', forms.length);

forms.forEach((form, index) => {
  console.log(`Formulário ${index + 1}:`, {
    action: form.action,
    method: form.method,
    elements: form.elements.length
  });
});

// Verificar se há botões de exclusão
const deleteButtons = document.querySelectorAll('button[type="button"]');
const deleteButtonsFiltered = Array.from(deleteButtons).filter(btn => 
  btn.textContent.toLowerCase().includes('excluir') || 
  btn.textContent.toLowerCase().includes('delete') ||
  btn.className.includes('delete') ||
  btn.onclick?.toString().includes('delete')
);

console.log('🗑️ Botões de exclusão encontrados:', deleteButtonsFiltered.length);

deleteButtonsFiltered.forEach((btn, index) => {
  console.log(`Botão ${index + 1}:`, {
    text: btn.textContent.trim(),
    className: btn.className,
    onclick: btn.onclick?.toString().substring(0, 100) + '...'
  });
});

// Função para testar uma exclusão manualmente
window.testDelete = function(testId) {
  console.log('🧪 Testando exclusão manual para teste:', testId);
  
  // Tentar chamar a função deleteTest diretamente se estiver disponível
  if (window.deleteTest) {
    console.log('📞 Chamando window.deleteTest...');
    window.deleteTest(testId).then(() => {
      console.log('✅ Exclusão bem-sucedida');
    }).catch(error => {
      console.error('❌ Erro na exclusão:', error);
    });
  } else {
    console.log('❌ Função deleteTest não encontrada no window');
  }
};

console.log('✅ Teste de autenticação concluído');
console.log('💡 Para testar exclusão manual, use: testDelete("ID_DO_TESTE")');