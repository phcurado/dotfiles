if dots.platform.family == "arch" then
	dots.systemd.enable({ "twingate.service" })
	dots.systemd.start({ "twingate.service" })
end

if dots.platform.family == "darwin" then
	dots.command("stop tailscale", {
		check = "! pgrep -x Tailscale >/dev/null",
		apply = [[osascript -e 'tell application "Tailscale" to quit']],
	})

	dots.command("start twingate", {
		check = "pgrep -x Twingate >/dev/null",
		apply = "open -g -a Twingate",
		needs = { "package:brew-cask:twingate" },
	})
end
