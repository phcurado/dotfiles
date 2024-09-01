return {
	{
		"stevearc/oil.nvim",
		opts = {},
		dependencies = { "nvim-tree/nvim-web-devicons" },
		config = function()
			vim.keymap.set("n", "-", "<CMD>Oil<CR>", { desc = "Open parent directory" })
			require("oil").setup({
				view_options = {
					-- Show files and directories that start with "."
					show_hidden = true,
				},
			})
		end,
	},
}
