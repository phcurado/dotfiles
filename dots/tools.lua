local mise = dots.command("mise", {
	check = '"$HOME/.local/bin/mise" --version',
	apply = "curl -fsSL https://mise.run | sh",
})

local mise_tools = dots.command("mise tools", {
	check = 'test -z "$(mise ls --current --missing --no-header)"',
	apply = "mise install --yes",
	needs = { mise },
})

dots.command("pi", {
	check = "mise which pi",
	apply = "mise exec node@25 -- npm install -g --ignore-scripts @earendil-works/pi-coding-agent@latest",
	needs = { mise_tools },
})

dots.command("tree-sitter-cli", {
	check = "mise exec -- tree-sitter --version",
	apply = "mise exec -- cargo install --force tree-sitter-cli",
	needs = { mise_tools },
})

dots.command("jj-starship", {
	check = "jj-starship --version",
	apply = "mise exec -- cargo install jj-starship@0.7.1 --locked",
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
