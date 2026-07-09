local mise_tools = dots.command("mise tools", {
	check = 'test -z "$(mise ls --current --missing --no-header)"',
	apply = "mise install --yes",
})

dots.command("pi", {
	check = [[
		latest="$(mise exec node@25 -- npm view @earendil-works/pi-coding-agent version 2>/dev/null)"
		installed="$(mise exec node@25 -- pi --version 2>/dev/null)"
		[ -n "$latest" ] && [ "$installed" = "$latest" ]
	]],
	apply = "mise exec node@25 -- npm install -g --ignore-scripts @earendil-works/pi-coding-agent@latest",
	needs = { mise_tools },
})

dots.command("tree-sitter-cli", {
	check = [[
		latest="$(mise exec -- cargo search tree-sitter-cli --limit 1 2>/dev/null | sed -n 's/^tree-sitter-cli = "\([^"]*\)".*/\1/p')"
		installed="$(mise exec -- tree-sitter --version 2>/dev/null | awk '{print $2}')"
		[ -n "$latest" ] && [ "$installed" = "$latest" ]
	]],
	apply = "mise exec -- cargo install --force tree-sitter-cli",
	needs = { mise_tools },
})

dots.command("weather", {
	check = [[
		bin="$HOME/.local/bin/weather"
		[ -x "$bin" ] && "$bin" --version >/dev/null 2>&1
	]],
	apply = "curl -sSL https://raw.githubusercontent.com/phcurado/weather/main/install.sh | sh",
})

dots.command("tpane", {
	check = [[
		bin="$HOME/.local/bin/tpane"
		[ -x "$bin" ] && "$bin" --version >/dev/null 2>&1
	]],
	apply = "curl -sSL https://raw.githubusercontent.com/phcurado/tpane/main/install.sh | sh",
})
