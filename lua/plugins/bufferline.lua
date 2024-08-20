return {
	{
		"akinsho/bufferline.nvim",
		dependencies = { "nvim-tree/nvim-web-devicons" },
		config = function()
			require("bufferline").setup({
				options = {
					-- separator_style = "slant" | "slope" | "thick" | "thin" | { 'any', 'any' },
					separator_style = "thin",
				},
			})
		end,
	},
}
