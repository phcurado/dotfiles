local common_packages = require("dots.packages")

local packages = {
	"1password",
	"1password-cli",
	"bluetui",
	"brave-bin",
	"cava",
	"cliphist",
	"ddcutil",
	"discord",
	"docker",
	"docker-compose",
	"ghostty",
	"github-cli",
	"grim",
	"gpu-screen-recorder",
	"inotify-tools",
	"jujutsu",
	"nautilus",
	"neovim-nightly-bin",
	"networkmanager",
	"niri",
	"noctalia-git",
	"obsidian",
	"polkit-kde-agent",
	"postgresql",
	"power-profiles-daemon",
	"qt5-wayland",
	"qt6-wayland",
	"sddm",
	"slurp",
	"tailscale",
	"ttf-0xproto-nerd",
	"unzip",
	"wl-clipboard",
	"wlsunset",
	"wtype",
	"xdg-desktop-portal-gnome",
	"xdg-desktop-portal-gtk",
	"xwayland-satellite",
}

local groups = {
	"docker",
	"wheel",
}

local systemd_services = {
	"bluetooth.service",
	"docker.service",
	"NetworkManager.service",
	"tailscaled.service",
}

dots.symlink("~/.config/niri", ".config/niri")
dots.symlink("~/.config/noctalia", ".config/noctalia")
dots.symlink("~/.config/wallpapers", ".config/wallpapers")

dots.pacman.install({
	"base-devel",
	"git",
	"paru",
})

dots.paru.install(common_packages)
dots.paru.install(packages)

dots.user.groups(groups)

dots.systemd.enable(systemd_services)
dots.systemd.start(systemd_services)
