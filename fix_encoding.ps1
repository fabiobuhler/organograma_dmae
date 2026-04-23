# =============================================================
# DMAE Organograma - Correcao de Encoding (UTF-8 Mojibake)
# =============================================================

Write-Host "DMAE Encoding Fix - Iniciando..." -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Lista de arquivos a processar
$sourceFiles = @(
    "src\App.jsx",
    "src\main.jsx",
    "src\index.css",
    "src\components\OrgNode.jsx",
    "src\utils\helpers.js",
    "src\lib\supabase.js",
    "src\data\seedData.js",
    "src\data\seedData2.js"
)

# Mapa de substituicoes: mojibake -> correto UTF-8
# Ordenado do mais especifico ao mais generico para evitar substituicoes parciais
$replacements = [ordered]@{
    # Sequencias de dois caracteres compostos (mais especificas primeiro)
    "Ã§Ã£o" = "ção"
    "Ã§Ãµes" = "ções"
    "Ã¡gua" = "água"
    "Ã‰gua" = "Água"
    "ÃÂ¡gua" = "água"
    "Ã¢nimo" = "ânimo"

    # Palavras completas quebradas (alto impacto)
    "SeguranÃ§a" = "Segurança"
    "seguranÃ§a" = "segurança"
    "PrÃ³prio" = "Próprio"
    "prÃ³prio" = "próprio"
    "veÃculo" = "veículo"
    "VeÃculo" = "Veículo"
    "matrÃcula" = "matrícula"
    "MatrÃcula" = "Matrícula"
    "VisualizaÃ§Ã£o" = "Visualização"
    "visualizaÃ§Ã£o" = "visualização"
    "informaÃ§Ãµes" = "informações"
    "InformaÃ§Ãµes" = "Informações"
    "contrataÃ§Ã£o" = "contratação"
    "ContrataÃ§Ã£o" = "Contratação"
    "configuraÃ§Ã£o" = "configuração"
    "ConfiguraÃ§Ã£o" = "Configuração"
    "SincronizaÃ§Ã£o" = "Sincronização"
    "sincronizaÃ§Ã£o" = "sincronização"
    "SINCRONIZAÃ\u0087Ã\u0083O" = "SINCRONIZAÇÃO"
    "AÃ§Ãµes" = "Ações"
    "aÃ§Ã£o" = "ação"
    "AÃ§Ã£o" = "Ação"
    "usuÃ¡rio" = "usuário"
    "UsuÃ¡rio" = "Usuário"
    "UsuÃ¡rios" = "Usuários"
    "usuÃ¡rios" = "usuários"
    "serviÃ§o" = "serviço"
    "ServiÃ§o" = "Serviço"
    "serviÃ§os" = "serviços"
    "TÃ©rmino" = "Término"
    "tÃ©rmino" = "término"
    "nÃ£o" = "não"
    "NÃ£o" = "Não"
    "jÃ¡" = "já"
    "JÃ¡" = "Já"
    "estÃ¡" = "está"
    "EstÃ¡" = "Está"
    "serÃ¡" = "será"
    "SerÃ¡" = "Será"
    "mÃ³dulo" = "módulo"
    "indisponÃvel" = "indisponível"
    "indisponÃ­vel" = "indisponível"
    "forÃ§ar" = "forçar"
    "transferÃªncia" = "transferência"
    "TransferÃªncia" = "Transferência"
    "histÃ³rico" = "histórico"
    "HistÃ³rico" = "Histórico"
    "perÃodo" = "período"
    "PerÃodo" = "Período"
    "pÃ¡gina" = "página"
    "PÃ¡gina" = "Página"
    "excluÃda" = "excluída"
    "ExcluÃda" = "Excluída"
    "excluÃdo" = "excluído"
    "ExcluÃdo" = "Excluído"
    "substituiÃ§Ã£o" = "substituição"
    "SubstituiÃ§Ã£o" = "Substituição"
    "modifica\\u00e7\\u00f5es" = "modificações"
    "modificaÃ§Ãµes" = "modificações"
    "ModificaÃ§Ãµes" = "Modificações"
    "Matr\\u00edcula" = "Matrícula"
    "alteraÃ§Ã£o" = "alteração"
    "AlteraÃ§Ã£o" = "Alteração"
    "auditoria" = "auditoria"
    "vÃnculo" = "vínculo"
    "VÃnculo" = "Vínculo"
    "vÃ­nculo" = "vínculo"
    "VÃ­nculo" = "Vínculo"
    "CONVECTANDO" = "CONECTANDO"
    "Ãrvore" = "Árvore"
    "Ã¡rvore" = "árvore"
    "vigÃªncia" = "vigência"
    "VigÃªncia" = "Vigência"
    "ATEN\\u00c7\\u00c3O" = "ATENÇÃO"
    "ATENÇÃ\u0083O" = "ATENÇÃO"
    "atenÃ§Ã£o" = "atenção"
    "AtenÃ§Ã£o" = "Atenção"
    "seleÃ§Ã£o" = "seleção"
    "SeleÃ§Ã£o" = "Seleção"
    "permissÃµes" = "permissões"
    "PermissÃµes" = "Permissões"
    "NÂº" = "Nº"
    "nÂº" = "nº"
    "OBRIGAÃ\u0087Ã\u0083RIO" = "OBRIGATÓRIO"
    "obrigaÃ³rio" = "obrigatório"
    "ObrigaÃ³rio" = "Obrigatório"
    "OBRIGATÃ\u0083RIO" = "OBRIGATÓRIO"

    # Caracteres especiais simples
    "Ã¡" = "á"
    "Ã " = "à"
    "Ã¢" = "â"
    "Ã£" = "ã"
    "Ã©" = "é"
    "Ãª" = "ê"
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ã´" = "ô"
    "Ãµ" = "õ"
    "Ãº" = "ú"
    "Ã§" = "ç"
    "Ã‡" = "Ç"
    "Ã\u0081" = "Á"
    "Ã€" = "À"
    "Ã‚" = "Â"
    "Ãƒ" = "Ã"
    "Ã‰" = "É"
    "ÃŠ" = "Ê"
    "Ã\u008d" = "Í"
    "Ã"" = "Ó"
    "Ã"" = "Ô"
    "Ã•" = "Õ"
    "Ãš" = "Ú"
    "Âº" = "º"
    "Âª" = "ª"
    "Â°" = "°"

    # Tipografia especial
    "ââ\u20ac\u201c" = "—"
    "ââ\u20ac\u201d" = "–"
    "ââ\u20ac\u00a2" = "•"
    "ââ\u20ac\u0153" = "\u201c"
    "ââ\u20ac\u009d" = "\u201d"
    "ââ\u20ac\u02dc" = "\u2018"
    "ââ\u20ac\u2122" = "\u2019"
    "ââ\u20ac\u00a6" = "…"

    # Emojis quebrados (unicode escapado correto)
    "â\u00c5\u00a1" = "⚠"
    "Ã°\u00c5\u00b8\u00c5\u00a1\u20ac" = "✅"
    "Ã°\u00c5\u00b8\u00c5\u00b8â\u20ac\u00b9" = "❌"
    "â\u00e2\u20ac\u00b9" = "✅"
    "âÅ\u0022" = "✅"

    # Remover Â solto no final
    "Ã°Å¸Å¡\u20ac" = "✅"
    "Ã°Å¸Å¸â\u20acâ\u20ac¹" = "❌"
}

function Fix-FileEncoding {
    param([string]$filePath)

    $fullPath = Join-Path $projectRoot $filePath

    if (-not (Test-Path $fullPath)) {
        Write-Host "  IGNORADO (nao encontrado): $filePath" -ForegroundColor Yellow
        return
    }

    try {
        # Ler como UTF-8 (sem BOM)
        $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
        $original = $content

        # Aplicar todas as substituicoes
        foreach ($pair in $replacements.GetEnumerator()) {
            if ($content.Contains($pair.Key)) {
                $content = $content.Replace($pair.Key, $pair.Value)
            }
        }

        if ($content -ne $original) {
            # Gravar em UTF-8 sem BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
            Write-Host "  CORRIGIDO: $filePath" -ForegroundColor Green
        } else {
            Write-Host "  OK (sem alteracoes): $filePath" -ForegroundColor DarkGray
        }
    }
    catch {
        Write-Host "  ERRO em $filePath`: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Processando arquivos fonte..." -ForegroundColor Yellow

foreach ($file in $sourceFiles) {
    Fix-FileEncoding -filePath $file
}

Write-Host ""
Write-Host "Verificacao final - buscando residuos..." -ForegroundColor Yellow

# Verificar residuos nos arquivos .jsx e .js
$checkFiles = Get-ChildItem -Path (Join-Path $projectRoot "src") -Include "*.jsx","*.js","*.css" -Recurse

$foundIssues = $false
foreach ($f in $checkFiles) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    # Procurar padroes suspeitos de mojibake (nao em comentarios ou strings de regex)
    if ($content -match 'Ã[¡â£©ªµ¶·¸¹º»¼½¾¿À-Ö×Ø-öø-ÿ]' -or $content -match 'â€') {
        Write-Host "  POSSIVEL RESIDUO em: $($f.Name)" -ForegroundColor Yellow
        $foundIssues = $true
    }
}

if (-not $foundIssues) {
    Write-Host "  Nenhum residuo encontrado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Concluido!" -ForegroundColor Cyan
Write-Host "Execute: npm run dev" -ForegroundColor White
