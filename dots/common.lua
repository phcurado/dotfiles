dots.user.shell("zsh")

dots.docker.compose("searxng", {
	file = ".config/searxng/docker-compose.yml",
})

dots.symlink("~/.config", ".config", {
	ignore = {
		"aerospace/**",
		"borders/**",
		"niri/**",
		"noctalia/**",
		"sketchybar/**",
		"sops/**",
		"wallpapers/**",
		"superfile/**",
	},
})

dots.symlink("~/.config/superfile", ".config/superfile", {
	ignore = {
		"theme/**",
	},
})
dots.symlink("~/.zshrc", ".zshrc")
dots.symlink("~/.zsh_plugins.txt", ".zsh_plugins.txt")
dots.symlink("~/.gitconfig", ".gitconfig")

dots.symlink("~/.local/share", ".local/share")

dots.symlink("~/.pi/agent", ".pi/agent", {
	ignore = {
		"auth.json",
		"sessions/**",
		"tmp/**",
		"cache/**",
	},
})

dots.fonts.install()
