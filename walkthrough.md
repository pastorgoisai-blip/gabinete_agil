# Guia de Verificação - Editor de Texto Rico

Este guia orienta você na verificação da implementação do novo Editor de Texto Rico (TDD).

## 1. Verificar Interface do Novo Editor
1.  Navegue até **Legislativo** > **Novo Documento**.
2.  Selecione qualquer modelo (ex: **Ofício de Gabinete**).
3.  **Checar Barra de Ferramentas**: Verifique se os botões de Negrito, Itálico, Sublinhado, Alinhamentos e Listas aparecem no topo do editor.
4.  **Checar Layout A4**: Verifique se a área de edição se parece com uma folha A4 branca sobre um fundo cinza.

## 2. Verificar Edição e Formatação
1.  Digite algum texto.
2.  Selecione o texto e aplique **Negrito** (B) e **Sublinhado** (U).
3.  Crie uma **Lista com Marcadores**.
4.  Mude o alinhamento para **Centralizar**.
5.  **Salvar**: Preencha os metadados e clique em **Salvar Documento**.

## 3. Verificar Edição de Documento Existente
1.  Na lista de **Protocolo**, encontre o documento que você acabou de criar.
2.  Clique no ícone de **Editar** (lápis).
3.  **Verificar**: O editor deve abrir com o seu documento carregado, preservando toda a formatação (Negrito, Listas, etc.).
4.  **Modificar**: Adicione um novo parágrafo.
5.  **Salvar**: Clique em Salvar.
6.  **Verificar Atualização**: Verifique a lista novamente; o documento não deve estar duplicado.


## 4. Verificar Busca
1.  Use a barra de busca para procurar por uma palavra que você digitou no corpo do documento.
2.  O documento deve aparecer nos resultados filtrados (se a palavra foi salva no `subject` ou correspondida via outros metadados).

## 5. Verificar Identidade Visual e Configurações
1.  Navegue até **Configurações** (engrenagem no menu lateral/inferior).
2.  Clique na nova aba **Documentos Oficiais**.
    - Verifique se aparecem os campos: **Nome Oficial**, **Cargo Oficial**.
    - Verifique se aparece o card **Papel Timbrado Digital**.
3.  **Configurar**:
    - Preencha o Nome e Cargo.
    - Ative o toggle "Ativar papel timbrado".
    - Faça upload de uma imagem para o Cabeçalho e outra para o Rodapé.
    - **Verificar Preview**: Veja se o preview A4 ao lado atualiza com suas imagens e textos.
4.  **Salvar**: Clique em "Salvar Configurações" e verifique a mensagem de sucesso.
5.  **Teste Final**:
    - Vá em **Legislativo** > **Novo Documento**.
    - O editor deve agora exibir suas imagens de cabeçalho e rodapé (se o `use_letterhead` estiver ativo).
