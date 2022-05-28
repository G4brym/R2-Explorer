.PHONY: run-chrome
run-chrome:
	open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="$$HOME/dev/chrome_dev_test" --disable-web-security
