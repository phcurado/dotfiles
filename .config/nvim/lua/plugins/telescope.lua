local builtin = require("telescope.builtin")

return {
	{
		"nvim-telescope/telescope.nvim",
		dependencies = {
			"nvim-lua/plenary.nvim",
			"nvim-tree/nvim-web-devicons",
			{
				"nvim-telescope/telescope-fzf-native.nvim",
				build = "cmake -S. -Bbuild -DCMAKE_BUILD_TYPE=Release && cmake --build build --config Release",
			},
		},
		keys = {
			{ "<leader>ff", builtin.find_files, desc = "Find files" },
			{ "<leader>fg", builtin.live_grep, desc = "Live grep" },
			{ "<leader>fb", builtin.buffers, desc = "Buffers" },
			{ "<leader>fh", builtin.help_tags, desc = "Help tags" },
			{ "<leader>fr", builtin.resume, desc = "Resume" },
		},
		config = function()
			local actions = require("telescope.actions")

			require("telescope").setup({
				pickers = {
					colorscheme = {
						enable_preview = true,
					},
					live_grep = {
						file_ignore_patterns = { ".git/" },
						additional_args = function(_)
							return { "--hidden" }
						end,
					},
					find_files = {
						file_ignore_patterns = { ".git/" },
						hidden = true,
					},
					buffers = {
						initial_mode = "normal",
					},
				},
				extensions = {
					fzf = {
						fuzzy = true, -- false will only do exact matching
						override_generic_sorter = true, -- override the generic sorter
						override_file_sorter = true, -- override the file sorter
						case_mode = "smart_case", -- or "ignore_case" or "respect_case"
					},
				},
				defaults = {
					mappings = {
						i = {
							["<C-s>"] = actions.cycle_previewers_next,
							["<C-a>"] = actions.cycle_previewers_prev,
						},
					},
					preview = {
						filesize_limit = 0.1,
						mime_hook = function(filepath, bufnr, opts)
							local is_image = function(filepath)
								local image_extensions = { "png", "jpg", "svg" } -- Supported image formats
								local split_path = vim.split(filepath:lower(), ".", { plain = true })
								local extension = split_path[#split_path]
								return vim.tbl_contains(image_extensions, extension)
							end
							if is_image(filepath) then
								local term = vim.api.nvim_open_term(bufnr, {})
								local function send_output(_, data, _)
									for _, d in ipairs(data) do
										vim.api.nvim_chan_send(term, d .. "\r\n")
									end
								end
								vim.fn.jobstart({
									"chafa",
									filepath, -- Terminal image viewer command
								}, { on_stdout = send_output, stdout_buffered = true, pty = true })
							else
								require("telescope.previewers.utils").set_preview_message(
									bufnr,
									opts.winid,
									"Binary cannot be previewed"
								)
							end
						end,
					},
				},
			})

			require("telescope").load_extension("fzf")
		end,
	},
}
