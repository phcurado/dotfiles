return {
	"famiu/bufdelete.nvim",
	event = "VeryLazy",
	config = function()
		vim.keymap.set("n", "<leader>d", ":Bdelete<cr>", { noremap = true })
	end,
}
