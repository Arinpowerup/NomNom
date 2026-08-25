param(
  [string]$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
)

$resolvedRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$requiredFiles = @(
  "package.json",
  "src/App.tsx",
  "public/nav/snoopy-home.png",
  "public/nav/snoopy-menu.png",
  "public/nav/snoopy-foodlog.png",
  "public/nav/snoopy-fridge.png",
  "public/nav/snoopy-me.png",
  "public/illustrations/snoopy-cooking-pot.png",
  "public/illustrations/snoopy-empty-plate.png",
  "reference-assets/snoopy-menu-nav-icon-original.png"
)

$missing = foreach ($relativePath in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $resolvedRoot $relativePath) -PathType Leaf)) {
    $relativePath
  }
}
if ($missing) {
  throw "Consolidation is missing: $($missing -join ', ')"
}

$insideWorkTree = git -C $resolvedRoot rev-parse --is-inside-work-tree
if ($LASTEXITCODE -ne 0 -or $insideWorkTree -ne "true") {
  throw "Consolidated project is not a valid Git working tree: $resolvedRoot"
}

Write-Output "Consolidation verified: $resolvedRoot"
Write-Output "Required files verified: $($requiredFiles.Count)"