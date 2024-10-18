-- define common options
local opts = {
	noremap = true, -- non-recursive
	silent = true, -- do not show message
}

-- Move up and down with JK
vim.keymap.set("n", "<C-j>", "<C-e>", opts)
vim.keymap.set("n", "<C-k>", "<C-y>", opts)

-- Go to middle and center
vim.keymap.set("n", "<C-d>", "<C-d>zz", opts)
vim.keymap.set("n", "<C-u>", "<C-u>zz", opts)

-- Move selected lines in visual mode up or down, awesome!
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

-- split windows
vim.keymap.set("n", "<leader>sv", ":vs<CR>")
vim.keymap.set("n", "<leader>sh", ":split<CR>")

-- start a terminal with iex
vim.keymap.set("n", "<leader>ex", ":below 18 sp<CR>:term<CR>iiex", { silent = true })

-- Buffer changes
vim.keymap.set("n", "<C-l>", ":bnext<cr>", opts)
vim.keymap.set("n", "<C-h>", ":bprevious<cr>", opts)
vim.keymap.set("n", "<leader>d", ":bdelete<cr>", opts)

-- Vim plugins keymaps

-- undotree
vim.keymap.set("n", "<leader>u", vim.cmd.UndotreeToggle)

-- goto-preview
vim.keymap.set("n", "gpd", "<cmd>lua require('goto-preview').goto_preview_definition()<CR>", { noremap = true })
vim.keymap.set("n", "gpt", "<cmd>lua require('goto-preview').goto_preview_type_definition()<CR>", { noremap = true })
vim.keymap.set("n", "gpi", "<cmd>lua require('goto-preview').goto_preview_implementation()<CR>", { noremap = true })
vim.keymap.set("n", "gpD", "<cmd>lua require('goto-preview').goto_preview_declaration()<CR>", { noremap = true })
vim.keymap.set("n", "gP", "<cmd>lua require('goto-preview').close_all_win()<CR>", { noremap = true })
vim.keymap.set("n", "gpr", "<cmd>lua require('goto-preview').goto_preview_references()<CR>", { noremap = true })

-- Exra commands

-- vim.keymap.set("n", "<leader>cp", ":let @+=@%<cr>", opts)
vim.keymap.set("n", "<leader>cp", ':lua require("telescope_filepaths").list_paths()<cr>', opts)

-- vim-translator
-- vim.keymap.set({ "n", "v" }, "<leader>tee", ":TranslateR --target_lang=et <CR>", { noremap = true })
-- vim.keymap.set({ "n", "v" }, "<leader>ten", ":TranslateR --source_lang=et --target_lang=en <CR>", { noremap = true })
