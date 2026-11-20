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
	"omniwm",
	"ghostty",
	"brave-browser",
	"discord",
	"obsidian",
	"docker-desktop",
	"tailscale-app",
	"twingate",
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

dots.symlink("~/.config/omniwm/settings.toml", ".config/omniwm/settings.toml")
dots.symlink("~/Library/LaunchAgents/local.omniwm-sketchybar.plist", ".config/omniwm/local.omniwm-sketchybar.plist")
dots.symlink("~/.config/borders", ".config/borders")
dots.symlink("~/.config/sketchybar", ".config/sketchybar")
dots.symlink("~/.config/rex", ".config/rex")

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

dots.command("omniwm login", {
	check = [[osascript -e 'tell application "System Events" to get name of every login item' | grep -qw OmniWM]],
	apply = [[osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/OmniWM.app", hidden:false}']],
	needs = { "package:brew-cask:omniwm" },
})

dots.command("omniwm sketchybar events", {
	check = [[launchctl print "gui/$(id -u)/local.omniwm-sketchybar" >/dev/null 2>&1]],
	apply = [[launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/local.omniwm-sketchybar.plist"]],
	needs = {
		"package:brew-cask:omniwm",
		"package:brew:sketchybar",
	},
})
