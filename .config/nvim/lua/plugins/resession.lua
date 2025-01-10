return {
	"stevearc/resession.nvim",
	opts = {},
	config = function()
		local resession = require("resession")
		resession.setup()
		vim.keymap.set("n", "<leader>ss", resession.save)
		vim.keymap.set("n", "<leader>sl", resession.load)
		vim.keymap.set("n", "<leader>sd", resession.delete)
	end,
}
