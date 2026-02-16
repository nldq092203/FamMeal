# ============================================================
# FamMeal — Makefile
# ============================================================
# Usage: make <target>
#   make dev        — start dev environment (hot reload)
#   make prod       — start production-like environment
#   make down       — stop everything
#   make logs       — tail backend + frontend logs
#   make logs-all   — tail all service logs
# ============================================================

.PHONY: help dev prod build up down logs logs-all ps \
        shell-backend shell-frontend shell-postgres \
        migrate clean prune restart

COMPOSE        = docker compose
COMPOSE_PROD   = docker compose -f docker-compose.yml

# Default target
help: ## Show this help
	@echo ""
	@echo "  FamMeal Docker Commands"
	@echo "  ─────────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ---- Dev Workflow -------------------------------------------
dev: ## Start development environment (hot reload)
	$(COMPOSE) up --build -d
	@echo "\nDev environment started"
	@echo "   Backend:  http://localhost:3000"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Health:   http://localhost:3000/health"
	@echo "\n   Run 'make logs' to tail logs"

# ---- Production-like Workflow --------------------------------
prod: ## Start production-like environment
	$(COMPOSE_PROD) up --build -d
	@echo "\nProduction environment started"
	@echo "   Backend:  http://localhost:3000"
	@echo "   Frontend: http://localhost:8080"
	@echo "   Health:   http://localhost:3000/health"

# ---- Common Commands ----------------------------------------
build: ## Build all images
	$(COMPOSE) build

build-prod: ## Build production images only
	$(COMPOSE_PROD) build

up: ## Start all containers (detached)
	$(COMPOSE) up -d

down: ## Stop and remove containers
	$(COMPOSE) down

down-volumes: ## Stop containers and remove volumes (destroys data)
	$(COMPOSE) down -v

logs: ## Tail backend + frontend logs
	$(COMPOSE) logs -f backend frontend

logs-all: ## Tail logs for all services
	$(COMPOSE) logs -f

logs-backend: ## Tail backend logs only
	$(COMPOSE) logs -f backend

logs-frontend: ## Tail frontend logs only
	$(COMPOSE) logs -f frontend

ps: ## Show running containers and status
	$(COMPOSE) ps

restart: ## Restart all services
	$(COMPOSE) restart

restart-backend: ## Restart backend only
	$(COMPOSE) restart backend

# ---- Shell Access -------------------------------------------
shell-backend: ## Open shell in backend container
	$(COMPOSE) exec backend sh

shell-frontend: ## Open shell in frontend container
	$(COMPOSE) exec frontend sh

shell-postgres: ## Open psql in postgres container
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-fammeal} -d $${POSTGRES_DB:-fammeal}

# ---- Database -----------------------------------------------
migrate: ## Run database migrations
	$(COMPOSE) exec backend node dist/scripts/migrate.js

# ---- Cleanup ------------------------------------------------
clean: ## Stop containers, remove images, volumes, and orphans
	$(COMPOSE) down -v --rmi local --remove-orphans

prune: ## Docker system prune (removes all unused Docker data)
	docker system prune -af --volumes
