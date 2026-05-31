return {
  dir = vim.fn.stdpath("config") .. "/lua/core/theme_persistence",
  name = "theme_persistence",
  lazy = false,
  priority = 2000,
  config = function()
    require("core.theme_persistence").setup({
      default_colorscheme = "catppuccin-mocha",
      default_transparent = true,
    })
  end,
  keys = {
    {
      "<leader>ft",
      function()
        require("core.theme_persistence").pick_theme()
      end,
      desc = "Pick colorscheme",
    },
    {
      "<leader>uT",
      function()
        require("core.theme_persistence").toggle_transparent()
      end,
      desc = "Toggle transparency",
    },
  },
}
