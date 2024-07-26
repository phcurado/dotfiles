return {
	{
		"Mofiqul/dracula.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			-- vim.cmd.colorscheme("dracula")
		end,
	},
	{
		"navarasu/onedark.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			-- require("onedark").load()
		end,
	},
	{
		"ellisonleao/gruvbox.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			-- require("gruvbox").setup({
			-- 	contrast = "hard", -- can be "hard", "soft" or empty string
			-- })
			-- vim.cmd.colorscheme("gruvbox")
		end,
	},
	{
		"sainnhe/gruvbox-material",
		lazy = false,
		priority = 1000,
		config = function()
			-- :h gruvbox-material.txt
			vim.g.gruvbox_material_enable_italic = true
			vim.cmd.colorscheme("gruvbox-material")
		end,
	},
}
