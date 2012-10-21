BUILDDIR="chess"

# default build
default:
	@$(MAKE) standard >/dev/null
	@$(MAKE) build >/dev/null

all:
#	@$(MAKE) clean >/dev/null
	@$(MAKE) standard >/dev/null
	@$(MAKE) build >/dev/null
#	@$(MAKE) package >/dev/null
	
# remove all built files, leaving just source code
clean:
	@rm -rf $(BUILDDIR)/
	@rm -f js/require-jquery.js
	@rm -f js/chess.js

##### INTERNAL MAKE FUNCTIONS #####
# features always employed
standard:
	@command -v npm >/dev/null 2>&1 || ( echo "NPM not found :( NPM is required for install! http://nodejs.org/" >&2 && exit 1 );
	@npm install
	@git submodule init
	@git submodule update

build:
	@(cd modules/jquery && npm install && node_modules/grunt/bin/grunt)
	@cat modules/requirejs/require.js modules/jquery/dist/jquery.min.js >> js/require-jquery.js
	@echo 'define("chess", function() {' > js/chess.js && cat modules/chess.js/chess.js >> js/chess.js && echo 'return Chess;});' >> js/chess.js