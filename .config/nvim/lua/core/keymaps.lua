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
-- Deprecated in favour of mini.move plugin
-- vim.keymap.set("v", "<C-j>", ":m '>+1<CR>gv=gv")
-- vim.keymap.set("v", "<C-k>", ":m '<-2<CR>gv=gv")
-- vim.keymap.set("v", "<C-h>", "<gv")
-- vim.keymap.set("v", "<C-l>", ">gv")

-- split windows
vim.keymap.set("n", "<leader>sv", ":vs<CR>")
vim.keymap.set("n", "<leader>sh", ":split<CR>")

-- start a terminal with iex
vim.keymap.set("n", "<leader>ex", ":below 18 sp<CR>:term<CR>iiex", { silent = true })

-- Buffer changes
vim.keymap.set("n", "<C-l>", ":bnext<cr>", opts)
vim.keymap.set("n", "<C-h>", ":bprevious<cr>", opts)
-- vim.keymap.set("n", "<leader>d", ":bdelete<cr>", opts) -- Disabling :bdelete keymaps for the snacks bufdelete plugin

-- Pasting options
vim.keymap.set("n", "p", "]p", opts)

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

-- quickfix list
vim.keymap.set("n", "<leader>qr", ":call setqflist([])<CR> ", { noremap = true, desc = "Clean quickfix list" })
vim.keymap.set("n", "<leader>qo", ":copen<CR>", { noremap = true, desc = "Open quickfix list" })
vim.keymap.set("n", "<leader>qc", ":cclose<CR>", { noremap = true, desc = "Close quickfix list" })
vim.keymap.set("n", "<leader>qn", ":cnext<CR>", { noremap = true, desc = "Next quickfix list" })
vim.keymap.set("n", "<leader>qp", ":cprev<CR>", { noremap = true, desc = "Prev quickfix list" })

-- FzfLua
vim.keymap.set("n", "<leader>ff", ":FzfLua files<CR>", { noremap = true, desc = "Find files" })
vim.keymap.set("n", "<leader>fg", ":FzfLua grep<CR>", { noremap = true, desc = "Live grep" })
vim.keymap.set("n", "<leader>fb", ":FzfLua buffers<CR>", { noremap = true, desc = "Buffers" })
vim.keymap.set("n", "<leader>fr", ":FzfLua resume<CR>", { noremap = true, desc = "Resume" })
