return {
	{
		"nvim-treesitter/nvim-treesitter",
		build = ":TSUpdate",
		config = function()
			require("nvim-treesitter.configs").setup({
				ensure_installed = {
					"lua",
					"elixir",
					"heex",
					"json",
					"javascript",
					"html",
					"css",
					"markdown",
					"bash",
					"dockerfile",
					"gitignore",
				},
				sync_install = false,
				auto_install = true,

				highlight = {
					enable = true,
				},
				indent = { enable = true },
			})
		end,
	},
}
