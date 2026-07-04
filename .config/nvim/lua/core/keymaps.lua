-- define common options
local opts = {
  noremap = true, -- non-recursive
  silent = true, -- do not show message
}

-- Go to middle and center
vim.keymap.set("n", "<C-d>", "<C-d>zz", opts)
vim.keymap.set("n", "<C-u>", "<C-u>zz", opts)

-- split windows
vim.keymap.set("n", "<leader>sv", ":vs<CR>")
vim.keymap.set("n", "<leader>sh", ":split<CR>")

-- Buffer changes
vim.keymap.set("n", "]b", ":bnext<cr>", opts)
vim.keymap.set("n", "[b", ":bprevious<cr>", opts)

-- Nice to have
vim.keymap.set("n", "<leader>w", ":w<CR>", opts) -- Quick save
vim.keymap.set("n", "<Esc>", ":noh<CR>", opts) -- Clear search highlight
vim.keymap.set("n", "q:", "<Nop>", opts) -- Disable accidental command-line window

-- Vim plugins keymaps

-- undotree (built-in 0.12)
vim.keymap.set("n", "<leader>u", ":Undotree<CR>", opts)

-- goto-preview
vim.keymap.set("n", "gpd", "<cmd>lua require('goto-preview').goto_preview_definition()<CR>", { noremap = true })
vim.keymap.set("n", "gpt", "<cmd>lua require('goto-preview').goto_preview_type_definition()<CR>", { noremap = true })
vim.keymap.set("n", "gpi", "<cmd>lua require('goto-preview').goto_preview_implementation()<CR>", { noremap = true })
vim.keymap.set("n", "gpD", "<cmd>lua require('goto-preview').goto_preview_declaration()<CR>", { noremap = true })
vim.keymap.set("n", "gP", "<cmd>lua require('goto-preview').close_all_win()<CR>", { noremap = true })
vim.keymap.set("n", "gpr", "<cmd>lua require('goto-preview').goto_preview_references()<CR>", { noremap = true })

-- Exra commands

-- vim.keymap.set("n", "<leader>cp", ":let @+=@%<cr>", opts)

-- quickfix list
vim.keymap.set("n", "<leader>qr", ":call setqflist([])<CR> ", { noremap = true, desc = "Clean quickfix list" })
vim.keymap.set("n", "<leader>qo", ":copen<CR>", { noremap = true, desc = "Open quickfix list" })
vim.keymap.set("n", "<leader>qc", ":cclose<CR>", { noremap = true, desc = "Close quickfix list" })
vim.keymap.set("n", "<leader>qn", ":cnext<CR>", { noremap = true, desc = "Next quickfix list" })
vim.keymap.set("n", "<leader>qp", ":cprev<CR>", { noremap = true, desc = "Prev quickfix list" })
