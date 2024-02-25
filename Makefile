build-dashboard:
	rm -rf packages/dashboard/dist/
	rm -rf packages/dashboard-v2/dist/
	rm -rf dist/

	cd packages/dashboard/ && \
	npm install && \
	npm run build

	cd packages/dashboard-v2/ && \
	npm install && \
	npm run build

	cp -r packages/dashboard-v2/dist/spa/ dist/
	cp -r packages/dashboard/dist/ dist/v1.0/

build-worker:
	rm -rf worker/dist/

	cd worker/ && \
	npm install && \
	npm run build

