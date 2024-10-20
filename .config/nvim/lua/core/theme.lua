M = {}

local filename = "colorscheme.lua"
M.filename = filename

local function set_theme()
	local file = io.open(filename, "r") -- r read mode and b binary mode
	assert(file)
	local content = file:read()
	vim.cmd.colorscheme(content)
	file:close()
	return content
end
M.set_theme = set_theme

return M
