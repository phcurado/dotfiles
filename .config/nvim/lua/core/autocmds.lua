local theme = require("core.theme")

local function write_file(path, content)
	local file = io.open(path, "w")
	assert(file)
	file:write(content)
	file:close()
end

-- prevent commenting next line
vim.api.nvim_create_autocmd("FileType", {
	pattern = "*",
	callback = function()
		vim.opt_local.formatoptions:remove({ "r", "o" })
	end,
})

-- save colorscheme into a file so it's possible to persist the current theme
vim.api.nvim_create_autocmd("ColorScheme", {
	callback = function(args)
		local colorscheme = args.match
		write_file(theme.path, colorscheme)
		vim.notify("Color scheme changed to " .. colorscheme, vim.log.levels.INFO)
	end,
})
