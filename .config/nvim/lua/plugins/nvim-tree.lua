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
				disable_netrw = true,
				view = {
					float = {
						enable = true,
						quit_on_focus_loss = true,
						open_win_config = {
							relative = "editor",
							border = "rounded",
							width = 60,
							height = 60,
							row = 1,
							col = 1,
						},
					},
				},
			})
			vim.keymap.set("n", "<c-n>", ":NvimTreeToggle<CR>")
		end,
	},
}
