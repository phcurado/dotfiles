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
			require("nvim-tree").setup({
				update_focused_file = {
					enable = true,
				},
				disable_netrw = true,
				view = {
					width = 60,
					side = "right",
				},
			})
			vim.keymap.set("n", "<leader>n", ":NvimTreeToggle<CR>")
		end,
	},
}
