return {
	"nvim-lualine/lualine.nvim",
	dependencies = { "nvim-tree/nvim-web-devicons" },
	config = function()
		require("lualine").setup({
			options = {
				disabled_filetypes = {
					"NvimTree",
				},
				-- icons_enabled = true,
				component_separators = { left = "|", right = "|" },
			},
			sections = {
				lualine_c = {
					{
						"filename",
						path = 4,
						symbols = {
							modified = " ●",
							alternate_file = "#",
							directory = "",
						},
					},
				},
			},
		})
	end,
}
