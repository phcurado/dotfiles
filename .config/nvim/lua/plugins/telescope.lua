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
			{ "<leader>ff", require("telescope.builtin").find_files, desc = "Find files" },
			{ "<leader>fg", require("telescope.builtin").live_grep, desc = "Live grep" },
			{ "<leader>fb", require("telescope.builtin").buffers, desc = "Buffers" },
			{ "<leader>fh", require("telescope.builtin").help_tags, desc = "Help tags" },
			{ "<leader>fr", require("telescope.builtin").resume, desc = "Resume" },
		},
		config = function()
			local actions = require("telescope.actions")

			require("telescope").setup({
				pickers = {
					colorscheme = {
						-- Disabling preview since colorschemes are now saved in a cache file
						enable_preview = false,
					},
					live_grep = {
						file_ignore_patterns = { ".git/" },
						additional_args = function(_)
							return { "--hidden" }
						end,
					},
					find_files = {
						find_command = { "rg", "--files", "--sortr=modified" },
						file_ignore_patterns = { ".git/" },
						hidden = true,
					},
					buffers = {
						initial_mode = "normal",
						theme = "dropdown",
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
						n = {
							["dd"] = actions.delete_buffer,
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
