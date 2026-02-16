#!/usr/bin/env bash
# ============================================================
# FamMeal — Consolidated Docker Operations Script
# ============================================================
# Usage: ./scripts/docker-run.sh <command> [options]
#
# Commands:
#   dev          Start development environment (hot reload)
#   prod         Start production-like environment
#   build        Build all Docker images
#   up           Start containers (detached)
#   down         Stop and remove containers
#   logs         Tail logs (all services or specify service)
#   shell        Open shell in a container
#   migrate      Run database migrations
#   status       Show container status and health
#   health       Check health of all services
#   restart      Restart all or specific service
#   clean        Stop + remove containers, volumes, images
#   prune        Full Docker system prune (⚠️  destructive)
#   help         Show this help message
# ============================================================

set -euo pipefail

# ---- Configuration ------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE="docker compose"
COMPOSE_PROD="docker compose -f docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ---- Helper Functions ---------------------------------------
info()    { echo -e "${CYAN}ℹ️  $*${NC}"; }
success() { echo -e "${GREEN}✅ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $*${NC}"; }
error()   { echo -e "${RED}❌ $*${NC}" >&2; }

check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi
}

check_env() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        warn ".env file not found. Copying from .env.example..."
        if [ -f "$PROJECT_DIR/.env.example" ]; then
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            warn "Created .env from .env.example. Please review and update secrets!"
        else
            error "No .env or .env.example found!"
            exit 1
        fi
    fi
}

# ---- Commands -----------------------------------------------

cmd_dev() {
    info "Starting development environment..."
    cd "$PROJECT_DIR"
    $COMPOSE up --build -d
    echo ""
    success "Dev environment is starting!"
    echo ""
    echo "  Backend API:   http://localhost:3000"
    echo "  Frontend:      http://localhost:5173"
    echo "  Health Check:  http://localhost:3000/health"
    echo "  PostgreSQL:    localhost:5432"
    echo "  Redis:         localhost:6379"
    echo ""
    info "Run '$0 logs' to tail logs"
    info "Run '$0 status' to check health"
}

cmd_prod() {
    info "Starting production-like environment..."
    cd "$PROJECT_DIR"
    $COMPOSE_PROD up --build -d
    echo ""
    success "Production environment is starting!"
    echo ""
    echo "  Backend API:   http://localhost:3000"
    echo "  Frontend:      http://localhost:8080"
    echo "  Health Check:  http://localhost:3000/health"
    echo ""
    info "Run '$0 logs' to tail logs"
    info "Run '$0 status' to check health"
}

cmd_build() {
    info "Building all Docker images..."
    cd "$PROJECT_DIR"
    $COMPOSE build "$@"
    success "Build complete!"
}

cmd_up() {
    info "Starting containers..."
    cd "$PROJECT_DIR"
    $COMPOSE up -d "$@"
    success "Containers started!"
}

cmd_down() {
    info "Stopping containers..."
    cd "$PROJECT_DIR"
    if [[ "${1:-}" == "--volumes" ]] || [[ "${1:-}" == "-v" ]]; then
        warn "Removing volumes (data will be lost)..."
        $COMPOSE down -v
    else
        $COMPOSE down
    fi
    success "Containers stopped!"
}

cmd_logs() {
    cd "$PROJECT_DIR"
    if [[ -n "${1:-}" ]]; then
        $COMPOSE logs -f "$1"
    else
        $COMPOSE logs -f
    fi
}

cmd_shell() {
    local service="${1:-backend}"
    info "Opening shell in '$service'..."
    cd "$PROJECT_DIR"

    case "$service" in
        postgres|pg|db)
            $COMPOSE exec postgres psql -U "${POSTGRES_USER:-fammeal}" -d "${POSTGRES_DB:-fammeal}"
            ;;
        *)
            $COMPOSE exec "$service" sh
            ;;
    esac
}

cmd_migrate() {
    info "Running database migrations..."
    cd "$PROJECT_DIR"
    $COMPOSE exec backend node dist/scripts/migrate.js
    success "Migrations complete!"
}

cmd_status() {
    cd "$PROJECT_DIR"
    echo ""
    echo "  ┌─────────────────────────────────────┐"
    echo "  │       FamMeal Container Status       │"
    echo "  └─────────────────────────────────────┘"
    echo ""
    $COMPOSE ps
    echo ""
}

cmd_health() {
    echo ""
    echo "  Checking service health..."
    echo "  ─────────────────────────────"

    # Backend
    if curl -fs http://localhost:3000/health > /dev/null 2>&1; then
        success "Backend API:  HEALTHY"
    else
        error "Backend API:  UNREACHABLE"
    fi

    # Frontend (dev port)
    if curl -fs http://localhost:5173/ > /dev/null 2>&1; then
        success "Frontend (dev):  HEALTHY"
    elif curl -fs http://localhost:8080/ > /dev/null 2>&1; then
        success "Frontend (prod): HEALTHY"
    else
        error "Frontend:     UNREACHABLE"
    fi

    # PostgreSQL
    if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-fammeal}" > /dev/null 2>&1; then
        success "PostgreSQL:   HEALTHY"
    else
        error "PostgreSQL:   UNREACHABLE"
    fi

    # Redis
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "Redis:        HEALTHY"
    else
        error "Redis:        UNREACHABLE"
    fi

    echo ""
}

cmd_restart() {
    cd "$PROJECT_DIR"
    if [[ -n "${1:-}" ]]; then
        info "Restarting '$1'..."
        $COMPOSE restart "$1"
    else
        info "Restarting all services..."
        $COMPOSE restart
    fi
    success "Restart complete!"
}

cmd_clean() {
    warn "This will stop containers, remove volumes, images, and orphans."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_DIR"
        $COMPOSE down -v --rmi local --remove-orphans
        success "Cleaned up!"
    else
        info "Cancelled."
    fi
}

cmd_prune() {
    warn "This will remove ALL unused Docker data (containers, images, volumes, networks)."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -af --volumes
        success "Docker system pruned!"
    else
        info "Cancelled."
    fi
}

cmd_help() {
    echo ""
    echo "  ┌─────────────────────────────────────────────┐"
    echo "  │   FamMeal Docker Operations                 │"
    echo "  └─────────────────────────────────────────────┘"
    echo ""
    echo "  Usage: $0 <command> [options]"
    echo ""
    echo "  ${CYAN}Workflows:${NC}"
    echo "    dev              Start dev environment (hot reload)"
    echo "    prod             Start production-like environment"
    echo ""
    echo "  ${CYAN}Container Management:${NC}"
    echo "    build [args]     Build Docker images"
    echo "    up [service]     Start containers (detached)"
    echo "    down [-v]        Stop containers (-v removes volumes)"
    echo "    restart [svc]    Restart all or specific service"
    echo "    status           Show container status"
    echo "    health           Check health of all services"
    echo ""
    echo "  ${CYAN}Development:${NC}"
    echo "    logs [service]   Tail logs (all or specific service)"
    echo "    shell [service]  Open shell (default: backend)"
    echo "    migrate          Run database migrations"
    echo ""
    echo "  ${CYAN}Cleanup:${NC}"
    echo "    clean            Remove containers, volumes, images"
    echo "    prune            Full Docker system prune (⚠️  destructive)"
    echo ""
    echo "  ${CYAN}Examples:${NC}"
    echo "    $0 dev                    # Start dev environment"
    echo "    $0 logs backend           # Tail backend logs"
    echo "    $0 shell postgres         # Open psql"
    echo "    $0 down -v                # Stop + remove data"
    echo ""
}

# ---- Main ---------------------------------------------------
main() {
    check_docker

    local command="${1:-help}"
    shift || true

    case "$command" in
        dev)         check_env; cmd_dev "$@" ;;
        prod)        check_env; cmd_prod "$@" ;;
        build)       cmd_build "$@" ;;
        up)          check_env; cmd_up "$@" ;;
        down)        cmd_down "$@" ;;
        logs)        cmd_logs "$@" ;;
        shell|exec)  cmd_shell "$@" ;;
        migrate)     cmd_migrate "$@" ;;
        status|ps)   cmd_status "$@" ;;
        health)      cmd_health "$@" ;;
        restart)     cmd_restart "$@" ;;
        clean)       cmd_clean "$@" ;;
        prune)       cmd_prune "$@" ;;
        help|--help|-h) cmd_help ;;
        *)
            error "Unknown command: $command"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
