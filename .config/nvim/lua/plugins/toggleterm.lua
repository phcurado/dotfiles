return {
	{
		"akinsho/toggleterm.nvim",
		config = function()
			local toggleterm = require("toggleterm")

			toggleterm.setup({
				size = 25,
				open_mapping = [[<c-\>]],
				start_in_insert = true,
				persist_size = true,
				direction = "horizontal",
				autochdir = true,
				close_on_exit = true,
				float_opts = {
					border = "double",
					width = 100,
					height = 20,
				},
			})

			function _G.set_terminal_keymaps()
				local opts = { buffer = 0 }
				vim.keymap.set("t", "<esc>", [[<C-\><C-n>]], opts)
				vim.keymap.set("t", "jk", [[<C-\><C-n>]], opts)
				vim.keymap.set("t", "<C-h>", [[<Cmd>wincmd h<CR>]], opts)
				vim.keymap.set("t", "<C-j>", [[<Cmd>wincmd j<CR>]], opts)
				vim.keymap.set("t", "<C-k>", [[<Cmd>wincmd k<CR>]], opts)
				vim.keymap.set("t", "<C-l>", [[<Cmd>wincmd l<CR>]], opts)
				vim.keymap.set("t", "<C-w>", [[<C-\><C-n><C-w>]], opts)
			end

			vim.cmd("autocmd! TermOpen term://* lua set_terminal_keymaps()")

			local Terminal = require("toggleterm.terminal").Terminal
			local lazygit = Terminal:new({
				cmd = "lazygit",
				dir = "git_dir",
				direction = "float",
				float_opts = {
					border = "double",
					width = 150,
					height = 50,
				},
				-- function to run on opening the terminal
				on_open = function(term)
					vim.cmd("startinsert!")
					vim.api.nvim_buf_set_keymap(term.bufnr, "t", "<esc>", "<esc>", { noremap = true, silent = true })
				end,
				-- function to run on closing the terminal
				on_close = function()
					vim.cmd("startinsert!")
				end,
			})

			function _Lazygit_toggle()
				lazygit:toggle()
			end

			vim.api.nvim_set_keymap(
				"n",
				"<leader>g",
				"<cmd>lua _Lazygit_toggle()<CR>",
				{ noremap = true, silent = true }
			)
		end,
	},
}
