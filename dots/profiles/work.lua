if dots.platform.family == "arch" then
	dots.systemd.enable({ "twingate.service" })
	dots.systemd.start({ "twingate.service" })
end

if dots.platform.family == "darwin" then
	dots.brew.cask({ "twingate" })
end
