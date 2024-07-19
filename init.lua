require("core.options")
require("core.keymaps")
require("core.lazy")
require("lazy").setup({
  spec = {
    { import = "plugins" },
  },
  install = { colorscheme = { "dracula" } },
  checker = { enabled = true },
})

