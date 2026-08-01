if dots.platform.family == "arch" then
	dots.systemd.enable({ "tailscaled.service" })
	dots.systemd.start({ "tailscaled.service" })
end
