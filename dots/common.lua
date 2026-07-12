dots.user.shell("zsh")

local ssh_key = dots.ssh.keypair("default", {
	path = "~/.ssh/id_ed25519",
	passphrase = false,
})

dots.output("ssh_public_key", {
	value = ssh_key.public_key,
})

dots.output("ssh_fingerprint", {
	value = ssh_key.fingerprint,
})

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
