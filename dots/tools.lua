local mise_tools = dots.command("mise tools", {
	check = 'test -z "$(mise ls --current --missing --no-header)"',
	apply = "mise install --yes",
})

dots.command("pi", {
	check = "command -v pi >/dev/null",
	apply = "mise exec -- npm install -g --ignore-scripts @earendil-works/pi-coding-agent",
	needs = { mise_tools },
})

dots.command("tree-sitter-cli", {
	check = "command -v tree-sitter >/dev/null",
	apply = "mise exec -- cargo install tree-sitter-cli",
	needs = { mise_tools },
})

dots.command("weather", {
	check = "command -v weather >/dev/null",
	apply = "curl -sSL https://raw.githubusercontent.com/phcurado/weather/main/install.sh | sh",
})

dots.command("tpane", {
	check = "command -v tpane >/dev/null",
	apply = "curl -sSL https://raw.githubusercontent.com/phcurado/tpane/main/install.sh | sh",
})
