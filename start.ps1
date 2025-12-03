# CodeCrypt Startup Script
# This script helps you start the CodeCrypt application

Write-Host "🎃 CodeCrypt Startup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker daemon is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and wait for it to fully start" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if .env file exists
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Check if API keys are configured
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "your_github_client_id_here" -or $envContent -match "your_openai_api_key_here") {
        Write-Host "⚠ Warning: API keys not configured in .env file" -ForegroundColor Yellow
        Write-Host "  Please edit .env and add your:" -ForegroundColor Yellow
        Write-Host "  - GitHub OAuth credentials" -ForegroundColor Yellow
        Write-Host "  - OpenAI API key" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "See START_PROJECT.md for detailed instructions" -ForegroundColor Cyan
        Write-Host ""
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 0
        }
    }
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "Please edit .env and add your API keys" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting CodeCrypt services..." -ForegroundColor Cyan
Write-Host ""

# Start services
Write-Host "Starting database and Redis..." -ForegroundColor Yellow
docker-compose up -d db redis

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
$dbStatus = docker-compose ps db --format json | ConvertFrom-Json
$redisStatus = docker-compose ps redis --format json | ConvertFrom-Json

if ($dbStatus.State -eq "running") {
    Write-Host "✓ Database is running" -ForegroundColor Green
} else {
    Write-Host "✗ Database failed to start" -ForegroundColor Red
}

if ($redisStatus.State -eq "running") {
    Write-Host "✓ Redis is running" -ForegroundColor Green
} else {
    Write-Host "✗ Redis failed to start" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Infrastructure services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run database migrations:" -ForegroundColor White
Write-Host "   cd backend && npm run migrate" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the application:" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "3. View logs:" -ForegroundColor White
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access the application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:4000" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed instructions, see START_PROJECT.md" -ForegroundColor Cyan
Write-Host ""
