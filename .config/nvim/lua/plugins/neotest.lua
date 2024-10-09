return {
	{
		"nvim-neotest/neotest",
		dependencies = {
			"nvim-neotest/nvim-nio",
			"nvim-lua/plenary.nvim",
			"antoinemadec/FixCursorHold.nvim",
			"nvim-treesitter/nvim-treesitter",
			-- Adapters
			"nvim-neotest/neotest-vim-test",
			"vim-test/vim-test",
			"jfpedroza/neotest-elixir",
		},
		config = function()
			require("neotest").setup({
				adapters = {
					require("neotest-elixir"),
					require("neotest-vim-test")({ allow_file_types = { "elixir", "javascript", "typescript" } }),
				},
			})
		end,
	},
}
