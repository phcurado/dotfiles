return {
	{
		"elixir-tools/elixir-tools.nvim",
		event = { "BufReadPre", "BufNewFile" },
		config = function()
			require("elixir").setup({
				-- Disabling both LS since it's concurrently running with LSP config
				nextls = {
					enable = false,
					cmd = "nextls",
				},
				elixirls = {
					enable = false,
					cmd = "elixir-ls",
				},
				projectionist = { enable = true },
			})
		end,
	},
}
