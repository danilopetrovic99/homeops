.PHONY: up down logs build test lint

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f backend

build:
	docker compose build

test:
	npm test --prefix backend

lint:
	npm run lint --prefix backend
