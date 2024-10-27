return {
	"norcalli/nvim-colorizer.lua",
	event = "VeryLazy",
	opts = {},
	config = function()
		require("colorizer").setup()
	end,
}
