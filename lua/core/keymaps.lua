-- define common options
local opts = {
  noremap = true, -- non-recursive
  silent = true, -- do not show message
}


-- Move up and down with JK
vim.keymap.set('n', '<C-j>', '<C-e>', opts)
vim.keymap.set('n', '<C-k>', '<C-y>', opts)

-- Move selected lines in visual mode up or down, awesome!
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")

-- split windows
vim.keymap.set("n", "<leader>sv", ":vs<CR>")
vim.keymap.set("n", "<leader>sh", ":split<CR>")

-- start a terminal with iex
vim.keymap.set("n", "<leader>ex", ":below 18 sp<CR>:term<CR>iiex", { silent = true })


-- Go to middle and center
vim.keymap.set("n", "<C-d>", "<C-d>zz")
vim.keymap.set("n", "<C-u>", "<C-u>zz")
