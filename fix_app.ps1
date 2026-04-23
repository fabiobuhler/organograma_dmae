[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$file = "c:\Users\Fabio\.antigravity\dmae-organograma\src\App.jsx"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$utf8Bom = New-Object System.Text.UTF8Encoding($true)

# Read as UTF-8 with BOM
$content = [System.IO.File]::ReadAllText($file, $utf8Bom)
$count = 0

# Function to do safe replacement
function Replace-Safe {
    param($text, $from, $to)
    if ($text.Contains($from)) {
        $script:count++
        return $text.Replace($from, $to)
    }
    return $text
}

# ─── Fix comment separators ───
# These are "─â€"─" style corrupted box-drawing chars
# The chars ─ are U+2500, displayed as multi-byte mojibake
$content = Replace-Safe $content "─â‚¬─â‚¬─â‚¬─â‚¬" "────"
$content = Replace-Safe $content "─â‚¬─â‚¬─â‚¬" "───"
$content = Replace-Safe $content "─€─€─€─€" "────"
$content = Replace-Safe $content "─€─€─€" "───"

# ─── Fix bullet separator in card display ───
# "ββ‚¬Β¢" should be "•" (U+2022)
$content = Replace-Safe $content "ββ‚¬Â¢" "•"
$content = Replace-Safe $content "ββ€Β'" "•"

# ─── Fix em-dash in PDF export ───
$content = Replace-Safe $content "ββ‚¬β€ " "—"
$content = Replace-Safe $content 'Ativos ββ€"' 'Ativos —'

# ─── Fix "Arvore" - the char U+00C3 + U+0081 sequence ───
# U+C381 is mojibake for Á - fix the word Arvore -> Árvore
$badA = [char]0x00C3  # Ã
$badA2 = [char]0x0081 # control char (should be Á)
$badArvore = "" + $badA + $badA2 + "rvore"
$content = Replace-Safe $content $badArvore "Árvore"

# ─── Fix cloud sync log emoji ───
$content = Replace-Safe $content "⚠¡ Cloud Sync" "✅ Cloud Sync"

# ─── Fix SINCRONIZAÇÃO in confirm/alert strings ───
# U+00C3 + U+00C6(0x86) + U+2019(') = corrupted ÇÃ
$badSinc1 = [char]0x00C3  # Ã
$badSinc2 = [char]0x00C6  # Æ  
$badSinc3 = [char]0x2019  # '
$badSinc = "" + $badSinc1 + $badSinc2 + $badSinc3 + "O"
$content = Replace-Safe $content ("SINCRONIZA" + $badSinc) "SINCRONIZAÇÃO"

# Also try text version
$content = Replace-Safe $content "SINCRONIZAÔ¡ÃÆ'O" "SINCRONIZAÇÃO"
$content = Replace-Safe $content "SINCRONIZAÃ‡Ã„O" "SINCRONIZAÇÃO"

# ─── Fix rocket emoji in console.log ───
$badRocket1 = [char]0x00C3
$badRocket2 = [char]0x00B0
$badRocketStr = "" + $badRocket1 + $badRocket2
$content = Replace-Safe $content ($badRocketStr + "Å¸Å¡â‚¬ Iniciando") "🚀 Iniciando"
$content = Replace-Safe $content "Ã°Å¸Å¡â‚¬ Iniciando" "🚀 Iniciando"

# ─── Fix checkmark emoji ───
$content = Replace-Safe $content "âÅ`"¦ SINCRONIZA" "✅ SINCRONIZA"
$content = Replace-Safe $content "CONCLUÃ\u008dDA" "CONCLUÍDA"
$content = Replace-Safe $content "CONCLU" + [char]0x00C3 + [char]0x008D + "DA" "CONCLUÍDA"

# ─── Fix X emoji in alert ───
$content = Replace-Safe $content "âÂÅ' Falha" "❌ Falha"

# ─── Fix CRÍTICO ───
$content = Replace-Safe $content "CR" + [char]0x00C3 + [char]0x008D + "TICO" "CRÍTICO"

# ─── Fix CONVECTANDO -> CONECTANDO ───
$content = Replace-Safe $content "CONVECTANDO" "CONECTANDO"

# Save as UTF-8 without BOM
[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Host "Done. $count replacements made."
