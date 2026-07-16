local common_packages = require("dots.packages")

local packages = {
	"docker",
	"docker-compose",
	"git",
	"gh",
	"jj",
	"neovim",
	"sketchybar",
	"borders",
	"lua",
	"blueutil",
}

local casks = {
	"nikitabobko/tap/aerospace",
	"ghostty",
	"brave-browser",
	"discord",
	"obsidian",
	"docker-desktop",
	"tailscale-app",
	"1password",
	"1password-cli",
	"font-0xproto-nerd-font",
	"font-sf-pro",
	"font-sf-mono",
	"sf-symbols",
	"font-sketchybar-app-font",
}

local services = {
	"sketchybar",
	"borders",
}

dots.symlink("~/.config/aerospace", ".config/aerospace")
dots.symlink("~/.config/borders", ".config/borders")
dots.symlink("~/.config/sketchybar", ".config/sketchybar")

dots.brew.enable()

dots.brew.tap({
	"FelixKratz/formulae",
})

dots.brew.install(common_packages)
dots.brew.install(packages)

dots.brew.cask(casks)

dots.command("sops age key", {
	check = "scripts/sops-age-key check",
	apply = "scripts/sops-age-key apply",
	needs = { "package:brew-cask:1password-cli" },
})

dots.command("sbarlua", {
	check = 'test -f "$HOME/.local/share/sketchybar_lua/sketchybar.so"',
	apply = [[
		tmp="$(mktemp -d)"
		git clone https://github.com/FelixKratz/SbarLua.git "$tmp"
		make -C "$tmp" install
		rm -rf "$tmp"
	]],
})

dots.brew.service.start(services)
