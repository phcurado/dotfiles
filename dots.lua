require("dots.common")

if dots.platform.family == "arch" then
	require("dots.arch")
end

if dots.platform.family == "darwin" then
	require("dots.macos")
end

if dots.profile == "personal" then
	require("dots.profiles.personal")
end

if dots.profile == "work" then
	require("dots.profiles.work")
end

if dots.profile == "company" then
	require("dots.profiles.company")
end

require("dots.tools")
