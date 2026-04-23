const fs = require('fs');

const text = `
DMAE - Departamento Municipal de Água e Esgotos

1. Conselho Consultivo (CC)
   - Órgão colegiado de controle social

2. Delegação de Controle (DC)
   - Órgão fiscal

3. Diretoria-Geral (DG)
   - Órgão executivo central

   3.1. Presidência (GAB-PRES)

        3.1.1. Assessoria de Comunicação (A-COM)

        3.1.2. Gabinete da Diretoria-Geral (GAB-DG)

               3.1.2.1. Assessoria de Apoio à Procuradoria Municipal Especializada Autárquica (A-PME)

                        3.1.2.1.1. Assessoria para Assuntos Funcionais (A-AF)

                        3.1.2.1.2. Assessoria de Cadastro, Distribuição, Controle Financeiro e Pessoal (A-CDCFP)

   3.2. Diretoria Executiva (GAB-DE)

        3.2.1. Coordenação de Aprovação Hidrossanitário (C-HIDRO)

               3.2.1.1. Equipe de Aprovação de Hidrossanitário (EQ-APROVHIDRO)

               3.2.1.2. Equipe de Vistoria de Hidrossanitário (EQ-VISTOHIDRO)

        3.2.2. Coordenação de Gestão e Educação Ambiental (C-GAMB)

               3.2.2.1. Equipe de Licenciamento (EQ-LIC)

               3.2.2.2. Equipe de Gestão de Resíduos (EQ-GESRE)

               3.2.2.3. Equipe de Educação Ambiental (EQ-EDUAMB)

        3.2.3. Coordenação Comunitária (C-COMUNITARIA)

               3.2.3.1. Assessoria Comunitária (A-COMUNI)

               3.2.3.2. Assessoria Legislativa (A-LEGIS)

               3.2.3.3. Equipe de Obras Comunitárias (EQ-OBRASCOM)

4. Diretoria de Gestão Estratégica e Monitoramento de Projetos (D-GEMP)

   4.1. Coordenação de Captação de Recursos e Acompanhamento da Execução e Prestação de Contas (C-CRAEPC)

   4.2. Coordenação do Escritório de Projetos Especiais (C-PROESP)

        4.2.1. Assessoria Técnica 1 (A-TEC 1)

        4.2.2. Assessoria Técnica 2 (A-TEC 2)

        4.2.3. Assessoria Técnica 3 (A-TEC 3)

        4.2.4. Equipe de Projetos Complementares (EQ-PROJCOMP)

        4.2.5. Equipe de Análises Geoespaciais (EQ-ANAGEO)

        4.2.6. Equipe de Trabalho Técnico Social (EQ-TTS)

   4.3. Coordenação de Monitoramento de Projetos (C-MONITOPROJ)

   4.4. Coordenação de Monitoramento Orçamentário (C-MONITORC)

   4.5. Coordenação de Planejamento Estratégico, Processos e Indicadores (C-PEPI)

   4.6. Centro de Supervisão Operacional e TI (CSO)

        4.6.1. Coordenação Técnica de Automação e Sistemas (C-AUTSIST)

               4.6.1.1. Equipe de Gestão de TI (EQ-GESTI)

        4.6.2. Coordenação de Geoprocessamento (C-GEOPROC)

               4.6.2.1. Equipe de Sistemas de Informação Geográfica (EQ-INFGEO)

5. Diretoria Administrativa e Patrimonial (D-ADM)

   5.1. Assessoria Técnica (A-TECNICA)

   5.2. Gerência de Gestão de Pessoas (GPES)

        5.2.1. Coordenação de Relações do Trabalho (C-RELTRAB)

               5.2.1.1. Equipe da Folha de Pagamento (EQ-FOLHA)

               5.2.1.2. Equipe de Registros Funcionais (EQ-REGISTROS)

        5.2.2. Coordenação de Ingresso e Movimentação (C-INGRESSO)

   5.3. Gerência de Segurança e Desenvolvimento Organizacional (GSDO)

        5.3.1. Coordenação de Gestão do Desenvolvimento (C-DESENVOLV)

               5.3.1.1. Equipe de Técnica (EQ-TECNICA)

               5.3.1.2. Equipe de Promoção à Qualidade de Vida (EQ-QUALIVIDA)

        5.3.2. Coordenação de Gestão de Capacitações em Segurança (C-GCS)

               5.3.2.1. Equipe de Treinamento em Segurança do Trabalhador (EQ-TRESEG)

        5.3.3. Coordenação de Segurança do Trabalho (C-SEGTRAB)

               5.3.3.1. Equipe de Segurança do Trabalho (EQ-SEGTRAB)

   5.4. Gerência de Serviços Compartilhados (GSER)

        5.4.1. Equipe de Gestão Documental (EQ-GESDOC)

        5.4.2. Coordenação de Manutenção Predial (C-MAPRED)

               5.4.2.1. Equipe de Manutenção Predial (EQ-MANPRED)

               5.4.2.2. Equipe de Conservação de Áreas Verdes (EQ-VERDES)

               5.4.2.3. Equipe de Higienização Predial (EQ-HIGPRED)

        5.4.3. Coordenação de Manutenção de Frota e Transportes (C-MAFROT)

               5.4.3.1. Equipe de Manutenção de Frota e Equipamentos Móveis (EQ-MANFEM)

               5.4.3.2. Equipe de Transportes (EQ-TRANSP)

        5.4.4. Coordenação de Gestão de Patrimônio (C-PATRI)

               5.4.4.1. Equipe de Patrimônio Mobiliário (EQ-MOB)

               5.4.4.2. Equipe de Patrimônio Imobiliário (EQ-IMOB)

        5.4.5. Coordenação de Segurança Patrimonial (C-SEGPATR)

               5.4.5.1. Equipe de Segurança Patrimonial I (EQ-SEGPATR I)

               5.4.5.2. Equipe de Segurança Patrimonial II (EQ-SEGPATR II)

               5.4.5.3. Equipe de Segurança Patrimonial III (EQ-SEGPATR III)

               5.4.5.4. Equipe de Segurança Patrimonial IV (EQ-SEGPATR IV)

               5.4.5.5. Equipe de Sistema de Segurança e Telecomunicações (EQ-SEGTEL)

        5.4.6. Coordenação de Repavimentação (C-REPAVI)

               5.4.6.1. Equipe de Fiscalização (EQ-FISCAL)

               5.4.6.2. Equipe de Controle (EQ-CONTROLE)

   5.5. Gerência de Licitações e Contratos (GLIC)

        5.5.1. Coordenação de Elaboração e Apoio aos Editais (C-EDITAIS)

        5.5.2. Coordenação de Condução e Julgamento das Licitações (C-JULGA)

        5.5.3. Coordenação de Fiscalização e Gestão de Contratos (C-FISCON)

   5.6. Gerência de Suprimentos (GSUP)

        5.6.1. Coordenação de Materiais (C-MATERIAIS)

               5.6.1.1. Equipe de Reposição Automática (EQ-RA)

        5.6.2. Coordenação de Armazenamento (C-ARMAZENA)

               5.6.2.1. Equipe de Gestão de Recebimento (EQ-RECEBE)

               5.6.2.2. Equipe de Almoxarifado I (EQ-ALMOX I)

               5.6.2.3. Equipe de Almoxarifado II (EQ-ALMOX II)

               5.6.2.4. Equipe Subalmoxarifado Centro (EQ-ALMOCEN)

               5.6.2.5. Equipe Subalmoxarifado Leste (EQ-ALMOLES)

               5.6.2.6. Equipe Subalmoxarifado Sul (EQ-ALMOSUL)

               5.6.2.7. Equipe Subalmoxarifado Norte (EQ-ALMONOR)

               5.6.2.8. Equipe Subalmoxarifado Extremo-Sul (EQ-ALMOEXT)

6. Diretoria Financeira e de Atendimento (D-FIN)

   6.1. Assessoria Técnica (A-TEC)

   6.2. Gerência Financeira (GFIN)

        6.2.1. Coordenação de Finanças (C-FINANCAS)

               6.2.1.1. Equipe de Gestão de Recursos Financeiros (EQ-FIN)

               6.2.1.2. Equipe de Pagamento (EQ-PAG)

        6.2.2. Coordenação Fiscal (C-FISCAL)

               6.2.2.1. Equipe de Liquidação (EQ-LIQ)

        6.2.3. Coordenação de Planejamento Orçamentário e Centro de Custos (C-PLANORC)

               6.2.3.1. Equipe de Execução Orçamentária (EQ-ORC)

   6.3. Gerência de Arrecadação (GARE)

        6.3.1. Coordenação de Registro Comercial (C-REGCOM)

               6.3.1.1. Equipe Vistoria Cadastral (EQ-VISTCAD)

               6.3.1.2. Equipe Cadastro Comercial (EQ-CADCOM)

        6.3.2. Coordenação de Análise, Cobrança e Recuperação de Créditos (C-RECRED)

               6.3.2.1. Equipe Análise de Lançamentos (EQ-ANALAN)

               6.3.2.2. Equipe Análise e Controle da Dívida (EQ-ANADIV)

               6.3.2.3. Equipe Suspensão e Restabelecimento Comercial (EQ-SRC)

   6.4. Gerência de Gestão do Consumo (GCON)

        6.4.1. Coordenação de Micromedição e Inspeção (C-MICROM)

               6.4.1.1. Equipe Laboratório e Controle de Hidrômetros (EQ-LABHID)

                        6.4.1.1.1. Equipe Almoxarifado (EQ-ALMOX)

               6.4.1.2. Equipe Manutenção Ramal (EQ-MR)

               6.4.1.3. Equipe Substituição/Instalação Ramais (EQ-SIR)

               6.4.1.4. Equipe Inspeção Predial (EQ-INSPREDIAL)

                        6.4.1.4.1. Equipe Auto-infração (EQ-AUTOINFRACAO)

                        6.4.1.4.2. Equipe Fiscalização de Caça Fraudes (EQ-FRAUDES)

                        6.4.1.4.3. Equipe Fiscalização Ramais Desligados (EQ-FISCDESL)

                        6.4.1.4.4. Equipe Fiscalização Ramais Cortados (EQ-FISCORT)

                        6.4.1.4.5. Equipe Vistoria Hidráulica e Abastecimento (EQ-VHABASTEC)

        6.4.2. Coordenação de Leitura (C-LEITURA)

               6.4.2.1. Equipe Medição e Consumo (EQ-MEDICAO)

               6.4.2.2. Equipe Controle de Contas (EQ-CONTCONTAS)

               6.4.2.3. Equipe Controle de Perdas Comerciais (EQ-PERDASCOM)

               6.4.2.4. Equipe Apoio Técnico Sistema Operacional (EQ-ATSOP)

   6.5. Gerência de Atendimento ao Cliente (GCLI)

        6.5.1. Coordenação de Atendimento Técnico e Especializado (C-ATESP)

               6.5.1.1. Equipe de Atendimento Técnico e Especializado (EQ-ATESP)

               6.5.1.2. Equipe Negociações (EQ-NEGOCIA)

               6.5.1.3. Equipe Grandes Consumidores e Repartições Públicas (EQ-GCRP)

        6.5.2. Coordenação de Atendimento (C-ATENDIMENTO)

               6.5.2.1. Equipe Atendimento Presencial 1 (EQ-ATENDPRES 1)

               6.5.2.2. Equipe Atendimento Presencial 2 (EQ-ATENDPRES 2)

               6.5.2.3. Equipe Atendimento Presencial 3 (EQ-ATENDPRES 3)

               6.5.2.4. Equipe Atendimento Presencial 4 (EQ-ATENDPRES 4)

               6.5.2.5. Equipe Atendimento Presencial 5 (EQ-ATENDPRES 5)

               6.5.2.6. Equipe Atendimento Virtual 1 (EQ-ATENDVIR 1)

               6.5.2.7. Equipe Atendimento Virtual 2 (EQ-ATENDVIR 2)

               6.5.2.8. Equipe Atendimento Virtual 3 (EQ-ATENDVIR 3)

7. Diretoria de Água (D-AGUA)

   7.1. Gerência de Planejamento, Projetos e Obras (GEOB)

        7.1.1. Coordenação de Planejamento de Projetos de Água (C-PLANAGUA)

               7.1.1.1. Equipe de Aprovação e Vistoria de Projetos de Água (EQ-VISTPROJAGUA)

        7.1.2. Coordenação de Projetos (C-PROJA)

               7.1.2.1. Equipe de Projetos (EQ-PROJA)

               7.1.2.2. Equipe de Orçamento (EQ-ORCA)

        7.1.3. Coordenação de Obras (C-OBRAGUA)

               7.1.3.1. Equipe de Obras Civis (EQ-OCIVIS)

               7.1.3.2. Equipe de Obras de Adutoras e Redes (EQ-OBRADR)

               7.1.3.3. Equipe de Manutenção Predial de Instalações (EQ-MANPREDIAL)

   7.2. Gerência de Tratamento de Água (GTAG)

        7.2.1. Equipe de Lavagem e Desinfecção de Reservatórios (EQ-LAVRESERV)

        7.2.2. Coordenação de Tratamento Sul (C-ETASUL)

               7.2.2.1. Equipe ETA Menino Deus (EQ-ETAMD)

               7.2.2.2. Equipe ETA Belém Novo (EQ-ETABN)

               7.2.2.3. Equipe ETA Tristeza (EQ-ETAT)

        7.2.3. Coordenação de Tratamento Centro Norte (C-ETACENOR)

               7.2.3.1. Equipe ETA São João (EQ-ETASJ)

               7.2.3.2. Equipe ETA Ilhas (EQ-ETAI)

               7.2.3.3. Equipe ETA Moinhos de Vento (EQ-ETAMV)

               7.2.3.4. Equipe de Bombeamento de Água Bruta Norte (EQ-BNORTE)

        7.2.4. Coordenação de Análises Químicas e Biológicas (C-AQUIMIBIO)

               7.2.4.1. Equipe de Análises Biológicas (EQ-ANABIO)

               7.2.4.2. Equipe de Controle de Qualidade da Água (EQ-QUALIAGUA)

               7.2.4.3. Equipe de Análises Químicas I (EQ-AQUIM I)

               7.2.4.4. Equipe de Análises Químicas II (EQ-AQUIM II)

               7.2.4.5. Equipe de Análises Químicas III (EQ-AQUIM III)

               7.2.4.6. Equipe de Análises Químicas IV (EQ-AQUIM IV)

   7.3. Gerência de Manutenção de Sistema de Água (GMAN)

        7.3.1. Coordenação de Manutenção Industrial (C-MANIND)

               7.3.1.1. Equipes de Mecânica (EQ-MECANICA)

               7.3.1.2. Equipes de Elétrica (EQ-ELETRICA)

               7.3.1.3. Equipe de Solda e Serralheria (EQ-SOLDA)

               7.3.1.4. Equipe de Usinagem (EQ-USINAGEM)

               7.3.1.5. Equipe de Instalações Mecânicas (EQ-INSTMECA)

        7.3.2. Coordenação de Planejamento (C-PLANEJ)

               7.3.2.1. Equipe de Planejamento e Aquisições (EQ-PLANAQ)

   7.4. Gerência de Conservação de Redes de Água (GCRA)

        7.4.1. Coordenação de Água Sul (C-ASUL)

               7.4.1.1. Equipes de Conservação de Água Sul (EQ-ASUL)

        7.4.2. Coordenação de Água Leste (C-ALESTE)

               7.4.2.1. Equipes de Conservação de Água Leste (EQ-ALESTE)

        7.4.3. Coordenação de Água Norte (C-ANORTE)

               7.4.3.1. Equipes de Conservação de Água Norte (EQ-ANORTE)

        7.4.4. Coordenação de Água Centro (C-ACENTRO)

               7.4.4.1. Equipes de Conservação de Água Centro (EQ-ACENTRO)

        7.4.5. Coordenação de Água Extremo Sul (C-AEXTSUL)

               7.4.5.1. Equipes de Conservação de Água Extremo Sul (EQ-AEXTSUL)

   7.5. Gerência de Distribuição de Água (GDAG)

        7.5.1. Coordenação de Manutenção de Adutoras (C-ADUTORAS)

               7.5.1.1. Equipe Apoio Técnico (EQ-APOIOTEC)

               7.5.1.2. Equipes de Manutenção (EQ-MANUT)

        7.5.2. Coordenação de Operação de Redes (C-OPREDES)

               7.5.2.1. Equipe Apoio Técnico (EQ-TECREDE)

               7.5.2.2. Equipes de Operação de Redes (EQ-OPREDES)

        7.5.3. Coordenação de Controle Operacional (CCO)

               7.5.3.1. Equipe de Controle Operacional I (EQ-COP I)

               7.5.3.2. Equipe de Controle Operacional II (EQ-COP II)

               7.5.3.3. Equipe de Controle Operacional III (EQ-COP III)

               7.5.3.4. Equipe de Controle Operacional IV (EQ-COP IV)

               7.5.3.5. Equipe de Caminhão Tanque (EQ-CAMTANQ)

               7.5.3.6. Equipe de Operação de Estações Elevatórias I (EQ-OPLEV I)

               7.5.3.7. Equipe de Operação de Estações Elevatórias II (EQ-OPLEV II)

        7.5.4. Coordenação de Perdas Físicas (C-PERDAS)

               7.5.4.1. Equipe de Análises de Desenvolvimento de Sistemas de Água (EQ-ADSA)

               7.5.4.2. Equipe de Levantamento e Medições (EQ-LEVMED)

8. Diretoria de Esgotamento Sanitário (D-ESG)

   8.1. Equipe de Controle de Resíduos, Efluentes e Qualidade (EQ-EFLUENTES)

   8.2. Gerência de Planejamento, Projetos e Obras (GPPOB)

        8.2.1. Coordenação de Planejamento, Aprovação e Vistoria de Projetos Esgoto (C-PAVPESG)

               8.2.1.1. Equipe de Projetos e Orçamento (EQ-PROJORCESG)

               8.2.1.2. Equipe de Obras e Manutenção Civil (EQ-OCIVILESG)

   8.3. Gerência de Coleta e Afastamento de Esgotos (GCES)

        8.3.1. Equipe de Controle e Operação de Bombeamento (EQ-BOMBEAMENTO)

        8.3.2. Equipe de Manobra de Esgoto (EQ-MANOBRAESG)

        8.3.3. Equipe de Operadores de Elevatórias de Esgoto (EQ-OPELEV)

   8.4. Gerência de Conservação de Redes de Esgoto (GCRE)

        8.4.1. Coordenação de Esgoto Sul (C-ESUL)

               8.4.1.1. Equipes de Conservação de Esgoto Sul (EQ-ESUL)

        8.4.2. Coordenação de Esgoto Leste (C-ELESTE)

               8.4.2.1. Equipes de Conservação de Esgoto Leste (EQ-ELESTE)

        8.4.3. Coordenação de Esgoto Norte (C-ENORTE)

               8.4.3.1. Equipes de Conservação de Esgoto Norte (EQ-ENORTE)

        8.4.4. Coordenação de Esgoto Centro (C-ECENTRO)

               8.4.4.1. Equipes de Conservação de Esgoto Centro (EQ-ECENTRO)

   8.5. Gerência de Tratamento de Esgoto (GTES)

        8.5.1. Coordenação de Análises Sanitárias e Ambientais (C-BIO)

               8.5.1.1. Equipe de Biologia Sanitária e Ambiental I (EQ-BIOAMB I)

               8.5.1.2. Equipe de Biologia Sanitária e Ambiental II (EQ-BIOAMB II)

               8.5.1.3. Equipe de Química Sanitária e Ambiental I (EQ-QUIAMB I)

               8.5.1.4. Equipe de Química Sanitária e Ambiental II (EQ-QUIAMB II)

               8.5.1.5. Equipe de Monitoramento de Águas Urbanas (EQ-MONITORAMENTO)

        8.5.2. Coordenação de Tratamento de Esgoto Sul (C-ETESUL)

               8.5.2.1. Equipe ETE Belém Novo e Lami (EQ-ETEBN/L)

               8.5.2.2. Equipe ETE Serraria - Chácara (EQ-ETESER/C)

        8.5.3. Coordenação de Tratamento de Esgoto Norte (C-ETENORTE)

               8.5.3.1. Equipe ETE Sarandi (EQ-ETESAR)

               8.5.3.2. Equipe ETE Navegantes (EQ-ETENAV)

               8.5.3.3. Equipe ETE Rubem Berta e Arvoredo (EQ-ETERB/ARV)

   8.6. Coordenação de Manutenção (C-MANUTESG)

        8.6.1. Equipe Eletromecânica (EQ-ELETROMESG)

        8.6.2. Equipe Mecânica (EQ-MECESG)

9. Diretoria de Proteção Contra Cheias e Drenagem Urbana (D-PCCDU)

   9.1. Gerência de Planejamento, Projetos e Obras (GPPOD)

        9.1.1. Coordenação de Planejamento (C-PLANED)

               9.1.1.1. Equipe de Planejamento Técnico e Operacional (EQ-PLATECD)

               9.1.1.2. Equipe de Cadastro (EQ-CAD)

               9.1.1.3. Equipe de Acervo Técnico (EQ-ACERVOTECD)

        9.1.2. Coordenação de Projetos e Obras (C-PROJOBRAS)

               9.1.2.1. Equipes Projetos (EQ-PROJD)

               9.1.2.2. Equipe Orçamento (EQ-ORCAD)

               9.1.2.3. Equipes Obras (EQ-OBRASD)

        9.1.3. Coordenação de Novos Empreendimentos (C-NEMP)

               9.1.3.1. Equipe de Aprovação e Vistoria de Novos Empreendimentos (EQ-AVENP)

   9.2. Gerência de Conservação de Infraestrutura Pluvial (GCIP)

        9.2.1. Coordenação de Sistemas de Contenção e Dragagem (C-SCD)

               9.2.1.1. Equipe de Conservação de Infraestrutura de Proteção Contra Cheias (EQ-CIPCC)

               9.2.1.2. Equipes de Dragagem e Conservação de Bacias de Amortecimento Abertas (EQ-DCBAA)

        9.2.2. Coordenação de Conservação e Melhorias de Sistemas Pluviais (C-CMSP)

               9.2.2.1. Equipe de Conservação de Redes e Bacias de Amortecimento Fechadas (EQ-CRBAF)

               9.2.2.2. Equipe de Reconstrução e Melhorias Pluviais (EQ-RMPLUVIAL)

               9.2.2.3. Equipe de Fábrica de Pré-Moldados (EQ-FABRICA)

        9.2.3. Coordenação-Geral de Distrital de Pluvial (CGDP)

               9.2.3.1. Coordenação de Distrital de Pluvial Norte (C-PNORTE)

                        9.2.3.1.1. Equipes de Manutenção de Pluvial Norte (EQ-PNORTE)

               9.2.3.2. Coordenação de Distrital de Pluvial Centro-Leste (C-PCLESTE)

                        9.2.3.2.1. Equipes de Manutenção de Pluvial Centro-Leste (EQ-PCLESTE)

               9.2.3.3. Coordenação de Distrital de Pluvial Sul (C-PSUL)

                        9.2.3.3.1. Equipes de Manutenção de Pluvial Sul (EQ-PSUL)

               9.2.3.4. Coordenação de Distrital de Pluvial Extremo Sul (C-PEXTSUL)

                        9.2.3.4.1. Equipes de Manutenção de Pluvial Extremo Sul (EQ-MANPLUEXT)

   9.3. Coordenação-Geral de Operação e Manutenção Industrial (CGOMIP)

        9.3.1. Coordenação de Operação Pluvial (C-OPLUV)

               9.3.1.1. Equipe de Operação de Unidades Industriais (EQ-OPERIND)

               9.3.1.2. Equipe de Controle Operacional (EQ-COPLUVIAL)

        9.3.2. Coordenação de Manutenção Industrial Pluvial (C-MIP)

               9.3.2.1. Equipe Civil (EQ-CIVILP)

               9.3.2.2. Equipe Elétrica (EQ-ELEP)

               9.3.2.3. Equipe Mecânica (EQ-MECP)

   9.4. Gerência de Suporte Técnico Administrativo (GSTA)

        9.4.1. Coordenação de Planos de Contingenciamento e Operacionais (C-PCOP)

        9.4.2. Coordenação de Apoio Técnico e Administrativo (C-ATAP)

               9.4.2.1. Equipe de Controle de Contratos (EQ-CCP)

               9.4.2.2. Equipe de Recursos Materiais e Equipamentos (EQ-RMEP)

               9.4.2.3. Equipe de Licenciamentos e Gestão de Resíduos Pluviais (EQ-LGRP)

10. Diretoria de Regulação e Governança Corporativa (D-RGC)

    10.1. Assessoria de Assuntos Regulatórios (A-ASREG)

11. Diretoria de Parcerias (D-PAR)

    11.1. Assessoria de Parcerias (A-PAR)
`;

const lines = text.split('\n').filter(l => l.trim().length > 0);
const nodes = [];

function parseLine(line) {
  const match = line.match(/^(\s*)([0-9\.]+)\s+(.*?)\s+\((.*?)\)$/);
  if (match) {
    return {
      num: match[2],
      desc: match[3].trim(),
      sigla: match[4].trim(),
      level: match[2].split('.').filter(x => x).length,
      orig: line
    };
  }
  const match2 = line.match(/^(\s*)([0-9\.]+)\s+(.*)$/);
  if (match2) {
    return {
      num: match2[2],
      desc: match2[3].trim(),
      sigla: match2[3].trim(),
      level: match2[2].split('.').filter(x => x).length,
      orig: line
    };
  }
  return null;
}

nodes.push({
  id: 'node-root',
  parentId: null,
  name: 'DMAE',
  description: 'Departamento Municipal de Água e Esgotos',
  tipo: 'estrutura',
  subtipo: 'subordinada',
  unidade: 'DMAE',
  lotacao: 'Rua 24 de Outubro, 200',
  tags: 'sede, departamento, raiz'
});

const parentsByLevel = {0: 'node-root'};
let lastNode = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith('DMAE -')) continue;

  if (line.trim().startsWith('-')) {
    if (lastNode) {
      lastNode.funcao = line.trim().replace('-', '').trim();
    }
    continue;
  }

  const p = parseLine(line);
  if (p) {
    let lowerDesc = p.desc.toLowerCase();
    const isApoio = lowerDesc.includes('assessoria') || lowerDesc.includes('gabinete') || p.sigla.startsWith('A-') || p.sigla.startsWith('GAB-');
    
    // the parent is the last seen node at level - 1
    const parentId = parentsByLevel[p.level - 1] || 'node-root';
    
    const node = {
      id: 'node-' + Math.random().toString(36).substr(2, 9),
      parentId: parentId,
      name: p.sigla,
      description: p.desc,
      tipo: 'estrutura',
      subtipo: isApoio ? 'apoio' : 'subordinada',
      lotacao: '',
      unidade: 'DMAE',
      tags: ''
    };
    nodes.push(node);
    lastNode = node;
    parentsByLevel[p.level] = node.id;
  }
}

const jsCode = `export const seedNodes = ${JSON.stringify(nodes, null, 2)};
export const seedAssets = [];
export const seedPersons = [];
export const seedContracts = [];
`;

fs.writeFileSync('src/data/seedData2.js', jsCode);
console.log('Written ' + nodes.length + ' nodes to src/data/seedData2.js');
