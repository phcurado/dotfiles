if dots.platform.family == "arch" then
	dots.systemd.enable({ "tailscaled.service" })
	dots.systemd.start({ "tailscaled.service" })
end

if dots.platform.family == "darwin" then
	dots.brew.cask({ "tailscale-app" })

	dots.command("stop twingate", {
		check = "! pgrep -x Twingate >/dev/null",
		apply = [[osascript -e 'tell application "Twingate" to quit']],
	})

	dots.command("start tailscale", {
		check = "pgrep -x Tailscale >/dev/null",
		apply = "open -g -a Tailscale",
		needs = { "package:brew-cask:tailscale-app" },
	})
end
