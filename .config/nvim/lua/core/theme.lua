M = {}

local function getHomePath()
	local uname = vim.loop.os_uname()
	local os_name = uname.sysname
	local is_mac = os_name == "Darwin"
	local is_linux = os_name == "Linux"
	local is_windows = os_name:find("Windows") and true or false
	local home = ""

	if is_linux or is_mac then
		home = os.getenv("HOME") or ""
	elseif is_windows then
		home = os.getenv("USERPROFILE") or ""
	end

	return home
end

local filename = ".colorscheme.lua"
local path = getHomePath() .. "/.config/nvim/" .. filename

M.filename = filename
M.path = path

local function set_theme()
	local file = io.open(path, "r") -- r read mode and b binary mode
	if not file then
		return
	end
	local content = file:read()
	vim.cmd.colorscheme(content)
	file:close()
	return content
end

M.set_theme = set_theme

return M
