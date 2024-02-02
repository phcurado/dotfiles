vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

require("nvim-tree").setup({
  view = {
    width = 35,
  }
})

--vim.keymap.set('n', '<c-n>', ':NvimTreeFindFile<CR>')
vim.keymap.set('n', '<c-n>', ':NvimTreeToggle<CR>')
