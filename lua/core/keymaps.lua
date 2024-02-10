-- define common options
local opts = {
  noremap = true, -- non-recursive
  silent = true, -- do not show message
}

vim.keymap.set('n', '<C-j>', '<C-e>', opts)
vim.keymap.set('n', '<C-k>', '<C-y>', opts)
