return {
	{
		"voldikss/vim-translator",
		event = "VeryLazy",
		config = function()
			-- Adding some keymaps for estonian translations
			vim.keymap.set({ "n", "v" }, "<leader>tee", ":TranslateR --target_lang=et <CR>", { noremap = true })
			vim.keymap.set(
				{ "n", "v" },
				"<leader>ten",
				":TranslateR --source_lang=et --target_lang=en <CR>",
				{ noremap = true }
			)
		end,
	},
}
