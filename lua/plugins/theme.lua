return {
	{
		"Mofiqul/dracula.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			-- vim.cmd([[colorscheme dracula]])
		end,
	},
	{
		"navarasu/onedark.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			vim.cmd([[colorscheme onedark]])
		end,
	},
	{
		"ellisonleao/gruvbox.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			-- vim.cmd([[colorscheme gruvbox]])
		end,
	},
}
