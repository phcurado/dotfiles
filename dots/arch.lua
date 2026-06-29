dots.symlink("~/.config/niri", ".config/niri")
dots.symlink("~/.config/noctalia", ".config/noctalia")
dots.symlink("~/.config/wallpapers", ".config/wallpapers")

dots.pacman.install({ "base-devel", "git", "paru" })
dots.paru.install({ "1password", "bat", "docker", "ripgrep" })

dots.user.groups({ "docker" })

dots.systemd.enable({ "docker.service" })
dots.systemd.start({ "docker.service" })
