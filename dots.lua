require("dots.common")

if dots.platform.family == "arch" then
	require("dots.arch")
end

if dots.platform.family == "darwin" then
	require("dots.macos")
end

require("dots.tools")
