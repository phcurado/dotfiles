return {
	{
		"saghen/blink.cmp",
		-- optional: provides snippets for the snippet source
		dependencies = "rafamadriz/friendly-snippets",
		version = "*",
		opts = {
			-- 'default' for mappings similar to built-in completion
			-- 'super-tab' for mappings similar to vscode (tab to accept, arrow keys to navigate)
			-- 'enter' for mappings similar to 'super-tab' but with 'enter' to accept
			-- See the full "keymap" documentation for information on defining your own keymap.
			keymap = { preset = "super-tab" },

			appearance = {
				-- Sets the fallback highlight groups to nvim-cmp's highlight groups
				-- Useful for when your theme doesn't support blink.cmp
				-- Will be removed in a future release
				use_nvim_cmp_as_default = true,
				-- Set to 'mono' for 'Nerd Font Mono' or 'normal' for 'Nerd Font'
				-- Adjusts spacing to ensure icons are aligned
				nerd_font_variant = "mono",
			},

			-- Default list of enabled providers defined so that you can extend it
			-- elsewhere in your config, without redefining it, due to `opts_extend`
			sources = {
				default = { "lsp", "path", "snippets", "buffer" },
			},
			completion = {
				accept = {
					-- experimental auto-brackets support
					auto_brackets = {
						enabled = true,
					},
				},
				list = {
					selection = "auto_insert",
				},
				menu = {
					border = "rounded",
					winhighlight = "Normal:Normal,FloatBorder:BorderBG,CursorLine:PmenuSel,Search:None",

					draw = {
						treesitter = { "lsp" },
					},
				},
				documentation = {
					auto_show = true,
					auto_show_delay_ms = 200,
					window = {
						border = "rounded",
						winhighlight = "Normal:Normal,FloatBorder:BorderBG,CursorLine:PmenuSel,Search:None",
					},
				},
			},
			-- signature = {
			-- 	enabled = true,
			-- 	window = {
			-- 		border = "rounded",
			-- 		winhighlight = "Normal:Normal,FloatBorder:BorderBG,CursorLine:PmenuSel,Search:None",
			-- 	},
			-- },
		},
		opts_extend = { "sources.default" },
	},
}
