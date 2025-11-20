# Repository Restructuring Script for Vercel Deployment
# Run this script from: c:\Users\91982\Desktop\Phase 1.2

Write-Host "=== Repository Restructuring for Vercel Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop the dev server if running
Write-Host "Step 1: Stopping dev server..." -ForegroundColor Yellow
Write-Host "Please manually stop the 'npm run dev' process (Ctrl+C in the terminal)"
Write-Host "Press Enter when ready to continue..."
Read-Host

# Step 2: Move files from nested folder to root
Write-Host ""
Write-Host "Step 2: Moving project files to root..." -ForegroundColor Yellow

$sourceDir = ".\project-collabo-main\project-collabo-main"
$targetDir = "."

# Get all items from source directory
$items = Get-ChildItem -Path $sourceDir -Force

foreach ($item in $items) {
    $targetPath = Join-Path $targetDir $item.Name
    
    # Skip if item already exists in target (don't overwrite)
    if (Test-Path $targetPath) {
        Write-Host "  Skipping $($item.Name) (already exists in root)" -ForegroundColor Gray
    } else {
        Write-Host "  Moving $($item.Name)..." -ForegroundColor Green
        Move-Item -Path $item.FullName -Destination $targetDir -Force
    }
}

# Step 3: Remove empty nested folders
Write-Host ""
Write-Host "Step 3: Removing empty nested folders..." -ForegroundColor Yellow

if (Test-Path ".\project-collabo-main") {
    Remove-Item ".\project-collabo-main" -Recurse -Force
    Write-Host "  Removed project-collabo-main folder" -ForegroundColor Green
}

# Step 4: Remove .zip file
Write-Host ""
Write-Host "Step 4: Removing .zip file..." -ForegroundColor Yellow

if (Test-Path ".\project-collabo-main.zip") {
    Remove-Item ".\project-collabo-main.zip" -Force
    Write-Host "  Removed project-collabo-main.zip" -ForegroundColor Green
}

# Step 5: Remove root node_modules (will be reinstalled)
Write-Host ""
Write-Host "Step 5: Removing root node_modules..." -ForegroundColor Yellow

if (Test-Path ".\node_modules") {
    Write-Host "  This may take a moment..."
    Remove-Item ".\node_modules" -Recurse -Force
    Write-Host "  Removed node_modules folder" -ForegroundColor Green
}

# Step 6: Reinstall dependencies
Write-Host ""
Write-Host "Step 6: Reinstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "=== Restructuring Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the changes"
Write-Host "2. Test the app: npm run dev"
Write-Host "3. Build for production: npm run build"
Write-Host "4. Commit changes to git"
Write-Host "5. Deploy to Vercel"
Write-Host ""
