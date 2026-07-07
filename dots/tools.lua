local mise_tools = dots.command("mise tools", {
	check = 'test -z "$(mise ls --current --missing --no-header)"',
	apply = "mise install --yes",
})

dots.command("pi", {
	check = "mise exec node@25 -- command -v pi >/dev/null",
	apply = "mise exec node@25 -- npm install -g --ignore-scripts @earendil-works/pi-coding-agent",
	needs = { mise_tools },
})

dots.command("tree-sitter-cli", {
	check = "command -v tree-sitter >/dev/null",
	apply = "mise exec -- cargo install tree-sitter-cli",
	needs = { mise_tools },
})

dots.command("weather", {
	check = [[
		latest="$(curl -fsSL https://api.github.com/repos/phcurado/weather/releases/latest | sed -n 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/p' | head -n1)"
		bin="$HOME/.local/bin/weather"
		[ -x "$bin" ] && [ -n "$latest" ] && "$bin" --version | grep -q "$latest"
	]],
	apply = "curl -sSL https://raw.githubusercontent.com/phcurado/weather/main/install.sh | sh",
})

dots.command("tpane", {
	check = [[
		latest="$(curl -fsSL https://api.github.com/repos/phcurado/tpane/releases/latest | sed -n 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/p' | head -n1)"
		bin="$HOME/.local/bin/tpane"
		[ -x "$bin" ] && [ -n "$latest" ] && "$bin" --version | grep -q "$latest"
	]],
	apply = "curl -sSL https://raw.githubusercontent.com/phcurado/tpane/main/install.sh | sh",
})
