return {
  dir = vim.fn.stdpath("config") .. "/lua/core/theme_persistence",
  name = "theme_persistence",
  lazy = false,
  priority = 2000,
  config = function()
    require("core.theme_persistence").setup({})
  end,
}
