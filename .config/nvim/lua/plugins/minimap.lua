return {
	{
		"gorbit99/codewindow.nvim",
		config = function()
			local codewindow = require("codewindow")
			codewindow.setup({
				active_in_terminals = false, -- Should the minimap activate for terminal buffers
				auto_enable = true, -- Automatically open the minimap when entering a (non-excluded) buffer (accepts a table of filetypes)
				minimap_width = 10, -- The width of the text part of the minimap
				window_border = "none",
			})
			codewindow.apply_default_keybinds()
		end,
	},
}
