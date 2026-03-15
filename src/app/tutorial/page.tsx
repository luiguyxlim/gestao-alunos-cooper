import ResponsiveNavigation from '@/components/ResponsiveNavigation'
import { getAuthenticatedUser } from '@/lib/supabase-server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function TutorialPage() {
  const { user } = await getAuthenticatedUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ResponsiveNavigation user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="relative mb-8 p-8 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl text-white">🎓</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tutorial do Cooper Pro</h1>
                    <p className="text-blue-100 text-lg">Aprenda passo a passo como usar o aplicativo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <Tabs defaultValue="quickstart" className="w-full">
              <div className="border-b border-gray-100 bg-gray-50">
                <TabsList className="grid w-full grid-cols-4 bg-transparent p-1">
                  <TabsTrigger value="quickstart" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium">Início Rápido</TabsTrigger>
                  <TabsTrigger value="steps" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium">Passo a Passo</TabsTrigger>
                  <TabsTrigger value="faq" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium">FAQ</TabsTrigger>
                  <TabsTrigger value="video" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-gray-600 font-medium">Vídeo</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="quickstart" className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entrar e configurar</CardTitle>
                      <CardDescription>Faça login e confirme seu perfil</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2"><Badge variant="secondary">1</Badge><span>Acesse o painel em Dashboard</span></div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">2</Badge><span>Revise suas informações de usuário</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Cadastrar avaliando</CardTitle>
                      <CardDescription>Registre dados essenciais do aluno</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2"><Badge variant="secondary">1</Badge><span>Abra Avaliandos e clique em Novo Avaliando</span></div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">2</Badge><span>Preencha nome, data de nascimento, gênero e peso</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Realizar Teste de Cooper</CardTitle>
                      <CardDescription>Registre a distância e gere o VO2 Máx</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2"><Badge variant="secondary">1</Badge><span>Em Testes, selecione Teste de Cooper</span></div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">2</Badge><span>Informe a distância de 12 minutos e salve</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Prescrição de Treinamento</CardTitle>
                      <CardDescription>Defina intensidade, tempo e gere variáveis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2"><Badge variant="secondary">1</Badge><span>Selecione intensidade (%) e tempo</span></div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">2</Badge><span>Confira MET Máx, FT, IT (METS), velocidade e O2</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Acompanhar Performance</CardTitle>
                      <CardDescription>Veja métricas e evolução de VO2 Máx</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2"><Badge variant="secondary">1</Badge><span>Abra Performance e a aba Evolução</span></div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">2</Badge><span>Exporte dados em PDF ou XLSX</span></div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Gerar Relatórios</CardTitle>
                      <CardDescription>Exportações por aluno ou grupo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2"><Badge variant="secondary">1</Badge><span>Use Relatórios para PDF/XLSX/CSV</span></div>
                      <div className="flex items-center gap-2"><Badge variant="secondary">2</Badge><span>Aplique filtros de período e tipo</span></div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="p-8">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cadastro de Avaliando</CardTitle>
                      <CardDescription>Dados mínimos para cálculos corretos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>Abra Avaliandos, clique em Novo Avaliando e informe nome, data de nascimento, gênero e peso. Salve para habilitar cálculos de VO2 e prescrição.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Teste de Cooper</CardTitle>
                      <CardDescription>Registro da distância e geração do VO2 Máx</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>Na seção Testes, selecione Teste de Cooper, informe data e distância percorrida em 12 minutos. O VO2 Máx é calculado automaticamente e salvo no histórico.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Prescrição de Treinamento</CardTitle>
                      <CardDescription>Variáveis derivadas com IT em METS</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>Selecione intensidade (%) e tempo. O sistema calcula MET Máx, Fração, IT (METS), velocidade, distância, consumo de O2, gasto calórico e perda de peso.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Treino Intervalado</CardTitle>
                      <CardDescription>Sessões com múltiplos treinos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>Adicione treinos com distância e intensidade, defina repetições e descanso. Use “Variáveis do Treinamento” para revisar métricas antes de salvar.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance e Relatórios</CardTitle>
                      <CardDescription>Evolução de VO2 Máx e exportações</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>Na aba Evolução, visualize VO2 Máx ao longo do tempo por aluno e exporte em PDF/XLSX. Em Relatórios, gere documentos detalhados por período.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle>Como exporto resultados?</CardTitle></CardHeader>
                    <CardContent><p>Use os botões de exportação em Performance e Relatórios para gerar PDF ou XLSX.</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Onde vejo a evolução?</CardTitle></CardHeader>
                    <CardContent><p>Abra Performance e selecione a aba Evolução para acompanhar VO2 Máx por aluno.</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>IT está em METS?</CardTitle></CardHeader>
                    <CardContent><p>Sim, a Intensidade do Treinamento é exibida em METS conforme a prescrição.</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Posso editar um teste?</CardTitle></CardHeader>
                    <CardContent><p>Sim, acesse o teste e use a ação de editar quando disponível.</p></CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="video" className="p-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Vídeo Explicativo</CardTitle>
                    <CardDescription>Em breve</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-64 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-600">Vídeo em breve</p>
                        <Button variant="ghost" size="sm" className="mt-2">Saiba mais</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
