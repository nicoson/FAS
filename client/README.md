bower.json: dependence 3rd part files
.bowerrc: bower file install directory

.gitignore: ignore files from git


Initiate Project:
1. npm install
2. bower install

Build Project:
	Build Project via gulp:
		Dev: gulp --env dev
		Test: gulp test --env dev	//	run the qunit test and jshint
		Prod: gulp --env prod	//	minify js and css file

	Build Project via npm:
		refer to package.json

Developing Project:
	>npm run watch

How to use:
Pre Build
1. >npm install
2. >bower install

For Developping:
1. >npm run build
2. >npm run dev

For Deploy to Server:
1. >npm run dist
2. >sh deploy.sh

For Testing Locally:
1. start "startserver.cmd" in dev folder