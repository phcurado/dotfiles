local config = require("core.config")

return {
  {
    "Mofiqul/dracula.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("dracula").setup({
        transparent_bg = config.transparent_background,
      })
      -- vim.cmd.colorscheme("dracula")
    end,
  },
  {
    "navarasu/onedark.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("onedark").setup({
        transparent = config.transparent_background,
      })
    end,
  },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 1000,
    opts = {},
    config = function()
      require("catppuccin").setup({
        transparent_background = config.transparent_background,
      })
      -- vim.cmd.colorscheme("catppuccin")
    end,
  },
  {
    "ellisonleao/gruvbox.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("gruvbox").setup({
        transparent_mode = config.transparent_background,
        -- contrast = "soft", -- can be "hard", "soft" or empty string
      })
      -- vim.opt.background = "light"
      -- vim.cmd.colorscheme("gruvbox")
    end,
  },
  {
    "sainnhe/gruvbox-material",
    lazy = false,
    priority = 1000,
    config = function()
      -- :h gruvbox-material.txt
      -- vim.g.gruvbox_material_background = "hard"
      --
      -- For better performance
      vim.g.gruvbox_material_better_performance = 1
      vim.g.gruvbox_material_enable_italic = true
      -- vim.g.gruvbox_material_foreground = "mix"
      vim.g.gruvbox_material_transparent_background = config.transparent_background and 1 or 0
      -- vim.cmd.colorscheme("gruvbox-material")
    end,
  },
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      require("tokyonight").setup({
        transparent = config.transparent_background,
      })
      -- vim.cmd.colorscheme("tokyonight-storm")
    end,
  },
  {
    "rebelot/kanagawa.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      -- Default options:
      require("kanagawa").setup({
        transparent = config.transparent_background,
      })
      -- vim.cmd.colorscheme("kanagawa-lotus")
    end,
  },
  {
    "rose-pine/neovim",
    name = "rose-pine",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      require("rose-pine").setup({
        styles = {
          transparency = config.transparent_background,
        },
      })
      -- vim.cmd.colorscheme("rose-pine")
    end,
  },
  {
    "Mofiqul/vscode.nvim",
    lazy = false,
    priority = 1000,
    opts = {},
    config = function()
      require("vscode").setup({
        transparent = config.transparent_background,
        italic_comments = true,
        underline_links = true,
        disable_nvimtree_bg = true,
      })
    end,
  },
  {
    "gbprod/nord.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("nord").setup({
        transparent = config.transparent_background,
      })
    end,
  },
  {
    "AhmedAbdulrahman/aylin.vim",
    lazy = false,
    priority = 1000,
    branch = "0.5-nvim",
  },
}
