local common_packages = require("dots.packages")

local packages = {
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

dots.brew.tap({
	"FelixKratz/formulae",
})

dots.brew.install(common_packages)
dots.brew.install(packages)

dots.brew.cask(casks)

dots.brew.service.start(services)
