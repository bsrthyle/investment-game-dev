# Investment Game — developer shortcuts.
#
# Override defaults on the command line if needed, e.g.:
#   make wiki-push WIKI_DIR=../my-custom-wiki-clone

WIKI_DIR ?= ../investment-game.wiki
APP_DIR  := investment-game

.DEFAULT_GOAL := help

.PHONY: help dev test build deploy wiki wiki-push server-dev server-deploy server-migrate server-tail

help:
	@echo ""
	@echo "  make dev          Start PWA dev server (http://localhost:5173)"
	@echo "  make test         Run Vitest suite (25 tests)"
	@echo "  make build        Production PWA build → investment-game/dist"
	@echo "  make deploy       Build + deploy to Cloudflare Pages production"
	@echo ""
	@echo "  make wiki         Regenerate GitHub Wiki from docs/ into \$$(WIKI_DIR)"
	@echo "                    (default: ../investment-game.wiki)"
	@echo "  make wiki-push    Regenerate + commit + push to GitHub Wiki"
	@echo ""
	@echo "  make server-dev     Start sync backend locally (wrangler dev)"
	@echo "  make server-deploy  Deploy sync backend to Cloudflare Workers"
	@echo "  make server-migrate Apply schema migrations to Neon (needs .env)"
	@echo "  make server-tail    Stream live logs from deployed Worker"
	@echo ""

dev:
	cd $(APP_DIR) && npm run dev

test:
	cd $(APP_DIR) && npm test

build:
	cd $(APP_DIR) && npm run build

deploy: build
	cd $(APP_DIR) && npx wrangler pages deploy dist \
	  --project-name=fertilizer-game \
	  --branch=production

wiki:
	@./scripts/build-wiki.sh "$(WIKI_DIR)"

wiki-push: wiki
	@cd "$(WIKI_DIR)" && \
	  git add . && \
	  if git diff --cached --quiet; then \
	    echo "↪ wiki already up to date, nothing to push"; \
	  else \
	    git commit -m "Sync wiki from docs/" && \
	    git push && \
	    echo "✓ wiki pushed"; \
	  fi

server-dev:
	cd investment-game-server && npx wrangler dev

server-deploy:
	cd investment-game-server && npx wrangler deploy

server-migrate:
	cd investment-game-server && npm run migrate

server-tail:
	cd investment-game-server && npx wrangler tail
