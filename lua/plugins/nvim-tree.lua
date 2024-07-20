return {
	{
		"nvim-tree/nvim-tree.lua",
		lazy = false,
		view = {
			width = 35,
		},
		dependencies = {
			"nvim-tree/nvim-web-devicons",
		},
		opts = {},
		config = function()
			vim.g.loaded_netrw = 1
			vim.g.loaded_netrwPlugin = 1
			require("nvim-tree").setup()
			vim.keymap.set("n", "<c-n>", ":NvimTreeToggle<CR>")
		end,
	},
	{
		"mbbill/undotree",
		event = "VeryLazy",
		cofig = function()
			local undotree = require("undotree")
			undotree.setup()
		end,
	},
}
