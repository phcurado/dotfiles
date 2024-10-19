return {
	{
		"potamides/pantran.nvim",
		event = "VeryLazy",
		config = function()
			-- more info can be checked on the official docs: https://github.com/potamides/pantran.nvim/blob/main/doc/README.md
			local pantran = require("pantran")

			pantran.setup({
				default_engine = "google",
				-- Configuration for individual engines goes here.
				engines = {
					yandex = {
						-- Default languages can be defined on a per engine basis. In this case
						-- `:lua require("pantran.async").run(function()
						-- vim.pretty_print(require("pantran.engines").yandex:languages()) end)`
						-- can be used to list available language identifiers.
						default_source = "auto",
						default_target = "en",
					},
				},
				controls = {
					mappings = {
						edit = {
							n = {
								-- Use this table to add additional mappings for the normal mode in
								-- the translation window. Either strings or function references are
								-- supported.
								["j"] = "gj",
								["k"] = "gk",
							},
							i = {
								-- Similar table but for insert mode. Using 'false' disables
								-- existing keybindings.
								["<C-y>"] = false,
								["<C-a>"] = require("pantran.ui.actions").yank_close_translation,
							},
						},
					},
				},
			})
			local opts = { noremap = true, silent = true, expr = true }
			vim.keymap.set("n", "<leader>tr", pantran.motion_translate, opts)
			vim.keymap.set("n", "<leader>trr", function()
				return pantran.motion_translate() .. "_"
			end, opts)
			vim.keymap.set("x", "<leader>tr", pantran.motion_translate, opts)
		end,
	},
}
